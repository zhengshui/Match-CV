import { openai } from "@/lib/openai-config";
import { generateObject } from "ai";
import { z } from "zod";
import { ParsedResumeData } from "./resume-parser";

const EvaluationSchema = z.object({
  overallScore: z.number().min(0).max(100),
  skillsScore: z.number().min(0).max(100).optional(),
  experienceScore: z.number().min(0).max(100).optional(),
  educationScore: z.number().min(0).max(100).optional(),
  breakdown: z.object({
    skillsMatch: z.array(z.object({
      skill: z.string(),
      found: z.boolean(),
      relevance: z.number().min(0).max(100),
    })),
    experienceMatch: z.object({
      yearsRequired: z.number().optional(),
      yearsCandidate: z.number().optional(),
      relevantExperience: z.array(z.string()),
    }),
    educationMatch: z.object({
      required: z.string().optional(),
      candidate: z.array(z.string()),
      match: z.boolean(),
    }),
  }),
  recommendation: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
});

export type EvaluationResult = z.infer<typeof EvaluationSchema>;

export interface JobData {
  id: string;
  title: string;
  description: string;
  requirements?: string[];
  skills?: string[];
  experienceLevel?: string;
  location?: string;
}

export interface ResumeData {
  id: string;
  filename: string;
  originalContent: string;
  parsedData: ParsedResumeData;
}

export async function evaluateResume(
  resumeData: ResumeData,
  jobData: JobData
): Promise<EvaluationResult> {
  // Input validation
  if (!resumeData) {
    throw new Error("Resume data is required");
  }
  
  if (!jobData) {
    throw new Error("Job data is required");
  }

  if (!resumeData.originalContent || resumeData.originalContent.trim().length === 0) {
    throw new Error("Resume content is required for evaluation");
  }

  if (!jobData.title || jobData.title.trim().length === 0) {
    throw new Error("Job title is required for evaluation");
  }

  if (!jobData.description || jobData.description.trim().length === 0) {
    throw new Error("Job description is required for evaluation");
  }

  try {
    const result = await generateObject({
      model: openai("gpt-4o"),
      schema: EvaluationSchema,
      prompt: `
        You are an expert HR recruiter evaluating a candidate's resume against a job description.
        
        JOB DESCRIPTION:
        Title: ${jobData.title}
        Description: ${jobData.description}
        Requirements: ${JSON.stringify(jobData.requirements || [])}
        Skills: ${JSON.stringify(jobData.skills || [])}
        Experience Level: ${jobData.experienceLevel || "not specified"}
        Location: ${jobData.location || "not specified"}
        
        CANDIDATE RESUME:
        ${resumeData.originalContent}
        
        PARSED RESUME DATA:
        ${JSON.stringify(resumeData.parsedData)}
        
        Please evaluate this candidate against the job requirements and provide:
        
        1. Overall Score (0-100): How well does this candidate match the job?
        2. Skills Score (0-100): How well do their skills match the required skills?
        3. Experience Score (0-100): How well does their experience match the requirements?
        4. Education Score (0-100): How well does their education match the requirements?
        
        5. Detailed Breakdown:
           - Skills Match: For each required skill, indicate if found and relevance (0-100)
           - Experience Match: Required vs candidate years, relevant experience highlights
           - Education Match: Required education vs candidate's education
        
        6. Recommendation: A brief recommendation (hire, maybe, no) with reasoning
        7. Strengths: Top 3-5 strengths of this candidate for this role
        8. Weaknesses: Top 3-5 weaknesses or gaps for this role
        
        Be thorough, objective, and provide actionable insights.
        Consider both hard skills (technical) and soft skills (communication, leadership).
        Factor in career progression, project complexity, and industry relevance.
      `,
    });

    // Validate the result
    if (!result.object) {
      throw new Error("No evaluation result received from AI");
    }

    return result.object;
  } catch (error) {
    console.error("Error evaluating resume:", error);
    
    if (error instanceof Error) {
      throw new Error(`Failed to evaluate resume: ${error.message}`);
    }
    
    throw new Error("Failed to evaluate resume. Please try again later.");
  }
}

export async function batchEvaluateResumes(
  resumes: ResumeData[],
  jobData: JobData,
  onProgress?: (current: number, total: number) => void
): Promise<{ resumeId: string; evaluation: EvaluationResult }[]> {
  // Input validation
  if (!resumes || resumes.length === 0) {
    throw new Error("At least one resume is required for batch evaluation");
  }

  if (!jobData) {
    throw new Error("Job data is required for batch evaluation");
  }

  if (resumes.length > 100) {
    throw new Error("Batch evaluation is limited to 100 resumes at a time");
  }

  const results: { resumeId: string; evaluation: EvaluationResult }[] = [];
  const errors: { resumeId: string; error: string }[] = [];
  
  for (let i = 0; i < resumes.length; i++) {
    const resume = resumes[i];
    onProgress?.(i + 1, resumes.length);
    
    try {
      // Validate individual resume
      if (!resume || !resume.id) {
        errors.push({
          resumeId: resume?.id || `resume-${i}`,
          error: "Invalid resume data"
        });
        continue;
      }

      const evaluation = await evaluateResume(resume, jobData);
      results.push({
        resumeId: resume.id,
        evaluation,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`Error evaluating resume ${resume.id}:`, error);
      errors.push({
        resumeId: resume.id,
        error: errorMessage
      });
      // Continue with other resumes even if one fails
    }
  }

  // Log batch evaluation summary
  console.log(`Batch evaluation completed: ${results.length} successful, ${errors.length} failed`);
  
  if (errors.length > 0) {
    console.warn("Errors in batch evaluation:", errors);
  }
  
  return results;
}

export function calculateMatchPercentage(evaluation: EvaluationResult): number {
  return evaluation.overallScore;
}

export function getRecommendationLabel(score: number): string {
  if (score >= 80) return "Strong Match";
  if (score >= 60) return "Good Match";
  if (score >= 40) return "Potential Match";
  return "Poor Match";
}

export function sortEvaluationsByScore(evaluations: { resumeId: string; evaluation: EvaluationResult }[]): { resumeId: string; evaluation: EvaluationResult }[] {
  return evaluations.sort((a, b) => 
    b.evaluation.overallScore - a.evaluation.overallScore
  );
}

export function filterEvaluationsByScore(
  evaluations: { resumeId: string; evaluation: EvaluationResult }[],
  minScore: number
): { resumeId: string; evaluation: EvaluationResult }[] {
  return evaluations.filter(item => item.evaluation.overallScore >= minScore);
}

export function getTopCandidates(
  evaluations: { resumeId: string; evaluation: EvaluationResult }[],
  count: number = 10
): { resumeId: string; evaluation: EvaluationResult }[] {
  return sortEvaluationsByScore(evaluations).slice(0, count);
}