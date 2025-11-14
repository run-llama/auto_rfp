# Implement Comprehensive Accessibility Features

## 🟠 High Priority - Accessibility & Compliance

### Summary
The application has minimal accessibility features, making it difficult or impossible for users with disabilities to use. Only 52 ARIA attributes found across entire codebase.

### Impact
- Not accessible to screen reader users
- Cannot be navigated with keyboard only
- Non-compliant with WCAG 2.1 AA standards
- Potential legal liability
- Excludes users with disabilities

### Current State

#### Problem 1: Missing ARIA Labels on Interactive Elements
**File**: `components/organizations/ProjectCard.tsx` (lines 19-39)

```typescript
<Link href={`/project/${project.id}?orgId=${orgId}`} className="block">
  <Card className="hover:shadow-lg hover:bg-accent/50 transition-all duration-200 cursor-pointer h-full">
    {/* ❌ Screen reader only announces "link" with no context */}
    <CardHeader>
      <CardTitle>{project.name}</CardTitle>
    </CardHeader>
  </Card>
</Link>
```

#### Problem 2: Clickable Non-Button Elements
**File**: `app/projects/[projectId]/questions/components/question-editor.tsx` (lines 102-110)

```typescript
<span
  key={source.id}
  className="inline-block px-2 py-1 bg-slate-100..."
  onClick={() => onSourceClick(source)}
>
  {/* ❌ Not keyboard accessible, no role, no aria attributes */}
  {source.fileName}
</span>
```

#### Problem 3: Missing Focus Management in Dialogs
**File**: `components/ui/multi-step-response-dialog.tsx`

```typescript
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent>
    {/* ❌ No autoFocus on first element */}
    {/* ❌ No focus trap */}
    {/* ❌ Focus doesn't return to trigger on close */}
  </DialogContent>
</Dialog>
```

#### Problem 4: No Loading State Announcements
**File**: `app/projects/[projectId]/questions/components/questions-states.tsx`

```typescript
{isLoading && (
  <div className="flex justify-center">
    {/* ❌ No aria-live region - screen readers don't know loading finished */}
    <LoadingSpinner />
  </div>
)}
```

#### Problem 5: Color-Only Status Indicators
**File**: `app/projects/[projectId]/questions/components/question-editor.tsx` (lines 61-67)

```typescript
<Badge
  variant="outline"
  className={answer?.text ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}
>
  {/* Text is good, but color is primary indicator */}
  {answer?.text ? "Answered" : "Needs Answer"}
</Badge>
```

### Implementation Strategy

#### Step 1: Add ARIA Labels to Interactive Elements

```typescript
// components/organizations/ProjectCard.tsx
<Link
  href={`/project/${project.id}?orgId=${orgId}`}
  className="block"
  aria-label={`View project: ${project.name}`} // ✅ Descriptive label
>
  <Card className="hover:shadow-lg hover:bg-accent/50 transition-all duration-200 cursor-pointer h-full">
    <CardHeader>
      <CardTitle>{project.name}</CardTitle>
      {project.description && (
        <CardDescription>{project.description}</CardDescription>
      )}
    </CardHeader>
  </Card>
</Link>
```

#### Step 2: Fix Clickable Non-Button Elements

**Option 1: Convert to Button**
```typescript
<button
  key={source.id}
  type="button"
  className="inline-block px-2 py-1 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
  onClick={() => onSourceClick(source)}
  aria-label={`View source: ${source.fileName}, page ${source.pageNumber}`}
>
  {source.fileName}
</button>
```

**Option 2: Add Keyboard Handlers and ARIA**
```typescript
<span
  key={source.id}
  role="button"
  tabIndex={0}
  className="inline-block px-2 py-1 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors cursor-pointer"
  onClick={() => onSourceClick(source)}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSourceClick(source);
    }
  }}
  aria-label={`View source: ${source.fileName}, page ${source.pageNumber}`}
>
  {source.fileName}
</span>
```

#### Step 3: Implement Focus Management in Dialogs

```typescript
import { useRef, useEffect } from 'react';

export function MultiStepResponseDialog({ open, onOpenChange, ...props }) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      // Store current focus
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Focus first element
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 0);
    } else {
      // Return focus when closing
      previousFocusRef.current?.focus();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
      >
        <DialogHeader>
          <DialogTitle id="dialog-title">
            Multi-Step Response Generation
          </DialogTitle>
          <DialogDescription id="dialog-description">
            The AI is analyzing your question through multiple steps
          </DialogDescription>
        </DialogHeader>

        {/* Content */}

        <DialogClose ref={closeButtonRef} />
      </DialogContent>
    </Dialog>
  );
}
```

