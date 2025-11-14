# Standardize Error Response Format Across All APIs

## 🟠 High Priority - API Consistency

### Summary
API endpoints use three different error response formats, making client-side error handling inconsistent and unreliable.

### Impact
- Difficult to handle errors consistently on frontend
- Confusing developer experience
- Makes it hard to add global error handling
- Inconsistent HTTP status codes

### Current State

**Three different patterns found:**

#### Pattern 1: Direct data return
```typescript
// app/api/organizations/[id]/route.ts (line 52)
return NextResponse.json(organization);
```

#### Pattern 2: Wrapped with success flag
```typescript
// app/api/projects/route.ts (lines 41-44)
return NextResponse.json({
  success: true,
  data: projects
});
```

#### Pattern 3: Using raw Response constructor
```typescript
// app/api/llamacloud/projects/route.ts (lines 9-12)
return new Response(
  JSON.stringify({ error: 'LlamaCloud API key not configured' }),
  { status: 500, headers: { 'Content-Type': 'application/json' } }
);
```

**Error responses also inconsistent:**
```typescript
// Example 1
{ error: 'Message' }

// Example 2
{ success: false, error: 'Failed', message: 'Details' }

// Example 3
{ error: error.message, code: error.code, details: {...} }
```

### Implementation Strategy

#### Step 1: Define Standard Response Interfaces

Create `types/api-response.ts`:
```typescript
/**
 * Standard API success response
 */
export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  metadata?: Record<string, any>;
}

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: any;
  };
}

/**
 * Union type for all API responses
 */
export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Helper to create success response
 */
export function successResponse<T>(
  data: T,
  metadata?: Record<string, any>
): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    ...(metadata && { metadata })
  };
}

/**
 * Helper to create error response
 */
export function errorResponse(
  message: string,
  code?: string,
  details?: any
): ApiErrorResponse {
  return {
    success: false,
    error: {
      message,
      ...(code && { code }),
      ...(details && { details })
    }
  };
}
```

#### Step 2: Update API Handler Middleware

Modify `lib/middleware/api-handler.ts`:
```typescript
import { NextResponse } from 'next/server';
import { successResponse, errorResponse } from '@/types/api-response';
import { isApiError } from '@/lib/errors/api-errors';

export function apiHandler<T = any>(handler: ApiHandler<T>) {
  return async (request: Request, context?: any) => {
    try {
      const result = await handler(request, context);

      // If result already has success field, return as-is
      if (typeof result === 'object' && result !== null && 'success' in result) {
        return NextResponse.json(result);
      }

      // Otherwise wrap in success response
      return NextResponse.json(successResponse(result));
    } catch (error) {
      if (isApiError(error)) {
        return NextResponse.json(
          errorResponse(error.message, error.code),
          { status: error.statusCode }
        );
      }

      // Unexpected error
      console.error('Unexpected API error:', error);
      return NextResponse.json(
        errorResponse('An unexpected error occurred', 'INTERNAL_ERROR'),
        { status: 500 }
      );
    }
  };
}
```

#### Step 3: Update All API Routes

Before:
```typescript
export async function GET(request: Request) {
  const projects = await db.project.findMany();
  return NextResponse.json({ success: true, data: projects });
}
```

After:
```typescript
import { successResponse } from '@/types/api-response';

export async function GET(request: Request) {
  const projects = await db.project.findMany();
  return NextResponse.json(successResponse(projects));
}

// Or even simpler with apiHandler:
export const GET = apiHandler(async (request) => {
  const projects = await db.project.findMany();
  return projects; // Automatically wrapped
});
```

#### Step 4: Update Client-Side Error Handling

Create `lib/api-client.ts`:
```typescript
import { ApiResponse } from '@/types/api-response';

export async function fetchApi<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const data: ApiResponse<T> = await response.json();

  if (!data.success) {
    throw new Error(data.error.message, {
      cause: data.error
    });
  }

  return data.data;
}

// Usage:
try {
  const projects = await fetchApi<Project[]>('/api/projects?organizationId=123');
  console.log(projects);
} catch (error) {
  toast.error(error.message);
}
```

### Acceptance Criteria
- [ ] Create `types/api-response.ts` with standard interfaces
- [ ] Add helper functions `successResponse()` and `errorResponse()`
- [ ] Update `apiHandler` middleware to use standard format
- [ ] Audit all API routes (count: ~30 files)
- [ ] Update GET endpoints to use standard format
- [ ] Update POST endpoints to use standard format
- [ ] Update PUT/PATCH endpoints to use standard format
- [ ] Update DELETE endpoints to use standard format
- [ ] Create `lib/api-client.ts` wrapper
- [ ] Update frontend to use API client
- [ ] Remove all `new Response()` usages in favor of `NextResponse.json()`
- [ ] Document response format in API docs
- [ ] Add TypeScript types for all API responses

### Files to Update
- `app/api/organizations/route.ts`
- `app/api/organizations/[id]/route.ts`
- `app/api/projects/route.ts`
- `app/api/projects/[projectId]/route.ts`
- `app/api/questions/[projectId]/route.ts`
- `app/api/llamacloud/projects/route.ts`
- `app/api/llamacloud/connect/route.ts`
- `app/api/llamacloud/disconnect/route.ts`
- `app/api/extract-questions/route.ts`
- `app/api/generate-response/route.ts`
- `app/api/generate-response-multistep/route.ts`
- All other API routes

### Testing
- [ ] Test that all success responses have `{ success: true, data: ... }` format
- [ ] Test that all error responses have `{ success: false, error: { message, code } }` format
- [ ] Test that status codes are correct (200, 201, 400, 401, 403, 404, 500)
- [ ] Test that client can handle all responses correctly

### Estimated Effort
4-6 hours

### Related Issues
- HIGH-002 (Enforce middleware usage)
- MED-008 (Standardize toast notifications)
