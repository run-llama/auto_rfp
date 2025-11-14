# Remove Console Logs from Production Code

## 🟠 High Priority - Performance & Security

### Summary
The codebase contains 60+ files with console.log, console.error, and console.warn statements. These create performance overhead in production and can leak sensitive information to browser consoles.

### Impact
- Performance overhead from console operations in production
- Potential information leakage (API keys, user data, internal logic)
- Poor user experience when users open DevTools and see errors
- Difficult to control log levels based on environment
- No structured logging for production debugging
- Cannot easily integrate with logging services (Datadog, Sentry, etc.)

### Current State

**Heavy console usage in critical files:**

#### Example 1: Multi-step Response Hook (21 console statements)
```typescript
// hooks/use-multi-step-response.ts
const generateResponse = async (question: string) => {
  console.log('=== Starting generateResponse ===');
  console.log('Question:', question);
  console.log('Project ID:', projectId);
  console.log('Existing sources:', sources);

  try {
    console.log('Fetching sources...');
    const sourcesResult = await fetch('/api/get-sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, question }),
    });
    console.log('Sources fetch status:', sourcesResult.status);

    const sourcesData = await sourcesResult.json();
    console.log('Sources data:', sourcesData);

    // 15+ more console.log statements...
  } catch (error) {
    console.error('Error generating response:', error);
    console.error('Error details:', JSON.stringify(error));
  }
};
```

#### Example 2: Multi-step Response API (20+ console statements)
```typescript
// app/api/generate-response-multistep/route.ts
export async function POST(request: Request) {
  console.log('=== Multi-step Response API Called ===');

  const body = await request.json();
  console.log('Request body:', body);
  console.log('Question:', body.question);
  console.log('Project ID:', body.projectId);

  try {
    console.log('Creating chat engine...');
    const chatEngine = await createChatEngine(projectId);
    console.log('Chat engine created successfully');

    console.log('Streaming response...');
    // More console logs throughout...
  } catch (error) {
    console.error('Error in multi-step generation:', error);
  }
}
```

#### Example 3: Organization Context
```typescript
// context/organization-context.tsx
useEffect(() => {
  console.log('Organization changed:', currentOrganization);
  console.log('User:', user);
  console.log('Projects:', projects);

  if (!currentOrganization) {
    console.log('No organization selected');
    return;
  }

  console.log('Loading organization data...');
  // More logging...
}, [currentOrganization]);
```

**Problems:**
- Console logs execute even in production
- Can expose sensitive data (API keys, user IDs, internal state)
- No log levels (debug vs error vs info)
- Cannot be disabled or configured
- No structured logging format
- Difficult to search/filter logs

### Implementation Strategy

#### Step 1: Install Logging Library

```bash
npm install pino pino-pretty
# or
npm install winston
```

For this example, we'll use Pino (faster, better for production):

```bash
npm install pino
npm install --save-dev pino-pretty
```

#### Step 2: Create Logging Service

Create `lib/logger.ts`:
```typescript
import pino from 'pino';

// Configure logger based on environment
const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),

  // Development: pretty print
  ...(process.env.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  }),

  // Production: structured JSON
  ...(process.env.NODE_ENV === 'production' && {
    formatters: {
      level: (label) => {
        return { level: label };
      },
    },
  }),
});

// Create child loggers for different modules
export function createLogger(module: string) {
  return logger.child({ module });
}

export default logger;
```

Create browser-safe logger `lib/logger-client.ts`:
```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class ClientLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private minLevel: LogLevel = process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel || 'info';

  private levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  private shouldLog(level: LogLevel): boolean {
    if (!this.isDevelopment && level === 'debug') {
      return false;
    }
    return this.levelPriority[level] >= this.levelPriority[this.minLevel];
  }

  debug(message: string, ...args: any[]) {
    if (this.shouldLog('debug')) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]) {
    if (this.shouldLog('info')) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, error?: Error | unknown, ...args: any[]) {
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${message}`, error, ...args);

      // In production, send to error tracking service
      if (!this.isDevelopment && typeof window !== 'undefined') {
        // TODO: Send to Sentry/Datadog
      }
    }
  }

  // Create scoped logger
  child(scope: string) {
    return {
      debug: (msg: string, ...args: any[]) => this.debug(`[${scope}] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => this.info(`[${scope}] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => this.warn(`[${scope}] ${msg}`, ...args),
      error: (msg: string, error?: any, ...args: any[]) => this.error(`[${scope}] ${msg}`, error, ...args),
    };
  }
}

