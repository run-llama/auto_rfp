#!/usr/bin/env python3
"""Generate remaining GitHub issue markdown files"""

import os

MEDIUM_ISSUES = {
    "MED-001": {
        "title": "Extract Common Form Submission Hook",
        "summary": "Duplicate form submission logic with loading/error states across 15+ components.",
        "implementation": """Create reusable hook:
```typescript
// hooks/use-form-submit.ts
export function useFormSubmit<T>() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (
    fn: () => Promise<T>,
    options?: { successMessage?: string }
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await fn();
      if (options?.successMessage) {
        toast.success(options.successMessage);
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { submit, isLoading, error };
}
```""",
        "criteria": "- [ ] Create useFormSubmit hook\n- [ ] Handle loading state\n- [ ] Handle error state\n- [ ] Toast notifications\n- [ ] Replace duplicate logic",
        "effort": "3-4 hours"
    },
    "MED-002": {
        "title": "Create Reusable LoadingSpinner Component",
        "summary": "Loading spinner markup duplicated in 10+ files.",
        "implementation": """```typescript
// components/ui/loading-spinner.tsx
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div className={`animate-spin rounded-full border-b-2 border-primary ${sizeClasses[size]}`} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}
```""",
        "criteria": "- [ ] Create LoadingSpinner component\n- [ ] Support size variants\n- [ ] Optional loading text\n- [ ] Replace all duplicate markup",
        "effort": "1-2 hours"
    },
    "MED-003": {
        "title": "Create Reusable RoleBadge Component",
        "summary": "Role badge logic duplicated across components.",
        "implementation": """```typescript
// components/organizations/role-badge.tsx
export function RoleBadge({ role }: { role: string }) {
  const variants = {
    owner: { variant: 'default', label: 'Owner' },
    admin: { variant: 'secondary', label: 'Admin' },
    member: { variant: 'outline', label: 'Member' }
  } as const;

  const config = variants[role as keyof typeof variants] || variants.member;

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
```""",
        "criteria": "- [ ] Create RoleBadge component\n- [ ] Support owner/admin/member\n- [ ] Consistent colors\n- [ ] Replace duplicate logic",
        "effort": "1-2 hours"
    },
    "MED-004": {
        "title": "Create Reusable SourcesList Component",
        "summary": "Source citation display duplicated in question-editor and multi-step-dialog.",
        "implementation": """```typescript
// components/sources-list.tsx
interface SourcesListProps {
  sources: Source[];
  onSourceClick?: (source: Source) => void;
  variant?: 'compact' | 'expanded';
}

export function SourcesList({ sources, onSourceClick, variant = 'compact' }: SourcesListProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {sources.map((source) => (
        <Button
          key={source.id}
          variant="outline"
          size="sm"
          onClick={() => onSourceClick?.(source)}
        >
          {source.fileName}
          {source.pageNumber && ` (p.${source.pageNumber})`}
        </Button>
      ))}
    </div>
  );
}
```""",
        "criteria": "- [ ] Create SourcesList component\n- [ ] Support compact/expanded views\n- [ ] Handle click interactions\n- [ ] Replace duplicate markup",
        "effort": "2-3 hours"
    },
    "MED-005": {
        "title": "Replace Any Types with Proper Interfaces",
        "summary": "Multiple files use `any` types, losing type safety.",
        "implementation": """Create proper interfaces:
```typescript
// types/rfp.ts
export interface RFPDocument {
  id: string;
  sections: RFPSection[];
}

export interface RFPSection {
  id: string;
  title: string;
  questions: RFPQuestion[];
}

// Replace: rfpDocument: any
// With:    rfpDocument: RFPDocument
```""",
        "criteria": "- [ ] Define all missing interfaces\n- [ ] Replace Record<string, any>\n- [ ] Enable noImplicitAny\n- [ ] Fix all type errors",
        "effort": "4-5 hours"
    },
    "MED-006": {
        "title": "Add Return Type Annotations",
        "summary": "Many functions missing explicit return types.",
        "implementation": """```typescript
// Before
async function getOrganization(id: string) {
  return await db.organization.findUnique({ where: { id } });
}

// After
async function getOrganization(id: string): Promise<Organization | null> {
  return await db.organization.findUnique({ where: { id } });
}
```""",
        "criteria": "- [ ] Add return types to all exported functions\n- [ ] Add return types to class methods\n- [ ] Enable noImplicitReturns\n- [ ] Document complex return types",
        "effort": "2-3 hours"
    },
    "MED-007": {
        "title": "Implement Error Boundary Components",
        "summary": "No error boundaries to catch React errors.",
        "implementation": """```typescript
// components/error-boundary.tsx
export class ErrorBoundary extends React.Component<Props, State> {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught:', error, errorInfo);
    // Log to monitoring service
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} onReset={this.reset} />;
    }
    return this.props.children;
  }
}
```""",
        "criteria": "- [ ] Create global error boundary\n- [ ] Add route-level boundaries\n- [ ] Fallback UI\n- [ ] Error logging\n- [ ] Reset functionality",
        "effort": "3-4 hours"
    },
    "MED-008": {
        "title": "Standardize Toast Notification Patterns",
        "summary": "15+ files with different toast patterns.",
        "implementation": """```typescript
// lib/utils/toast.ts
export const toastUtils = {
  success: (message: string) => toast.success(message, { duration: 3000 }),
  error: (error: unknown) => {
    const message = error instanceof Error ? error.message : 'An error occurred';
    toast.error(message, { duration: 5000 });
  },
  loading: (message: string) => toast.loading(message),
  promise: <T,>(promise: Promise<T>, messages: { loading: string; success: string; error: string }) =>
    toast.promise(promise, messages)
};
```""",
        "criteria": "- [ ] Create toast utility functions\n- [ ] Standardize messages\n- [ ] Configure durations\n- [ ] Replace all direct toast calls",
        "effort": "2-3 hours"
    },
    "MED-009": {
        "title": "Add Request Cancellation",
        "summary": "API calls not cancelled on component unmount.",
        "implementation": """```typescript
export function useApi<T>(url: string) {
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    fetch(url, { signal: abortController.signal })
      .then(res => res.json())
      .then(setData)
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error(err);
        }
      });

    return () => abortController.abort();
  }, [url]);

  return data;
}
```""",
        "criteria": "- [ ] Use AbortController in fetch calls\n- [ ] Cancel on unmount\n- [ ] Handle cancellation errors\n- [ ] Add to custom hooks",
        "effort": "3-4 hours"
    },
    "MED-010": {
        "title": "Wrap Database Errors Consistently",
        "summary": "Not all Prisma errors wrapped in DatabaseError.",
        "implementation": """```typescript
try {
  return await db.project.create({ data });
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    throw new DatabaseError(`Failed to create project: ${error.message}`, error.code);
  }
  throw new DatabaseError('Unexpected database error');
}
```""",
        "criteria": "- [ ] Wrap all Prisma errors\n- [ ] Add context to messages\n- [ ] Distinguish error types\n- [ ] Log original errors",
        "effort": "2-3 hours"
    },
    "MED-011": {
        "title": "Add JSDoc Comments to Public APIs",
        "summary": "Missing documentation for exported functions.",
        "implementation": """```typescript
/**
 * Creates a new project for an organization
 * @param data - Project creation data
 * @param data.name - Project name (required)
 * @param data.organizationId - Organization ID (required)
 * @returns Created project with full details
 * @throws {ValidationError} If data is invalid
 * @throws {AuthorizationError} If user lacks permission
 * @example
 * const project = await createProject({
 *   name: 'My Project',
 *   organizationId: '123'
 * });
 */
async function createProject(data: CreateProjectData): Promise<Project> {
  // ...
}
```""",
        "criteria": "- [ ] Add JSDoc to all exports\n- [ ] Document parameters\n- [ ] Add usage examples\n- [ ] Document exceptions\n- [ ] Generate TypeDoc",
        "effort": "4-5 hours"
    },
    "MED-012": {
        "title": "Extract Complex Transaction Logic",
        "summary": "saveQuestions method is 58 lines - should be broken down.",
        "implementation": """Break down into smaller functions:
```typescript
async saveQuestions(projectId: string, sections: Section[]) {
  await db.$transaction(async (tx) => {
    const allQuestions = this.extractAllQuestions(sections);
    await this.deduplicateQuestions(tx, projectId, allQuestions);
    await this.batchCreateQuestions(tx, projectId, allQuestions);
  });
}

private extractAllQuestions(sections: Section[]): QuestionItem[] {
  // Extraction logic
}

private async deduplicateQuestions(tx, projectId, questions) {
  // Deduplication logic
}
```""",
        "criteria": "- [ ] Break into smaller functions\n- [ ] Extract question deduplication\n- [ ] Extract batch processing\n- [ ] Add unit tests\n- [ ] Improve error messages",
        "effort": "3-4 hours"
    },
    "MED-013": {
        "title": "Add Focus Management to Dialogs",
        "summary": "Dialogs don't manage focus properly.",
        "implementation": """```typescript
export function Dialog({ open, onOpenChange, children }) {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    } else {
      previousFocusRef.current?.focus();
    }
  }, [open]);

  return <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} />;
}
```""",
        "criteria": "- [ ] Auto-focus first input\n- [ ] Implement focus trap\n- [ ] Return focus on close\n- [ ] Test keyboard nav\n- [ ] Visual focus indicators",
        "effort": "3-4 hours"
    },
    "MED-014": {
        "title": "Add Keyboard Handlers to Clickable Elements",
        "summary": "Clickable spans missing keyboard support.",
        "implementation": """```typescript
<button
  type="button"
  onClick={handleClick}
  className="..."
>
  {text}
</button>

// Or if must use span:
<span
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
  onClick={handleClick}
>
  {text}
</span>
```""",
        "criteria": "- [ ] Add onKeyDown to clickable spans\n- [ ] Support Enter and Space\n- [ ] Or convert to buttons\n- [ ] Add role='button'\n- [ ] Test keyboard nav",
        "effort": "2-3 hours"
    },
    "MED-015": {
        "title": "Implement Structured Logging Service",
        "summary": "Using console.log instead of proper logging.",
        "implementation": """```typescript
// lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label })
  },
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty'
  } : undefined
});

// Usage
logger.info({ userId, projectId }, 'Project created');
logger.error({ error }, 'Failed to create project');
```""",
        "criteria": "- [ ] Install winston or pino\n- [ ] Create logger wrapper\n- [ ] Configure transports\n- [ ] JSON logging\n- [ ] Request context\n- [ ] Log rotation",
        "effort": "4-5 hours"
    },
    "MED-016": {
        "title": "Add API Documentation (Swagger)",
        "summary": "No API documentation for endpoints.",
        "implementation": """```typescript
// Install next-swagger-doc
/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: List projects
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Project'
 */
export async function GET(request: Request) {}
```""",
        "criteria": "- [ ] Install swagger tools\n- [ ] Document all endpoints\n- [ ] Request/response examples\n- [ ] Error responses\n- [ ] Interactive docs\n- [ ] Add to README",
        "effort": "6-8 hours"
    },
    "MED-017": {
        "title": "Add Rate Limiting",
        "summary": "No rate limiting on API endpoints.",
        "implementation": """```typescript
// lib/middleware/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

export async function rateLimit(identifier: string) {
  const { success, limit, reset, remaining } = await ratelimit.limit(identifier);

  if (!success) {
    throw new Error('Rate limit exceeded');
  }

  return { limit, reset, remaining };
}
```""",
        "criteria": "- [ ] Install rate limiting library\n- [ ] Add per user/IP limits\n- [ ] Different limits per endpoint\n- [ ] Return 429 status\n- [ ] Rate limit headers\n- [ ] Document limits",
        "effort": "3-4 hours"
    },
    "MED-018": {
        "title": "Configure Security Headers",
        "summary": "Missing security headers (CSP, X-Frame-Options, etc.).",
        "implementation": """```typescript
// next.config.js
module.exports = {
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
        {
          key: 'Content-Security-Policy',
          value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'"
        }
      ]
    }];
  }
};
```""",
        "criteria": "- [ ] Add CSP header\n- [ ] Add X-Frame-Options\n- [ ] Add X-Content-Type-Options\n- [ ] Add HSTS\n- [ ] Configure CORS\n- [ ] Test with securityheaders.com",
        "effort": "2-3 hours"
    },
    "MED-019": {
        "title": "Add CORS Configuration",
        "summary": "No explicit CORS configuration.",
        "implementation": """```typescript
// middleware.ts or API routes
const allowedOrigins = [
  process.env.NEXT_PUBLIC_APP_URL,
  'http://localhost:3000'
];

export function corsHeaders(origin?: string) {
  const headers = new Headers();

  if (origin && allowedOrigins.includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  return headers;
}
```""",
        "criteria": "- [ ] Define allowed origins\n- [ ] Configure allowed methods\n- [ ] Preflight handling\n- [ ] Credentials support\n- [ ] Test cross-origin requests",
        "effort": "2-3 hours"
    },
    "MED-020": {
        "title": "Optimize Framer Motion Animations",
        "summary": "Animations recalculate on every render, causing performance issues.",
        "implementation": """```typescript
// Memoize variants
const variants = useMemo(() => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}), []);

// Use layoutId for optimized animations
<motion.div
  layoutId="step-container"
  variants={variants}
  initial="initial"
  animate="animate"
>
  {content}
</motion.div>
```""",
        "criteria": "- [ ] Add layoutId for layout animations\n- [ ] Use transform instead of layout\n- [ ] Memoize animation variants\n- [ ] Reduce animation complexity\n- [ ] Test with React DevTools Profiler",
        "effort": "2-3 hours"
    }
}

