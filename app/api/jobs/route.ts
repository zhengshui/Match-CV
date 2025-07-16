import { db } from "@/db/drizzle";
import { job } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { nanoid } from "nanoid";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";

const JobSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  requirements: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  experienceLevel: z.enum(["entry", "mid", "senior", "lead"]).optional(),
  location: z.string().optional(),
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
    const validatedData = JobSchema.parse(body);

    const jobId = nanoid();
    const savedJob = await db.insert(job).values({
      id: jobId,
      title: validatedData.title,
      description: validatedData.description,
      requirements: validatedData.requirements || [],
      skills: validatedData.skills || [],
      experienceLevel: validatedData.experienceLevel,
      location: validatedData.location,
      userId: session.user.id,
    }).returning();

    return Response.json({
      success: true,
      job: savedJob[0],
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid job data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating job:", error);
    return Response.json(
      { error: "Failed to create job" },
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
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");
    const active = searchParams.get("active");

    const whereConditions = [eq(job.userId, session.user.id)];
    
    if (active === "true") {
      whereConditions.push(eq(job.isActive, true));
    }

    const jobs = await db
      .select({
        id: job.id,
        title: job.title,
        description: job.description,
        requirements: job.requirements,
        skills: job.skills,
        experienceLevel: job.experienceLevel,
        location: job.location,
        isActive: job.isActive,
        createdAt: job.createdAt,
      })
      .from(job)
      .where(and(...whereConditions))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(job.createdAt));

    return Response.json({ jobs });

  } catch (error) {
    console.error("Error fetching jobs:", error);
    return Response.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}