#### Step 4: Add Loading State Announcements

```typescript
// Create reusable LiveRegion component
export function LiveRegion({
  message,
  politeness = 'polite'
}: {
  message: string;
  politeness?: 'polite' | 'assertive'
}) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only" // Visually hidden but announced
    >
      {message}
    </div>
  );
}

// Usage
export function QuestionsSection() {
  const { isLoading } = useQuestions();

  return (
    <>
      {isLoading && (
        <>
          <LoadingSpinner />
          <LiveRegion message="Loading questions, please wait..." />
        </>
      )}

      {!isLoading && questions && (
        <>
          <QuestionsList questions={questions} />
          <LiveRegion message={`Loaded ${questions.length} questions`} />
        </>
      )}
    </>
  );
}
```

#### Step 5: Add Icon Indicators for Color-Coded States

```typescript
import { Check, Clock } from 'lucide-react';

<Badge
  variant="outline"
  className={answer?.text ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}
>
  {/* ✅ Icon provides redundant non-color indicator */}
  {answer?.text ? (
    <>
      <Check className="w-3 h-3 mr-1" aria-hidden="true" />
      <span>Answered</span>
    </>
  ) : (
    <>
      <Clock className="w-3 h-3 mr-1" aria-hidden="true" />
      <span>Needs Answer</span>
    </>
  )}
</Badge>
```

#### Step 6: Add Skip Navigation

```typescript
// components/SkipToContent.tsx
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
    >
      Skip to main content
    </a>
  );
}

// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SkipToContent />
        <header>...</header>
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
      </body>
    </html>
  );
}
```

#### Step 7: Ensure Form Labels

```typescript
// Before: Implicit label
<div>
  <input id="project-name" type="text" />
</div>

// After: Explicit label
<div>
  <Label htmlFor="project-name">
    Project Name <span aria-label="required">*</span>
  </Label>
  <Input
    id="project-name"
    type="text"
    aria-required="true"
    aria-invalid={!!errors.name}
    aria-describedby={errors.name ? "name-error" : undefined}
  />
  {errors.name && (
    <p id="name-error" className="text-sm text-red-600" role="alert">
      {errors.name.message}
    </p>
  )}
</div>
```

### Acceptance Criteria

#### ARIA Labels & Roles
- [ ] Add aria-label to all interactive cards and links
- [ ] Add role="button" to clickable non-button elements
- [ ] Add aria-describedby for additional context where needed
- [ ] Add aria-labelledby to dialogs
- [ ] Add proper heading hierarchy (h1, h2, h3)

#### Keyboard Navigation
- [ ] Add onKeyDown handlers to all clickable spans
- [ ] Support Enter and Space keys for activation
- [ ] Test Tab navigation through all interactive elements
- [ ] Implement focus trap in all dialogs
- [ ] Add skip navigation link

#### Focus Management
- [ ] Auto-focus first element when dialogs open
- [ ] Return focus to trigger when dialogs close
- [ ] Add visible focus indicators (not just browser default)
- [ ] Test focus order is logical

#### Screen Reader Support
- [ ] Add aria-live regions for loading states
- [ ] Add aria-live for dynamic content updates
- [ ] Test with NVDA or JAWS screen reader
- [ ] Add alt text to all images
- [ ] Add sr-only text for icon-only buttons

#### Forms
- [ ] Associate all inputs with labels
- [ ] Add aria-required to required fields
- [ ] Add aria-invalid for error states
- [ ] Add aria-describedby for error messages
- [ ] Announce form submission results

#### Color & Contrast
- [ ] Add icons to supplement color-coded information
- [ ] Test color contrast ratios (4.5:1 minimum)
- [ ] Ensure focus indicators have sufficient contrast

#### Testing
- [ ] Run axe-core accessibility audit
- [ ] Test with keyboard only (no mouse)
- [ ] Test with screen reader (NVDA/JAWS)
- [ ] Test with browser zoom at 200%
- [ ] Achieve WCAG 2.1 AA compliance

### Files to Update
- [ ] `components/organizations/ProjectCard.tsx`
- [ ] `app/projects/[projectId]/questions/components/question-editor.tsx`
- [ ] `components/ui/multi-step-response-dialog.tsx`
- [ ] `components/organizations/InviteMemberDialog.tsx`
- [ ] All dialog components
- [ ] All form components
- [ ] `app/layout.tsx` (skip navigation)

### Tools & Resources
- Install @axe-core/react for development
- Install eslint-plugin-jsx-a11y
- Use WAVE browser extension
- Use Lighthouse accessibility audit

### Estimated Effort
10-12 hours

### Related Issues
- MED-013 (Focus management in dialogs)
- MED-014 (Keyboard handlers)
