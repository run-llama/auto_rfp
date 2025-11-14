# [CRITICAL] Missing Authentication on Questions API

## 🔴 Critical Security Vulnerability

### Summary
The Questions API endpoint (`/api/questions/[projectId]`) has NO authentication checks, allowing anyone to read all questions from any project without being authenticated.

### Severity
**CRITICAL** - Data breach potential

### Impact
- Unauthenticated users can read all questions from any project
- No authorization check for project/organization access
- Sensitive RFP information exposed to unauthorized users
- Potential competitive intelligence leak

### Current State

**File**: `app/api/questions/[projectId]/route.ts` (lines 4-36)

```typescript
export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    // ❌ No authentication or authorization!
    const rfpDocument = await projectService.getQuestions(projectId);

    if (!rfpDocument) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(rfpDocument);
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}
```

### Implementation Strategy

#### Recommended Approach
```typescript
import { organizationAuth } from '@/lib/services/organization-auth';
import { AuthorizationError, ForbiddenError, NotFoundError } from '@/lib/errors/api-errors';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    // ✅ First, get the project to find its organization
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { id: true, organizationId: true }
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // ✅ Authenticate and verify user has access to this organization
    const user = await organizationAuth.getAuthenticatedMember(project.organizationId);

    // ✅ Now fetch the questions
    const rfpDocument = await projectService.getQuestions(projectId);

    return NextResponse.json(rfpDocument);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}
```

#### Alternative: Using Middleware
```typescript
import { apiHandler } from '@/lib/middleware/api-handler';
import { organizationAuth } from '@/lib/services/organization-auth';
import { NotFoundError } from '@/lib/errors/api-errors';

export const GET = apiHandler(async (request, { params }) => {
  const { projectId } = await params;

  // Get project to find organization
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { id: true, organizationId: true }
  });

  if (!project) {
    throw new NotFoundError('Project not found');
  }

  // Verify access
  await organizationAuth.getAuthenticatedMember(project.organizationId);

  // Fetch questions
  const rfpDocument = await projectService.getQuestions(projectId);

  return rfpDocument;
});
```

#### Helper Function for Reusability
Consider creating a helper for project authorization:

```typescript
// lib/services/project-auth.ts
import { organizationAuth } from './organization-auth';
import { NotFoundError } from '@/lib/errors/api-errors';
import { db } from '@/lib/db';

export async function verifyProjectAccess(projectId: string) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { id: true, organizationId: true }
  });

  if (!project) {
    throw new NotFoundError('Project not found');
  }

  const user = await organizationAuth.getAuthenticatedMember(project.organizationId);

  return { user, project };
}
```

Then use it:
```typescript
export const GET = apiHandler(async (request, { params }) => {
  const { projectId } = await params;

  // ✅ Verify access in one line
  await verifyProjectAccess(projectId);

  const rfpDocument = await projectService.getQuestions(projectId);
  return rfpDocument;
});
```

### Acceptance Criteria
- [ ] Add authentication check to GET handler
- [ ] Verify user has access to project's organization
- [ ] Return 401 for unauthenticated requests
- [ ] Return 403 if user doesn't belong to project's organization
- [ ] Return 404 for non-existent projects (after auth check)
- [ ] Add integration test for unauthenticated access
- [ ] Add integration test for cross-organization access
- [ ] Consider creating reusable project auth helper
- [ ] Audit other project-related endpoints (PUT, DELETE, etc.)
- [ ] Update API documentation with auth requirements

### Testing Steps
1. Test GET without authentication → expect 401
2. Test GET with auth but user not in org → expect 403
3. Test GET with auth for non-existent project → expect 404
4. Test GET with valid auth and project → expect 200 with questions
5. Test that user from Org A cannot access Org B's projects

### Additional Endpoints to Audit
After fixing this, check these related endpoints:
- `PUT /api/questions/[projectId]` - Update questions
- `DELETE /api/questions/[projectId]` - Delete questions
- Any other question-related endpoints

### Related Files
- Current file: `app/api/questions/[projectId]/route.ts`
- Auth service: `lib/services/organization-auth.ts`
- Project service: `lib/project-service.ts`
- Database client: `lib/db.ts`
- Error classes: `lib/errors/api-errors.ts`

### Estimated Effort
2-3 hours (including helper function creation and testing)

### Related Issues
- CRIT-001 (Projects API authentication)
- HIGH-002 (Enforce middleware usage)
- MED-012 (Extract complex authorization logic)
