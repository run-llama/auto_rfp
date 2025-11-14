# Enforce Middleware Usage on All API Routes

## 🟠 High Priority - Code Consistency

### Summary
Many API routes bypass the standard middleware (`apiHandler` or `withApiHandler`), leading to inconsistent error handling, missing validation, and duplicate code patterns throughout the codebase.

### Impact
- Inconsistent error handling across API endpoints
- Missing input validation on critical routes
- Duplicate try-catch blocks in every route handler
- Difficult to add cross-cutting concerns (logging, monitoring, etc.)
- Increases risk of bugs when error handling is done manually
- Harder to maintain and debug when issues arise

### Current State

**Routes without middleware:**

#### Example 1: Organizations API
```typescript
// app/api/organizations/route.ts
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    // Manual validation, error handling...
  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create organization' },
      { status: 500 }
    );
  }
}
```

#### Example 2: Projects API
```typescript
// app/api/projects/route.ts
export async function GET(request: Request) {
  // No middleware, no validation, no standardized error handling
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organizationId');

  if (!organizationId) {
    return NextResponse.json(
      { success: false, error: 'Organization ID is required' },
      { status: 400 }
    );
  }
  // More manual validation and error handling...
}
```

#### Example 3: Multi-step Response API
```typescript
// app/api/generate-response-multistep/route.ts (lines 23-38)
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Manual validation
    if (!body.question || typeof body.question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required and must be a string' },
        { status: 400 }
      );
    }

    if (!body.projectId || typeof body.projectId !== 'string') {
      return NextResponse.json(
        { error: 'Project ID is required and must be a string' },
        { status: 400 }
      );
    }
    // More manual checks...
  } catch (error) {
    // Manual error handling
  }
}
```

**Problems with current approach:**
- Each route implements error handling differently
- Validation logic is repeated across routes
- Easy to forget authentication checks
- No centralized place to add logging or monitoring
- Hard to enforce consistent response formats

### Implementation Strategy

#### Step 1: Audit All API Routes

Create a script to find all routes without middleware:
```bash
# Find all route.ts files
find app/api -name "route.ts" | while read file; do
  if ! grep -q "apiHandler\|withApiHandler" "$file"; then
    echo "Missing middleware: $file"
  fi
done
```

Expected output:
- `app/api/organizations/route.ts`
- `app/api/projects/route.ts`
- `app/api/generate-response-multistep/route.ts`
- And more...

#### Step 2: Create Validation Schemas

For each route, define Zod schemas:

```typescript
// lib/validation/projects.ts
import { z } from 'zod';

export const getProjectsSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID format'),
  status: z.enum(['active', 'archived', 'all']).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
});

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  description: z.string().optional(),
  organizationId: z.string().uuid('Invalid organization ID'),
  file: z.string().optional(),
});
```

```typescript
// lib/validation/generate-response.ts
import { z } from 'zod';

export const generateResponseSchema = z.object({
  question: z.string().min(1, 'Question is required'),
  projectId: z.string().uuid('Invalid project ID'),
  maxSteps: z.number().min(1).max(10).optional().default(5),
  context: z.record(z.any()).optional(),
});
```

#### Step 3: Update Routes to Use Middleware

**Before:**
```typescript
// app/api/projects/route.ts
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const projects = await db.project.findMany({
      where: { organizationId }
    });

    return NextResponse.json({ success: true, data: projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}
```

**After:**
```typescript
// app/api/projects/route.ts
import { apiHandler } from '@/lib/middleware/api-handler';
import { getProjectsSchema } from '@/lib/validation/projects';
import { db } from '@/lib/db';
import { successResponse } from '@/types/api-response';

export const GET = apiHandler({
  schema: getProjectsSchema,
  handler: async (request, { query }) => {
    // query is already validated and typed
    const projects = await db.project.findMany({
      where: { organizationId: query.organizationId }
    });

    return successResponse(projects);
  }
});
```

**With authentication:**
```typescript
export const POST = apiHandler({
  requireAuth: true,
  schema: createProjectSchema,
  handler: async (request, { body, user }) => {
    // body is validated, user is authenticated
    const project = await db.project.create({
      data: {
        ...body,
        createdById: user.id,
      }
    });

    return successResponse(project);
  }
});
```

#### Step 4: Enhance API Handler Middleware

Update `lib/middleware/api-handler.ts` to support more features:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { successResponse, errorResponse } from '@/types/api-response';

interface ApiHandlerOptions<TQuery = any, TBody = any> {
  // Validation schemas
  schema?: ZodSchema<TQuery>;
  bodySchema?: ZodSchema<TBody>;

