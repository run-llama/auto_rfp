/**
 * Centralized environment variables configuration
 * All environment variable access should go through this module
 */

// Database configuration
export const env = {
  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'warning-env-not-set',
  DIRECT_URL: process.env.DIRECT_URL || 'warning-env-not-set',

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'warning-env-not-set',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'warning-env-not-set',

  // OpenAI
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'warning-env-not-set',

  // LlamaCloud
  LLAMACLOUD_API_KEY: process.env.LLAMACLOUD_API_KEY || 'warning-env-not-set',
  LLAMACLOUD_API_KEY_INTERNAL: process.env.LLAMACLOUD_API_KEY_INTERNAL,
  LLAMACLOUD_API_URL: process.env.LLAMACLOUD_API_URL || 'https://api.cloud.llamaindex.ai/api/v1',
  INTERNAL_EMAIL_DOMAIN: process.env.INTERNAL_EMAIL_DOMAIN || '@runllama.ai',

  // App configuration
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  NODE_ENV: process.env.NODE_ENV || 'development',
} as const;

// Type-safe environment variable access
export type EnvKey = keyof typeof env;

/**
 * Validate required environment variables
 * Returns true if all required vars are set, false otherwise
 */
export function validateEnv(): boolean {
  const requiredVars = [
    { key: 'DATABASE_URL', value: env.DATABASE_URL },
    { key: 'DIRECT_URL', value: env.DIRECT_URL },
    { key: 'NEXT_PUBLIC_SUPABASE_URL', value: env.NEXT_PUBLIC_SUPABASE_URL },
    { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
    { key: 'OPENAI_API_KEY', value: env.OPENAI_API_KEY },
    { key: 'LLAMACLOUD_API_KEY', value: env.LLAMACLOUD_API_KEY },
  ];

  const missingVars = requiredVars.filter(v => !v.value);

  if (missingVars.length > 0) {
    console.error(`
      Missing required environment variables:
      ${missingVars.map(v => `- ${v.key}`).join('\n      ')}

      Please set these in your .env.local file
    `);
    return false;
  }

  return true;
}

/**
 * Get the appropriate LlamaCloud API key based on user email
 * Returns internal key for internal users, regular key otherwise
 */
export function getLlamaCloudApiKey(userEmail?: string | null): string {
  // If user has internal email domain and internal key is configured, use internal key
  if (userEmail?.endsWith(env.INTERNAL_EMAIL_DOMAIN) && env.LLAMACLOUD_API_KEY_INTERNAL) {
    return env.LLAMACLOUD_API_KEY_INTERNAL;
  }

  // Otherwise, use the regular API key
  return env.LLAMACLOUD_API_KEY;
}

/**
 * Check if running in production environment
 */
export function isProduction(): boolean {
  return env.NODE_ENV === 'production';
}

/**
 * Check if running in development environment
 */
export function isDevelopment(): boolean {
  return env.NODE_ENV === 'development';
}

/**
 * Get the base URL for the application
 */
export function getAppUrl(): string {
  return env.NEXT_PUBLIC_APP_URL;
} 
