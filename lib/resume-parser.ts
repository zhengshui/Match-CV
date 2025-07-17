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
  if (!buffer || buffer.length === 0) {
    throw new Error("Invalid or empty file buffer");
  }

  if (!fileType) {
    throw new Error("File type is required");
  }

  let content: string;

  try {
    // Extract text content based on file type
    switch (fileType) {
      case "text/plain":
        content = buffer.toString("utf8");
        if (!content.trim()) {
          throw new Error("The text file appears to be empty");
        }
        break;
      case "application/pdf":
        content = await extractPdfText(buffer);
        break;
      case "application/msword":
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        content = await extractDocText(buffer);
        break;
      default:
        throw new Error(`Unsupported file type: ${fileType}. Supported formats: PDF, DOC, DOCX, TXT`);
    }

    if (!content || content.trim().length < 50) {
      throw new Error("The extracted content is too short to be a valid resume");
    }

    // Parse structured data using AI
    const parsedData = await extractStructuredData(content);

    return {
      content,
      parsedData,
    };
  } catch (error) {
    console.error("Error parsing resume:", error);
    
    // Re-throw with more specific error messages
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error("Failed to parse resume. Please check the file format and try again.");
  }
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import to avoid build-time issues
    const pdfParse = await import('pdf-parse');
    const data = await pdfParse.default(buffer);
    
    if (!data.text || data.text.trim().length === 0) {
      throw new Error("PDF file appears to be empty or contains no readable text");
    }
    
    return data.text;
  } catch (error) {
    console.error("Error parsing PDF:", error);
    
    if (error instanceof Error) {
      throw new Error(`Failed to parse PDF file: ${error.message}`);
    }
    
    throw new Error("Failed to parse PDF file. The file may be corrupted or password-protected.");
  }
}

async function extractDocText(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import to avoid build-time issues
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    
    if (!result.value || result.value.trim().length === 0) {
      throw new Error("Word document appears to be empty or contains no readable text");
    }
    
    return result.value;
  } catch (error) {
    console.error("Error parsing Word document:", error);
    
    if (error instanceof Error) {
      throw new Error(`Failed to parse Word document: ${error.message}`);
    }
    
    throw new Error("Failed to parse Word document. The file may be corrupted or unsupported.");
  }
}

async function extractStructuredData(content: string): Promise<ParsedResumeData> {
  if (!content || content.trim().length === 0) {
    throw new Error("Content is required for data extraction");
  }

  try {
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

    // Validate that we got at least a name
    if (!result.object.personalInfo?.name || result.object.personalInfo.name.trim().length === 0) {
      throw new Error("Could not extract candidate name from resume");
    }

    return result.object;
  } catch (error) {
    console.error("Error extracting structured data:", error);
    
    if (error instanceof Error) {
      throw new Error(`Failed to extract structured data: ${error.message}`);
    }
    
    throw new Error("Failed to extract structured data from resume. Please check the content quality.");
  }
}

export { ResumeSchema };