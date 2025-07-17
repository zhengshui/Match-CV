import { openai } from "@/lib/openai-config";
import { generateObject } from "ai";
import { z } from "zod";

// Schema for structured resume data
const ResumeSchema = z.object({
  personalInfo: z.object({
    name: z.string(),
    email: z.string().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    linkedin: z.string().optional(),
    github: z.string().optional(),
    portfolio: z.string().optional(),
  }),
  summary: z.string().optional(),
  experience: z.array(z.object({
    company: z.string(),
    position: z.string(),
    startDate: z.string(),
    endDate: z.string().optional(),
    description: z.string(),
    achievements: z.array(z.string()).optional(),
  })),
  education: z.array(z.object({
    institution: z.string(),
    degree: z.string(),
    field: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    gpa: z.string().optional(),
  })),
  skills: z.array(z.object({
    category: z.string(),
    items: z.array(z.string()),
  })),
  projects: z.array(z.object({
    name: z.string(),
    description: z.string(),
    technologies: z.array(z.string()),
    url: z.string().optional(),
  })).optional(),
  certifications: z.array(z.object({
    name: z.string(),
    issuer: z.string(),
    date: z.string().optional(),
    url: z.string().optional(),
  })).optional(),
  languages: z.array(z.object({
    language: z.string(),
    proficiency: z.string(),
  })).optional(),
});

export type ParsedResumeData = z.infer<typeof ResumeSchema>;

export async function parseResume(buffer: Buffer, fileType: string): Promise<{
  content: string;
  parsedData: ParsedResumeData;
}> {
  let content: string;

  try {
    // Extract text content based on file type
    switch (fileType) {
      case "text/plain":
        content = buffer.toString("utf8");
        break;
      case "application/pdf":
        content = await extractPdfText(buffer);
        break;
      case "application/msword":
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        content = await extractDocText(buffer);
        break;
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }

    // Parse structured data using AI
    const parsedData = await extractStructuredData(content);

    return {
      content,
      parsedData,
    };
  } catch (error) {
    console.error("Error parsing resume:", error);
    throw new Error("Failed to parse resume");
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function extractPdfText(_buffer: Buffer): Promise<string> {
  // For now, return placeholder - in production, use a PDF parsing library like pdf-parse
  // npm install pdf-parse
  // const pdfParse = require('pdf-parse');
  // const data = await pdfParse(_buffer);
  // return data.text;
  
  return "PDF parsing not implemented yet. Please use text files for now.";
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function extractDocText(_buffer: Buffer): Promise<string> {
  // For now, return placeholder - in production, use a Word parsing library like mammoth
  // npm install mammoth
  // const mammoth = require('mammoth');
  // const result = await mammoth.extractRawText({ buffer: _buffer });
  // return result.value;
  
  return "DOC/DOCX parsing not implemented yet. Please use text files for now.";
}

async function extractStructuredData(content: string): Promise<ParsedResumeData> {
  const result = await generateObject({
    model: openai("gpt-4o"),
    schema: ResumeSchema,
    prompt: `
      Parse the following resume content and extract structured information:
      
      ${content}
      
      Extract all relevant information including:
      - Personal information (name, email, phone, location, social links)
      - Professional summary
      - Work experience with dates, companies, positions, and descriptions
      - Education history with institutions, degrees, and dates
      - Skills organized by category
      - Projects with descriptions and technologies used
      - Certifications and their details
      - Languages and proficiency levels
      
      If information is not available, omit the field or use empty arrays.
      Be as comprehensive as possible while maintaining accuracy.
    `,
  });

  return result.object;
}

export { ResumeSchema };