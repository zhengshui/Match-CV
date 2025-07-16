import { db } from "@/db/drizzle";
import { evaluation, resume, job } from "@/db/schema";
import { auth } from "@/lib/auth";
import { evaluateResume } from "@/lib/resume-evaluator";
import { headers } from "next/headers";
import { nanoid } from "nanoid";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";

const EvaluationRequestSchema = z.object({
  resumeId: z.string(),
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
    const { resumeId, jobId } = EvaluationRequestSchema.parse(body);

    // Fetch resume and job data
    const [resumeData] = await db
      .select()
      .from(resume)
      .where(and(eq(resume.id, resumeId), eq(resume.userId, session.user.id)))
      .limit(1);

    if (!resumeData) {
      return Response.json({ error: "Resume not found" }, { status: 404 });
    }

    const [jobData] = await db
      .select()
      .from(job)
      .where(and(eq(job.id, jobId), eq(job.userId, session.user.id)))
      .limit(1);

    if (!jobData) {
      return Response.json({ error: "Job not found" }, { status: 404 });
    }

    // Evaluate resume against job
    const evaluationResult = await evaluateResume(resumeData, jobData);

    // Save evaluation to database
    const evaluationId = nanoid();
    const savedEvaluation = await db.insert(evaluation).values({
      id: evaluationId,
      resumeId: resumeId,
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

    return Response.json({
      success: true,
      evaluation: savedEvaluation[0],
      result: evaluationResult,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid evaluation data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating evaluation:", error);
    return Response.json(
      { error: "Failed to create evaluation" },
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
    const resumeId = searchParams.get("resumeId");
    const jobId = searchParams.get("jobId");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");

    const whereConditions = [eq(evaluation.userId, session.user.id)];
    
    if (resumeId) {
      whereConditions.push(eq(evaluation.resumeId, resumeId));
    }
    
    if (jobId) {
      whereConditions.push(eq(evaluation.jobId, jobId));
    }

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
      .where(and(...whereConditions))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(evaluation.createdAt));

    return Response.json({ evaluations });

  } catch (error) {
    console.error("Error fetching evaluations:", error);
    return Response.json(
      { error: "Failed to fetch evaluations" },
      { status: 500 }
    );
  }
}