  // Authentication/Authorization
  requireAuth?: boolean;
  requireRoles?: string[];

  // Handler function
  handler: (
    request: NextRequest,
    context: {
      query?: TQuery;
      body?: TBody;
      user?: any;
      params?: any;
    }
  ) => Promise<any>;
}

export function apiHandler<TQuery = any, TBody = any>(
  options: ApiHandlerOptions<TQuery, TBody>
) {
  return async (request: NextRequest, routeContext?: any) => {
    try {
      const context: any = { params: routeContext?.params };

      // 1. Authentication check
      if (options.requireAuth) {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
          return NextResponse.json(
            errorResponse('Unauthorized', 'UNAUTHORIZED'),
            { status: 401 }
          );
        }
        context.user = session.user;
      }

      // 2. Validate query parameters
      if (options.schema) {
        const { searchParams } = new URL(request.url);
        const queryObject = Object.fromEntries(searchParams.entries());

        const result = options.schema.safeParse(queryObject);
        if (!result.success) {
          return NextResponse.json(
            errorResponse(
              'Validation error',
              'VALIDATION_ERROR',
              result.error.errors
            ),
            { status: 400 }
          );
        }
        context.query = result.data;
      }

      // 3. Validate request body
      if (options.bodySchema && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        const body = await request.json();

        const result = options.bodySchema.safeParse(body);
        if (!result.success) {
          return NextResponse.json(
            errorResponse(
              'Validation error',
              'VALIDATION_ERROR',
              result.error.errors
            ),
            { status: 400 }
          );
        }
        context.body = result.data;
      }

      // 4. Call handler
      const result = await options.handler(request, context);

      // 5. Return response
      if (result && typeof result === 'object' && 'success' in result) {
        return NextResponse.json(result);
      }

      return NextResponse.json(successResponse(result));

    } catch (error) {
      console.error('API error:', error);

      return NextResponse.json(
        errorResponse(
          error instanceof Error ? error.message : 'Internal server error',
          'INTERNAL_ERROR'
        ),
        { status: 500 }
      );
    }
  };
}
```

#### Step 5: Remove Manual Try-Catch Blocks

Once routes use middleware, remove manual error handling:

**Before:**
```typescript
export async function POST(request: Request) {
  try {
    // ... logic
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

**After:**
```typescript
export const POST = apiHandler({
  bodySchema: mySchema,
  handler: async (request, { body }) => {
    // No try-catch needed - middleware handles it
    return await myService.create(body);
  }
});
```

### Acceptance Criteria
- [ ] Audit all API routes in `/app/api` directory (document count)
- [ ] Create Zod schemas for all routes missing validation
- [ ] Wrap all GET endpoints with `apiHandler`
- [ ] Wrap all POST endpoints with `apiHandler`
- [ ] Wrap all PUT/PATCH endpoints with `apiHandler`
- [ ] Wrap all DELETE endpoints with `apiHandler`
- [ ] Remove manual try-catch blocks where middleware handles errors
- [ ] Ensure all routes have consistent error responses
- [ ] Add authentication checks via `requireAuth` option
- [ ] Test that validation errors return 400 with details
- [ ] Test that auth errors return 401
- [ ] Document middleware usage in `CONTRIBUTING.md`
- [ ] Add examples of common patterns

### Files to Update

**API Routes (No Middleware):**
- `app/api/organizations/route.ts`
- `app/api/organizations/[id]/route.ts`
- `app/api/projects/route.ts`
- `app/api/projects/[projectId]/route.ts`
- `app/api/generate-response-multistep/route.ts`
- All other unprotected routes

**Validation Schemas (Create):**
- `lib/validation/projects.ts`
- `lib/validation/organizations.ts`
- `lib/validation/questions.ts`
- `lib/validation/generate-response.ts`

**Middleware Enhancement:**
- `lib/middleware/api-handler.ts`

**Documentation:**
- `CONTRIBUTING.md` (add middleware usage section)

### Testing
- [ ] Test routes with invalid query parameters (should return 400)
- [ ] Test routes with invalid body data (should return 400)
- [ ] Test routes without authentication when required (should return 401)
- [ ] Test that error messages include validation details
- [ ] Test that successful requests return consistent format
- [ ] Verify no console.error calls in production (use logger instead)

### Estimated Effort
6-8 hours

### Related Issues
- HIGH-001 (Standardize error response format)
- HIGH-008 (Add input validation to all endpoints)
- HIGH-003 (Remove console logs)
- CRIT-001 (Missing authentication on Projects API)
- CRIT-002 (Missing authentication on Questions API)
