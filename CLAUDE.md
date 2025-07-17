# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Match-CV** is an AI-powered resume screening and matching system that helps automate the recruitment process. The platform enables companies to:

- Parse resumes from multiple formats (PDF, Word, text)
- Match candidates against job descriptions using AI
- Score and rank candidates based on multiple criteria (skills, experience, education)
- Provide intelligent filtering and recommendation systems
- Generate detailed evaluation reports with strengths/weaknesses analysis
- Process multiple resumes in batch for efficient screening

## Tech Stack

- **Framework**: Next.js 15.3.1 with App Router
- **Language**: TypeScript with strict mode
- **Database**: Neon PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth v1.2.8 (email/password only)
- **AI Integration**: OpenAI SDK v1.3.22 for resume parsing and evaluation
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Forms**: React Hook Form with Zod validation
- **File Processing**: PDF parsing and text extraction
- **Deployment**: Vercel (recommended)

## Development Commands

```bash
# Install dependencies
npm install

# Start development server with turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Database operations
npx drizzle-kit generate    # Generate migrations
npx drizzle-kit push       # Push schema to database
npx drizzle-kit studio     # Open database studio
```

## Architecture Overview

### Database Schema (Drizzle ORM)
- **Authentication**: `user`, `session`, `account`, `verification` tables
- **Resume System**: `resume` table with file metadata and parsed content
- **Job Management**: `job` table with descriptions and requirements
- **Evaluation System**: `evaluation` table with scoring and detailed analysis

### API Routes Structure
```
app/api/
├── auth/[...all]/route.ts    # Better Auth handler
├── resumes/route.ts          # Resume upload and management
├── jobs/route.ts             # Job description management
├── evaluations/route.ts      # Individual resume evaluation
├── batch-evaluate/route.ts   # Batch resume evaluation
├── chat/route.ts             # AI chat integration
└── upload-image/route.ts     # File upload handler
```

### Frontend Structure
```
app/
├── dashboard/               # Protected dashboard area
│   ├── _components/        # Dashboard-specific components
│   ├── resumes/           # Resume management interface
│   ├── jobs/              # Job description management
│   ├── evaluations/       # Evaluation results and rankings
│   ├── upload/            # File upload interface
│   ├── chat/              # AI chat interface
│   └── settings/          # User settings
├── sign-in/               # Email/password login
├── sign-up/               # User registration
└── api/                   # API routes
```

## Key Configuration Files

### Environment Variables
Required environment variables (see `.env.example`):
- `DATABASE_URL`: Neon PostgreSQL connection string
- `BETTER_AUTH_SECRET`: Random secret for auth
- `OPENAI_API_KEY`: OpenAI API key for AI features
- `NEXT_PUBLIC_APP_URL`: Frontend URL (http://localhost:3000 for dev)

### Database Configuration
- **ORM**: Drizzle with PostgreSQL adapter
- **Migrations**: Located in `db/migrations/`
- **Schema**: Defined in `db/schema.ts`
- **Config**: `drizzle.config.ts`

## Development Guidelines

### Authentication System
- Uses Better Auth with email/password authentication
- Google OAuth is configured but optional
- Session management with database persistence
- User profile management included

### AI Integration Pattern
- OpenAI integration via `@ai-sdk/openai`
- Streaming responses for better UX
- Chat interface in `app/api/chat/route.ts`
- Tool integration supported (web search, etc.)

### Component Structure
- **UI Components**: shadcn/ui components in `components/ui/`
- **Business Logic**: Custom components in `components/`
- **Dashboard**: Protected components in `app/dashboard/_components/`

### Database Operations
- Use Drizzle ORM for all database operations
- Schema definitions in `db/schema.ts`
- Connection setup in `db/drizzle.ts`
- Migration workflow: generate → push → deploy

## Current Implementation Status

### V1 Scope (Email/Password Auth Only)
- ✅ Database schema implemented for resumes, jobs, evaluations
- ✅ API route structure created
- ✅ Basic authentication with Better Auth
- 🔄 Resume parser implementation (PDF, Word, text)
- 🔄 AI-powered job matching and scoring engine
- 🔄 Batch evaluation processing
- 🔄 Dashboard UI for results visualization

### Core Features Implementation
1. **Resume Parser**: File upload with text extraction and AI parsing
2. **Job Description Matcher**: OpenAI-powered semantic matching
3. **Scoring System**: Multi-dimensional evaluation (skills, experience, education)
4. **Batch Processing**: Process multiple resumes against job descriptions
5. **Dashboard UI**: Results visualization with rankings and detailed analysis

### Database Schema (Implemented)
- **resume** table: File metadata, content, and parsed data
- **job** table: Job descriptions with requirements and skills
- **evaluation** table: Detailed scoring with breakdown analysis
- **user/session** tables: Email/password authentication

## Testing Strategy

- Focus on API endpoints and core business logic
- Test resume parsing accuracy
- Validate scoring algorithms
- Ensure proper error handling for file uploads
- Test authentication flows

## Common Development Patterns

### API Route Structure
```typescript
// Standard API route pattern
export async function POST(req: Request) {
  try {
    const { data } = await req.json();
    // Process data
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: 'Message' }, { status: 500 });
  }
}
```

### Database Query Pattern
```typescript
import { db } from '@/db/drizzle';
import { tableName } from '@/db/schema';

// Query with Drizzle
const result = await db.select().from(tableName).where(eq(tableName.id, id));
```

### AI Integration Pattern
```typescript
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

const result = await generateText({
  model: openai('gpt-4o'),
  prompt: 'Your prompt here',
});
```

## File Upload Handling

V1 implementation uses local file processing with in-memory text extraction. Resume files are parsed on upload and stored as text content in the database. The upload interface is implemented in `app/dashboard/upload/`.

## Deployment Notes

- Vercel deployment recommended
- Database migrations run automatically
- Environment variables configured in Vercel dashboard
- Build process: `npm run build`

## Important Notes

- Always run linting before committing: `npm run lint`
- Use TypeScript strictly - no `any` types
- Follow existing component patterns and styling
- Ensure proper error handling in API routes
- Test database operations thoroughly
- Use Drizzle for all database operations, never raw SQL