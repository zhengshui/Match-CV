# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Match-CV** is an AI-powered resume screening and matching system that helps automate the recruitment process. The platform enables companies to:

- Parse resumes from multiple formats (PDF, Word, text)
- Match candidates against job descriptions using AI
- Score and rank candidates based on multiple criteria
- Provide intelligent filtering and recommendation systems
- Generate detailed evaluation reports

## Tech Stack

- **Framework**: Next.js 15.3.1 with App Router
- **Language**: TypeScript with strict mode
- **Database**: Neon PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth v1.2.8
- **AI Integration**: OpenAI SDK (@ai-sdk/openai)
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Forms**: React Hook Form with Zod validation
- **State Management**: React Query (@tanstack/react-query)
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
- **Subscriptions**: `subscription` table (to be removed in v1)
- **Core CV System**: Tables for resumes, jobs, evaluations, and scoring (to be added)

### API Routes Structure
```
app/api/
├── auth/[...all]/route.ts    # Better Auth handler
├── chat/route.ts             # AI chat integration
├── subscription/route.ts     # Polar.sh webhooks (to be removed)
└── upload-image/route.ts     # File upload handler
```

### Frontend Structure
```
app/
├── dashboard/               # Protected dashboard area
│   ├── _components/        # Dashboard-specific components
│   ├── chat/              # AI chat interface
│   ├── upload/            # File upload interface
│   └── settings/          # User settings
├── (auth)/                # Authentication pages
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
- Remove Polar.sh payment integration
- Focus on core resume evaluation functionality
- Implement basic file upload and parsing
- AI-powered job matching and scoring
- Simple dashboard for viewing results

### Core Features to Implement
1. **Resume Parser**: PDF/Word/text processing
2. **Job Description Matcher**: AI-powered matching engine
3. **Scoring System**: Multi-dimensional candidate evaluation
4. **Batch Processing**: Handle multiple resumes
5. **Dashboard UI**: Results visualization and ranking

### Database Schema Extensions Needed
```sql
-- Resume storage and metadata
CREATE TABLE resumes (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  content TEXT NOT NULL,
  parsed_data JSONB,
  user_id TEXT REFERENCES user(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Job descriptions
CREATE TABLE jobs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements JSONB,
  user_id TEXT REFERENCES user(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Evaluation results
CREATE TABLE evaluations (
  id TEXT PRIMARY KEY,
  resume_id TEXT REFERENCES resumes(id),
  job_id TEXT REFERENCES jobs(id),
  score DECIMAL NOT NULL,
  breakdown JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

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

Current implementation uses Cloudflare R2, but for V1 we'll store files locally or use a simpler solution. The upload interface is already implemented in `app/dashboard/upload/`.

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