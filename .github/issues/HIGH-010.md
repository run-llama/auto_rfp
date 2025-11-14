# Fix Infinite Loop Workarounds in Organization Context

## 🟠 High Priority - Code Quality

### Summary
`context/organization-context.tsx` uses ref workarounds to prevent infinite loops, indicating architectural issues with useEffect dependencies.

### Current Problems
```typescript
// Lines 134-231
const lastProcessedPathRef = useRef<string>('');

useEffect(() => {
  if (lastProcessedPathRef.current === pathname) {
    return; // Hacky workaround
  }
  // Complex logic
}, [pathname, initialLoad]); // Missing dependencies
```

Comment: "Removed currentOrganization to prevent infinite loop"

### Implementation Strategy
1. Analyze and document actual dependency chain
2. Refactor useEffect hooks with correct dependencies
3. Remove ref workarounds
4. Consider using state machine (XState) for complex state
5. Add comments explaining state transitions

### Acceptance Criteria
- [ ] Remove lastProcessedPathRef workaround
- [ ] Fix useEffect dependency arrays
- [ ] Test organization switching thoroughly
- [ ] No infinite loops
- [ ] Proper state transitions

### Estimated Effort
6-8 hours
