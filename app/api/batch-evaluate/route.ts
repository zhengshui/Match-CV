import { db } from "@/db/drizzle";
import { evaluation, resume, job } from "@/db/schema";
import { auth } from "@/lib/auth";
import { evaluateResume, sortEvaluationsByScore } from "@/lib/resume-evaluator";
import { headers } from "next/headers";
import { nanoid } from "nanoid";
import { eq, and, inArray } from "drizzle-orm";
import { z } from "zod";

const BatchEvaluationRequestSchema = z.object({
  resumeIds: z.array(z.string()).min(1),
  jobId: z.string(),
});

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { resumeIds, jobId } = BatchEvaluationRequestSchema.parse(body);

    // Fetch job data
    const [jobData] = await db
      .select()
      .from(job)
      .where(and(eq(job.id, jobId), eq(job.userId, session.user.id)))
      .limit(1);

    if (!jobData) {
      return Response.json({ error: "Job not found" }, { status: 404 });
    }

    // Fetch all resumes
    const resumes = await db
      .select()
      .from(resume)
      .where(
        and(
          inArray(resume.id, resumeIds),
          eq(resume.userId, session.user.id)
        )
      );

    if (resumes.length === 0) {
      return Response.json({ error: "No resumes found" }, { status: 404 });
    }

    // Process each resume
    const evaluationPromises = resumes.map(async (resumeData) => {
      try {
        // Check if evaluation already exists
        const existingEvaluation = await db
          .select()
          .from(evaluation)
          .where(
            and(
              eq(evaluation.resumeId, resumeData.id),
              eq(evaluation.jobId, jobId),
              eq(evaluation.userId, session.user.id)
            )
          )
          .limit(1);

        if (existingEvaluation.length > 0) {
          return {
            resumeId: resumeData.id,
            evaluation: existingEvaluation[0],
            isExisting: true,
          };
        }

        // Evaluate resume against job
        const evaluationResult = await evaluateResume(resumeData, jobData);

        // Save evaluation to database
        const evaluationId = nanoid();
        const savedEvaluation = await db.insert(evaluation).values({
          id: evaluationId,
          resumeId: resumeData.id,
          jobId: jobId,
          overallScore: evaluationResult.overallScore.toString(),
          skillsScore: evaluationResult.skillsScore?.toString(),
          experienceScore: evaluationResult.experienceScore?.toString(),
          educationScore: evaluationResult.educationScore?.toString(),
          breakdown: evaluationResult.breakdown,
          recommendation: evaluationResult.recommendation,
          strengths: evaluationResult.strengths,
          weaknesses: evaluationResult.weaknesses,
          userId: session.user.id,
        }).returning();

        return {
          resumeId: resumeData.id,
          evaluation: savedEvaluation[0],
          evaluationResult,
          isExisting: false,
        };
      } catch (error) {
        console.error(`Error evaluating resume ${resumeData.id}:`, error);
        return {
          resumeId: resumeData.id,
          error: "Failed to evaluate resume",
        };
      }
    });

    const results = await Promise.all(evaluationPromises);
    
    // Separate successful evaluations from errors
    const successfulEvaluations = results.filter(r => !r.error);
    const errors = results.filter(r => r.error);

    // Sort evaluations by score
    const sortedEvaluations = sortEvaluationsByScore(successfulEvaluations);

    return Response.json({
      success: true,
      evaluations: sortedEvaluations,
      errors: errors,
      summary: {
        total: resumeIds.length,
        successful: successfulEvaluations.length,
        errors: errors.length,
        existing: successfulEvaluations.filter(e => e.isExisting).length,
        new: successfulEvaluations.filter(e => !e.isExisting).length,
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid batch evaluation data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error in batch evaluation:", error);
    return Response.json(
      { error: "Failed to perform batch evaluation" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return Response.json({ error: "Job ID is required" }, { status: 400 });
    }

    // Get all evaluations for this job, sorted by score
    const evaluations = await db
      .select({
        id: evaluation.id,
        resumeId: evaluation.resumeId,
        jobId: evaluation.jobId,
        overallScore: evaluation.overallScore,
        skillsScore: evaluation.skillsScore,
        experienceScore: evaluation.experienceScore,
        educationScore: evaluation.educationScore,
        breakdown: evaluation.breakdown,
        recommendation: evaluation.recommendation,
        strengths: evaluation.strengths,
        weaknesses: evaluation.weaknesses,
        createdAt: evaluation.createdAt,
      })
      .from(evaluation)
      .where(
        and(
          eq(evaluation.jobId, jobId),
          eq(evaluation.userId, session.user.id)
        )
      )
      .orderBy(evaluation.overallScore);

    // Get resume info for each evaluation
    const resumeIds = evaluations.map(e => e.resumeId);
    const resumes = await db
      .select({
        id: resume.id,
        filename: resume.filename,
        createdAt: resume.createdAt,
      })
      .from(resume)
      .where(inArray(resume.id, resumeIds));

    // Combine evaluation and resume data
    const results = evaluations.map(eval => {
      const resumeInfo = resumes.find(r => r.id === eval.resumeId);
      return {
        ...eval,
        resumeFilename: resumeInfo?.filename || "Unknown",
        resumeCreatedAt: resumeInfo?.createdAt,
      };
    });

    // Sort by overall score (descending)
    const sortedResults = sortEvaluationsByScore(results);

    return Response.json({
      evaluations: sortedResults,
      summary: {
        total: results.length,
        strongMatches: results.filter(r => parseFloat(r.overallScore) >= 80).length,
        goodMatches: results.filter(r => parseFloat(r.overallScore) >= 60 && parseFloat(r.overallScore) < 80).length,
        potentialMatches: results.filter(r => parseFloat(r.overallScore) >= 40 && parseFloat(r.overallScore) < 60).length,
        poorMatches: results.filter(r => parseFloat(r.overallScore) < 40).length,
      },
    });

  } catch (error) {
    console.error("Error fetching batch evaluation results:", error);
    return Response.json(
      { error: "Failed to fetch batch evaluation results" },
      { status: 500 }
    );
  }
}