# Centralize Environment Variable Validation

## 🟠 High Priority - Configuration Management

### Summary
Only `LLAMACLOUD_API_KEY` is validated in `lib/env.ts`, while other critical environment variables (OpenAI, Supabase, Database) are accessed directly via `process.env` without validation, leading to potential runtime errors.

### Impact
- Application crashes with cryptic errors if env vars are missing
- No startup validation - errors occur deep in the application
- Harder to debug configuration issues
- Found 12 files with direct `process.env` access

### Current State

**File**: `lib/env.ts` (lines 1-25)
```typescript
export const env = {
  LLAMACLOUD_API_KEY: process.env.LLAMACLOUD_API_KEY || '',
};

export function validateEnv() {
  const requiredVars = [
    { key: 'LLAMACLOUD_API_KEY', value: env.LLAMACLOUD_API_KEY }
  ];
  // Only validates one variable!
}
```

**Direct access in services:**
```typescript
// lib/services/openai-question-extractor.ts (line 16)
const apiKey = process.env.OPENAI_API_KEY; // ❌ No validation

// lib/utils/supabase/server.ts (line 8)
process.env.NEXT_PUBLIC_SUPABASE_URL! // ❌ Using ! assertion
```

### Implementation Strategy

```typescript
// lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  // OpenAI
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),

  // Database
  DATABASE_URL: z.string().url('Invalid database URL'),
  DIRECT_URL: z.string().url('Invalid direct database URL').optional(),

  // LlamaCloud
  LLAMACLOUD_API_KEY: z.string().min(1, 'LlamaCloud API key is required'),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Validate and export typed environment
function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Environment validation failed:');
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    }
    process.exit(1);
  }
}

export const env = validateEnv();

// Now import env object instead of process.env everywhere
```

**Update services:**
```typescript
// lib/services/openai-question-extractor.ts
import { env } from '@/lib/env';

const apiKey = env.OPENAI_API_KEY; // ✅ Validated and typed
```

### Acceptance Criteria
- [ ] Add all required environment variables to envSchema
- [ ] Use Zod for validation with helpful error messages
- [ ] Export typed `env` object
- [ ] Replace all `process.env.*` with `env.*` imports
- [ ] Add startup validation that fails fast
- [ ] Create comprehensive `.env.example` file
- [ ] Document all env vars in README
- [ ] Add validation to check required vs optional vars

### Files with Direct process.env Access (12 files)
- `lib/services/openai-question-extractor.ts`
- `lib/utils/supabase/server.ts`
- `lib/utils/supabase/client.ts`
- `lib/utils/supabase/middleware.ts`
- `lib/db.ts`
- And 7 more files

### Estimated Effort
3-4 hours
