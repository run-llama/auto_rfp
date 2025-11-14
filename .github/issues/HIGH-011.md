# Optimize API Call Pattern in Multi-Step Response Hook

## 🟠 High Priority - Performance

### Summary
`hooks/use-multi-step-response.ts` makes 2 separate API calls when 1 should suffice - pre-fetches sources then generates response.

### Current State
```typescript
// Lines 108-142: Pre-fetch sources
const sourcesResponse = await fetch('/api/generate-response', {
  method: 'POST',
  // Makes full API call just to get sources
});

// Then makes another call for actual generation
```

### Implementation
Modify API to return sources with response in single call:
```typescript
// Update response interface
interface GenerateResponseResult {
  response: string;
  sources: Source[];
  steps: Step[];
}

// Remove pre-fetch, use single call
const { response, sources, steps } = await generateResponse(request);
```

### Acceptance Criteria
- [ ] Modify API to return sources with response
- [ ] Remove pre-fetch sources API call
- [ ] Add request cancellation for component unmount
- [ ] Test sources display correctly

### Estimated Effort
4-5 hours
