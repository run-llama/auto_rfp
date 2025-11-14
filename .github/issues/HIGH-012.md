# Replace Magic Numbers with Named Constants

## 🟠 High Priority - Code Clarity

### Summary
Magic numbers used throughout code without explanation. Comment says "EXACTLY 5 times" but code uses different values.

### Examples
```typescript
// hooks/use-multi-step-response.ts (line 235)
if (latestAssistantMessage.toolInvocations?.length === 5) // Why 5?

// app/api/generate-response-multistep/route.ts (line 210)
maxSteps: 10, // Why 10? Inconsistent with 5 above
```

### Implementation
```typescript
// lib/constants/ai-config.ts
export const AI_CONFIG = {
  EXPECTED_RESPONSE_STEPS: 5,
  MAX_RESPONSE_STEPS: 10,
  DEFAULT_TEMPERATURE: 0.1,
  MAX_TOKENS: 4000,
} as const;

// Usage
import { AI_CONFIG } from '@/lib/constants/ai-config';

if (steps.length === AI_CONFIG.EXPECTED_RESPONSE_STEPS) {
  // Clear what we're checking
}
```

### Acceptance Criteria
- [ ] Create constants file for AI configuration
- [ ] Replace all magic numbers with named constants
- [ ] Document why these values are chosen
- [ ] Make values configurable if needed

### Estimated Effort
2-3 hours