export const logger = new ClientLogger();
export default logger;
```

#### Step 3: Replace Console Logs

**Before:**
```typescript
// hooks/use-multi-step-response.ts
const generateResponse = async (question: string) => {
  console.log('Starting generateResponse');
  console.log('Question:', question);
  console.log('Project ID:', projectId);

  try {
    console.log('Fetching sources...');
    const result = await fetch('/api/get-sources', {...});
    console.log('Sources:', result);
  } catch (error) {
    console.error('Error generating response:', error);
  }
};
```

**After:**
```typescript
// hooks/use-multi-step-response.ts
import { logger } from '@/lib/logger-client';

const log = logger.child('useMultiStepResponse');

const generateResponse = async (question: string) => {
  log.debug('Starting generateResponse', { question, projectId });

  try {
    log.debug('Fetching sources');
    const result = await fetch('/api/get-sources', {...});
    log.debug('Sources fetched successfully', { count: result.sources.length });
  } catch (error) {
    log.error('Failed to generate response', error, { question, projectId });
  }
};
```

**Server-side example:**
```typescript
// app/api/generate-response-multistep/route.ts
import logger from '@/lib/logger';

const log = logger.child({ module: 'generate-response-multistep' });

export async function POST(request: Request) {
  const body = await request.json();

  log.info('Multi-step response requested', {
    projectId: body.projectId,
    questionLength: body.question.length,
  });

  try {
    log.debug('Creating chat engine', { projectId: body.projectId });
    const chatEngine = await createChatEngine(body.projectId);

    log.info('Response generated successfully', { projectId: body.projectId });
    return response;
  } catch (error) {
    log.error('Failed to generate response', {
      error,
      projectId: body.projectId,
    });
    throw error;
  }
}
```

#### Step 4: Add ESLint Rule to Prevent Console Usage

Update `.eslintrc.json`:
```json
{
  "extends": ["next/core-web-vitals"],
  "rules": {
    "no-console": ["error", {
      "allow": []
    }]
  },
  "overrides": [
    {
      "files": ["scripts/**/*.js", "**/*.config.js"],
      "rules": {
        "no-console": "off"
      }
    }
  ]
}
```

#### Step 5: Add Environment Configuration

Update `.env.example`:
```bash
# Logging
NODE_ENV=development
LOG_LEVEL=debug

# Production
# NODE_ENV=production
# LOG_LEVEL=info
```

### Acceptance Criteria
- [ ] Install pino and pino-pretty (or winston)
- [ ] Create `lib/logger.ts` for server-side logging
- [ ] Create `lib/logger-client.ts` for client-side logging
- [ ] Configure log levels based on NODE_ENV
- [ ] Replace all `console.log` with `logger.debug`
- [ ] Replace all `console.info` with `logger.info`
- [ ] Replace all `console.warn` with `logger.warn`
- [ ] Replace all `console.error` with `logger.error`
- [ ] Add ESLint rule `no-console` with error level
- [ ] Fix all ESLint errors from new rule
- [ ] Configure logger to output JSON in production
- [ ] Configure logger to use pretty print in development
- [ ] Add LOG_LEVEL environment variable
- [ ] Update `.env.example` with logging config
- [ ] Test that debug logs don't appear in production
- [ ] Test that error logs still work in production
- [ ] Document logging patterns in CONTRIBUTING.md

### Files with Console Logs (60+ files)

**High Priority (Most console usage):**
- `hooks/use-multi-step-response.ts` (21 statements)
- `app/api/generate-response-multistep/route.ts` (20+ statements)
- `context/organization-context.tsx` (10+ statements)
- `app/projects/[projectId]/questions/components/questions-provider.tsx` (15+ statements)

**Other Files:**
- `app/api/projects/route.ts`
- `app/api/organizations/route.ts`
- `lib/project-service.ts`
- `lib/organization-service.ts`
- `components/organizations/CreateOrganizationDialog.tsx`
- And 50+ more files...

### Testing
- [ ] In development, verify debug logs appear in console
- [ ] In production build, verify debug logs are suppressed
- [ ] Verify error logs still appear in production
- [ ] Test that logger handles circular references gracefully
- [ ] Test that sensitive data can be redacted from logs
- [ ] Verify ESLint fails on new console.log usage
- [ ] Test child loggers create proper scope prefixes
- [ ] Verify structured logging format in production

### Estimated Effort
4-6 hours
- 1 hour: Set up logging library and create logger service
- 2-3 hours: Replace console statements in high-priority files
- 1 hour: Add ESLint rule and fix violations
- 1 hour: Testing and documentation

### Related Issues
- HIGH-002 (Enforce middleware usage - for API logging)
- MED-015 (Implement proper logging service)
- HIGH-001 (Standardize error response format)