LOW_ISSUES = {
    "LOW-001": {
        "title": "Add Unit Tests",
        "summary": "No unit tests found in codebase.",
        "implementation": "Set up Jest and React Testing Library. Add tests for services, utilities, hooks, and components. Target 80% coverage for critical paths.",
        "criteria": "- [ ] Set up Jest + RTL\n- [ ] Test services (80% coverage)\n- [ ] Test utilities\n- [ ] Test hooks\n- [ ] Test components\n- [ ] CI integration",
        "effort": "20-30 hours (ongoing)"
    },
    "LOW-002": {
        "title": "Add Integration Tests",
        "summary": "No end-to-end testing.",
        "implementation": "Set up Playwright or Cypress. Test auth flow, project creation, question extraction, and response generation end-to-end.",
        "criteria": "- [ ] Set up Playwright/Cypress\n- [ ] Test auth flow\n- [ ] Test project creation\n- [ ] Test question extraction\n- [ ] Test response generation\n- [ ] CI integration",
        "effort": "15-20 hours (ongoing)"
    },
    "LOW-003": {
        "title": "Add Performance Monitoring",
        "summary": "No performance tracking.",
        "implementation": "Add React DevTools Profiler markers, Web Vitals monitoring, API response time tracking, and database query performance monitoring.",
        "criteria": "- [ ] Add Profiler markers\n- [ ] Web Vitals monitoring\n- [ ] Track API response times\n- [ ] Monitor DB queries\n- [ ] Set up alerting",
        "effort": "4-5 hours"
    },
    "LOW-004": {
        "title": "Implement Component Lazy Loading",
        "summary": "All components loaded eagerly.",
        "implementation": "Use React.lazy for route components. Add Suspense boundaries with loading states. Test code splitting in production build.",
        "criteria": "- [ ] Identify heavy components\n- [ ] Implement React.lazy\n- [ ] Add Suspense boundaries\n- [ ] Add loading states\n- [ ] Test code splitting",
        "effort": "3-4 hours"
    },
    "LOW-005": {
        "title": "Add Component Storybook",
        "summary": "No component library documentation.",
        "implementation": "Install Storybook. Create stories for UI components with all variants. Document props and usage. Add interaction tests.",
        "criteria": "- [ ] Install Storybook\n- [ ] Create stories for UI components\n- [ ] Document props/variants\n- [ ] Add interaction tests\n- [ ] Deploy Storybook",
        "effort": "8-10 hours"
    },
    "LOW-006": {
        "title": "Improve Error Messages",
        "summary": "Error messages too technical for users.",
        "implementation": "Review all user-facing errors. Make messages actionable with suggestions. Avoid technical jargon. Test all error states.",
        "criteria": "- [ ] Review all error messages\n- [ ] Make messages actionable\n- [ ] Add resolution suggestions\n- [ ] Avoid technical jargon\n- [ ] Test error states",
        "effort": "3-4 hours"
    },
    "LOW-007": {
        "title": "Add Input Sanitization Library",
        "summary": "No explicit input sanitization.",
        "implementation": "Install DOMPurify. Sanitize user input before display and storage. Add to validation pipeline.",
        "criteria": "- [ ] Install DOMPurify\n- [ ] Sanitize before display\n- [ ] Sanitize before storage\n- [ ] Add to validation pipeline",
        "effort": "2-3 hours"
    },
    "LOW-008": {
        "title": "Add Database Migration Documentation",
        "summary": "Missing migration procedures.",
        "implementation": "Document migration process, rollback procedures, seed data usage, backup procedures, and create migration checklist.",
        "criteria": "- [ ] Document migration process\n- [ ] Add rollback procedures\n- [ ] Document seed data\n- [ ] Add backup procedures\n- [ ] Create migration checklist",
        "effort": "2-3 hours"
    },
    "LOW-009": {
        "title": "Optimize Bundle Size",
        "summary": "No bundle size optimization.",
        "implementation": "Analyze bundle with @next/bundle-analyzer. Remove unused dependencies. Use tree-shaking. Lazy load large dependencies. Target <200KB initial bundle.",
        "criteria": "- [ ] Analyze bundle\n- [ ] Remove unused deps\n- [ ] Use tree-shaking\n- [ ] Lazy load large deps\n- [ ] Target <200KB initial",
        "effort": "4-5 hours"
    },
    "LOW-010": {
        "title": "Add Git Hooks",
        "summary": "No pre-commit hooks for code quality.",
        "implementation": "Install husky. Add pre-commit hook for lint and type-check. Add commit-msg hook for conventional commits. Add pre-push hook for tests.",
        "criteria": "- [ ] Install husky\n- [ ] Pre-commit (lint, type-check)\n- [ ] Commit-msg (conventional)\n- [ ] Pre-push (tests)\n- [ ] Document in CONTRIBUTING.md",
        "effort": "1-2 hours"
    },
    "LOW-011": {
        "title": "Add Changelog",
        "summary": "No CHANGELOG.md tracking changes.",
        "implementation": "Create CHANGELOG.md using Keep a Changelog format. Document breaking changes, new features, and bug fixes for each release.",
        "criteria": "- [ ] Create CHANGELOG.md\n- [ ] Use Keep a Changelog format\n- [ ] Document breaking changes\n- [ ] Document new features\n- [ ] Update with each release",
        "effort": "1-2 hours (ongoing)"
    },
    "LOW-012": {
        "title": "Expand Contributing Guidelines",
        "summary": "CONTRIBUTING.md needs more detail.",
        "implementation": "Document code style, PR process, testing requirements. Add issue and PR templates.",
        "criteria": "- [ ] Document code style\n- [ ] Document PR process\n- [ ] Add issue templates\n- [ ] Add PR template\n- [ ] Document testing requirements",
        "effort": "3-4 hours"
    }
}

def create_issue_file(issue_id, issue_data, priority):
    """Create a markdown file for an issue"""
    priority_emoji = {"MED": "🟡", "LOW": "🟢"}
    priority_name = {"MED": "Medium", "LOW": "Low"}

    content = f"""# {issue_data['title']}

## {priority_emoji[priority]} {priority_name[priority]} Priority

### Summary
{issue_data['summary']}

### Implementation
{issue_data['implementation']}

### Acceptance Criteria
{issue_data['criteria']}

### Estimated Effort
{issue_data['effort']}
"""

    filename = f".github/issues/{issue_id}.md"
    with open(filename, 'w') as f:
        f.write(content)

    return filename

def main():
    """Generate all issue files"""
    created = []

    # Create MEDIUM priority issues
    for issue_id, data in MEDIUM_ISSUES.items():
        filename = create_issue_file(issue_id, data, "MED")
        created.append(filename)

    # Create LOW priority issues
    for issue_id, data in LOW_ISSUES.items():
        filename = create_issue_file(issue_id, data, "LOW")
        created.append(filename)

    print(f"✅ Created {len(created)} issue files:")
    for f in created:
        print(f"  - {f}")

if __name__ == "__main__":
    main()
