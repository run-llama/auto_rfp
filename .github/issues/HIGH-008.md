# Add Input Validation to All API Endpoints

## 🟠 High Priority - Security & Data Integrity

### Summary
Many API endpoints use manual validation or no validation at all, instead of using Zod schemas, leading to potential data integrity issues and security vulnerabilities.

### Impact
- Invalid data can reach the database
- Potential injection vulnerabilities
- Inconsistent validation logic
- Poor error messages for users
- No type safety for API requests

### Current State

**Manual validation:**
```typescript
// app/api/organizations/route.ts (lines 131-143)
const { name, slug, description } = body;
if (!name) {
  return NextResponse.json({ error: 'Name is required' }, { status: 400 });
}
// slug is destructured but never validated or used
```

**No validation:**
```typescript
// app/api/projects/route.ts (lines 19-22)
const { searchParams } = new URL(request.url);
const organizationId = searchParams.get('organizationId');
// No check if organizationId is valid UUID
```

### Implementation Strategy

**Step 1: Create validation schemas**
```typescript
// lib/validators/projects.ts
import { z } from 'zod';

export const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  organizationId: z.string().uuid()
});

export const GetProjectsSchema = z.object({
  organizationId: z.string().uuid()
});
```

**Step 2: Use withApiHandler with validation**
```typescript
import { withApiHandler } from '@/lib/middleware/api-handler';
import { CreateProjectSchema } from '@/lib/validators/projects';

export const POST = withApiHandler(
  async (request, { body }) => {
    const project = await db.project.create({
      data: body // Already validated
    });
    return project;
  },
  { bodySchema: CreateProjectSchema }
);
```

### Acceptance Criteria
- [ ] Create Zod schemas for all API request bodies
- [ ] Add UUID validation for all ID parameters
- [ ] Add length limits to all string inputs
- [ ] Validate email formats where applicable
- [ ] Use withApiHandler with schema parameter
- [ ] Remove manual validation code
- [ ] Return detailed validation errors (400 status)
- [ ] Test all validation edge cases

### Estimated Effort
6-8 hours
