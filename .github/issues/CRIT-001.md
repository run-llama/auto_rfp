# [CRITICAL] Missing Authentication on Projects API

## 🔴 Critical Security Vulnerability

### Summary
The Projects API endpoint (`/api/projects`) has NO authentication checks, allowing anyone to list, read, and create projects without being authenticated.

### Severity
**CRITICAL** - Data breach potential

### Impact
- Unauthenticated users can list all projects in the system
- Unauthenticated users can create projects in any organization
- No authorization check for organization membership
- Potential data exposure and unauthorized data manipulation

### Current State

**File**: `app/api/projects/route.ts` (lines 17-119)

```typescript
export async function GET(request: Request) {
  try {
    // ❌ No authentication check!
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const where = organizationId ? { organizationId } : {};

    const projects = await db.project.findMany({ where });
    return NextResponse.json({ success: true, data: projects });
  } catch (error) {
    // ...
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, organizationId } = body;

    // ❌ No authentication or authorization check!
    const project = await db.project.create({
      data: { name, description, organizationId }
    });
    return NextResponse.json({ success: true, data: project });
  } catch (error) {
    // ...
  }
}
```

### Implementation Strategy

#### Option 1: Use Existing Auth Service (Recommended)
```typescript
import { organizationAuth } from '@/lib/services/organization-auth';
import { AuthorizationError, ForbiddenError } from '@/lib/errors/api-errors';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId is required' },
        { status: 400 }
      );
    }

    // ✅ Authenticate and verify membership
    const user = await organizationAuth.getAuthenticatedMember(organizationId);

    const projects = await db.project.findMany({
      where: { organizationId }
    });

    return NextResponse.json({ success: true, data: projects });
  } catch (error) {
    if (error instanceof AuthorizationError || error instanceof ForbiddenError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, organizationId } = body;

    // ✅ Authenticate and verify membership
    const user = await organizationAuth.getAuthenticatedMember(organizationId);

    const project = await db.project.create({
      data: {
        name,
        description,
        organizationId
      }
    });

    return NextResponse.json({ success: true, data: project }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthorizationError || error instanceof ForbiddenError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    throw error;
  }
}
```

#### Option 2: Use Middleware Wrapper (Cleaner)
```typescript
import { apiHandler } from '@/lib/middleware/api-handler';
import { organizationAuth } from '@/lib/services/organization-auth';

export const GET = apiHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organizationId');

  if (!organizationId) {
    throw new ValidationError('organizationId is required');
  }

  const user = await organizationAuth.getAuthenticatedMember(organizationId);

  const projects = await db.project.findMany({
    where: { organizationId }
  });

  return { success: true, data: projects };
});

export const POST = apiHandler(async (request) => {
  const body = await request.json();
  const { name, description, organizationId } = body;

  const user = await organizationAuth.getAuthenticatedMember(organizationId);

  const project = await db.project.create({
    data: { name, description, organizationId }
  });

  return { success: true, data: project };
});
```

### Acceptance Criteria
- [ ] Add authentication check at beginning of GET handler
- [ ] Add authentication check at beginning of POST handler
- [ ] Require organizationId parameter for GET requests
- [ ] Verify user belongs to organization before allowing project access
- [ ] Return 401 Unauthorized for unauthenticated requests
- [ ] Return 403 Forbidden for users not in the organization
- [ ] Return 400 Bad Request for missing organizationId
- [ ] Add integration test for unauthenticated access attempts
- [ ] Add integration test for cross-organization access attempts
- [ ] Update API documentation with auth requirements

### Testing Steps
1. Test GET without authentication → expect 401
2. Test GET without organizationId → expect 400
3. Test GET with auth but wrong org → expect 403
4. Test GET with valid auth and org → expect 200
5. Test POST without authentication → expect 401
6. Test POST with auth but not org member → expect 403
7. Test POST with valid auth → expect 201

### Related Files
- Auth service: `lib/services/organization-auth.ts`
- API middleware: `lib/middleware/api-handler.ts`
- Error classes: `lib/errors/api-errors.ts`

### Estimated Effort
2-3 hours

### Related Issues
- CRIT-002 (Questions API authentication)
- HIGH-002 (Enforce middleware usage)
