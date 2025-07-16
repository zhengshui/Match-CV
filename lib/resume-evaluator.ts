import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

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

export async function evaluateResume(
  resumeData: Record<string, unknown>,
  jobData: Record<string, unknown>
): Promise<EvaluationResult> {
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

    return result.object;
  } catch (error) {
    console.error("Error evaluating resume:", error);
    throw new Error("Failed to evaluate resume");
  }
}

export async function batchEvaluateResumes(): Promise<{ resumeId: string; evaluation: EvaluationResult }[]> {
  // This would be implemented for batch processing
  // For now, return empty array
  return [];
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

export function sortEvaluationsByScore(evaluations: Record<string, unknown>[]): Record<string, unknown>[] {
  return evaluations.sort((a, b) => 
    parseFloat(b.overallScore) - parseFloat(a.overallScore)
  );
}