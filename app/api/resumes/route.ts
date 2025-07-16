import { db } from "@/db/drizzle";
import { resume } from "@/db/schema";
import { auth } from "@/lib/auth";
import { parseResume } from "@/lib/resume-parser";
import { headers } from "next/headers";
import { nanoid } from "nanoid";
import { eq, desc } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (!allowedTypes.includes(file.type)) {
      return Response.json(
        { error: "Invalid file type. Supported formats: PDF, DOC, DOCX, TXT" },
        { status: 400 }
      );
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return Response.json(
        { error: "File too large. Maximum size: 5MB" },
        { status: 400 }
      );
    }

    // Read file content
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse resume content
    const { content, parsedData } = await parseResume(buffer, file.type);

    // Save to database
    const resumeId = nanoid();
    await db.insert(resume).values({
      id: resumeId,
      filename: file.name,
      originalContent: content,
      parsedData,
      fileSize: file.size,
      fileType: file.type,
      userId: session.user.id,
    }).returning();

    return Response.json({
      success: true,
      resumeId: resumeId,
      filename: file.name,
      parsedData: parsedData,
    });

  } catch (error) {
    console.error("Error uploading resume:", error);
    return Response.json(
      { error: "Failed to process resume" },
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

    const resumes = await db
      .select({
        id: resume.id,
        filename: resume.filename,
        parsedData: resume.parsedData,
        fileSize: resume.fileSize,
        fileType: resume.fileType,
        createdAt: resume.createdAt,
      })
      .from(resume)
      .where(eq(resume.userId, session.user.id))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(resume.createdAt));

    return Response.json({ resumes });

  } catch (error) {
    console.error("Error fetching resumes:", error);
    return Response.json(
      { error: "Failed to fetch resumes" },
      { status: 500 }
    );
  }
}