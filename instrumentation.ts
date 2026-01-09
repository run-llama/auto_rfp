import { validateEnv } from './lib/env';

/**
 * Next.js instrumentation hook - runs once at server startup
 * This is the ideal place to validate environment configuration
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('Validating environment configuration at startup...');

    if (!validateEnv()) {
      console.error('Environment validation failed. Server will not start.');
      process.exit(1);
    }

    console.log('Environment validation passed. Server starting...');
  }
}
