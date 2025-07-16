CREATE TABLE "evaluation" (
	"id" text PRIMARY KEY NOT NULL,
	"resumeId" text NOT NULL,
	"jobId" text NOT NULL,
	"overallScore" numeric(5, 2) NOT NULL,
	"skillsScore" numeric(5, 2),
	"experienceScore" numeric(5, 2),
	"educationScore" numeric(5, 2),
	"breakdown" jsonb,
	"recommendation" text,
	"strengths" jsonb,
	"weaknesses" jsonb,
	"userId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"requirements" jsonb,
	"skills" jsonb,
	"experienceLevel" text,
	"location" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"userId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resume" (
	"id" text PRIMARY KEY NOT NULL,
	"filename" text NOT NULL,
	"originalContent" text NOT NULL,
	"parsedData" jsonb,
	"fileSize" integer,
	"fileType" text,
	"userId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "evaluation" ADD CONSTRAINT "evaluation_resumeId_resume_id_fk" FOREIGN KEY ("resumeId") REFERENCES "public"."resume"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluation" ADD CONSTRAINT "evaluation_jobId_job_id_fk" FOREIGN KEY ("jobId") REFERENCES "public"."job"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluation" ADD CONSTRAINT "evaluation_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job" ADD CONSTRAINT "job_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resume" ADD CONSTRAINT "resume_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;