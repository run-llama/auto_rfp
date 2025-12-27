// Environment variables configuration
export const env = {
  LLAMACLOUD_API_KEY: process.env.LLAMACLOUD_API_KEY || '',
  LLAMACLOUD_API_KEY_INTERNAL: process.env.LLAMACLOUD_API_KEY_INTERNAL || '',
  LLAMACLOUD_API_URL: process.env.LLAMACLOUD_API_URL || 'https://api.cloud.llamaindex.ai',
  INTERNAL_EMAIL_DOMAIN: process.env.INTERNAL_EMAIL_DOMAIN || '@runllama.ai',
};

// Function to validate required environment variables
export function validateEnv() {
  const requiredVars = [
    { key: 'LLAMACLOUD_API_KEY', value: env.LLAMACLOUD_API_KEY }
  ];

  const missingVars = requiredVars.filter(v => !v.value);
  
  if (missingVars.length > 0) {
    console.error(`
      Missing required environment variables:
      ${missingVars.map(v => `- ${v.key}`).join('\n      ')}
      
      Please set these in your .env file
    `);
    return false;
  }
  
  return true;
}

// Helper function to get the appropriate LlamaCloud API key based on user email
export function getLlamaCloudApiKey(userEmail?: string | null): string {
  // If user has internal email domain and internal key is configured, use internal key
  if (userEmail?.endsWith(env.INTERNAL_EMAIL_DOMAIN) && env.LLAMACLOUD_API_KEY_INTERNAL) {
    return env.LLAMACLOUD_API_KEY_INTERNAL;
  }
  
  // Otherwise, use the regular API key
  return env.LLAMACLOUD_API_KEY;
} 