# Code Quality Issues - Quick Checklist

**Last Updated**: 2025-11-14

Use this checklist to track progress on code quality improvements.

## 🔴 CRITICAL (Must Fix Before Production)

- [ ] **CRIT-001**: Add authentication to Projects API (`/api/projects`)
- [ ] **CRIT-002**: Add authentication to Questions API (`/api/questions/[projectId]`)

## 🟠 HIGH PRIORITY

### Security & Consistency
- [ ] **HIGH-001**: Standardize error response format across all APIs
- [ ] **HIGH-002**: Use middleware on all API routes
- [ ] **HIGH-007**: Centralize environment variable validation
- [ ] **HIGH-008**: Add Zod validation to all endpoints

### Performance
- [ ] **HIGH-003**: Remove 250+ console.log statements
- [ ] **HIGH-004**: Refactor 726-line questions-provider.tsx
- [ ] **HIGH-005**: Add memoization (React.memo, useMemo, useCallback)
- [ ] **HIGH-010**: Fix infinite loop workarounds in organization-context
- [ ] **HIGH-011**: Optimize API calls (remove duplicate fetches)
- [ ] **HIGH-013**: Database optimization (use createMany, optimize queries)

### Code Quality
- [ ] **HIGH-009**: Extract duplicate LlamaCloud logic
- [ ] **HIGH-012**: Replace magic numbers with constants

### Accessibility
- [ ] **HIGH-006**: Add ARIA labels, keyboard handlers, focus management

## 🟡 MEDIUM PRIORITY

### Code Reusability
- [ ] **MED-001**: Create useFormSubmit hook
- [ ] **MED-002**: Create LoadingSpinner component
- [ ] **MED-003**: Create RoleBadge component
- [ ] **MED-004**: Create SourcesList component

### Type Safety
- [ ] **MED-005**: Replace all `any` types
- [ ] **MED-006**: Add return type annotations

### Error Handling
- [ ] **MED-007**: Add error boundary components
- [ ] **MED-008**: Standardize toast notifications
- [ ] **MED-010**: Wrap database errors consistently

### Performance & UX
- [ ] **MED-009**: Add request cancellation
- [ ] **MED-012**: Extract complex transaction logic
- [ ] **MED-020**: Optimize Framer Motion animations

### Accessibility
- [ ] **MED-013**: Focus management in dialogs
- [ ] **MED-014**: Keyboard handlers for clickable elements

### Infrastructure
- [ ] **MED-015**: Implement logging service (winston/pino)
- [ ] **MED-016**: Add API documentation (Swagger)
- [ ] **MED-017**: Add rate limiting
- [ ] **MED-018**: Configure security headers
- [ ] **MED-019**: Add CORS configuration

### Documentation
- [ ] **MED-011**: Add JSDoc comments

## 🟢 LOW PRIORITY

### Testing
- [ ] **LOW-001**: Add unit tests (Jest + RTL)
- [ ] **LOW-002**: Add integration tests (Playwright/Cypress)

### Monitoring & Performance
- [ ] **LOW-003**: Add performance monitoring
- [ ] **LOW-004**: Implement component lazy loading
- [ ] **LOW-009**: Optimize bundle size

### Developer Experience
- [ ] **LOW-005**: Add Storybook
- [ ] **LOW-010**: Add git hooks (husky)

### Security
- [ ] **LOW-007**: Add input sanitization library

### Documentation
- [ ] **LOW-006**: Improve error messages
- [ ] **LOW-008**: Add database migration docs
- [ ] **LOW-011**: Add CHANGELOG.md
- [ ] **LOW-012**: Expand CONTRIBUTING.md

---

## Progress Summary

- **Critical**: 0/2 complete (0%)
- **High**: 0/13 complete (0%)
- **Medium**: 0/20 complete (0%)
- **Low**: 0/12 complete (0%)
- **Overall**: 0/47 complete (0%)

## Next Actions

1. Start with CRIT-001 and CRIT-002 (authentication)
2. Follow Sprint Plan in CODE_QUALITY_ISSUES.md
3. Update this checklist as you complete items
4. Refer to CODE_QUALITY_ISSUES.md for detailed acceptance criteria

---

**See CODE_QUALITY_ISSUES.md for detailed descriptions, file locations, and acceptance criteria for each issue.**
