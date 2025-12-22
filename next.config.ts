import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Configure environment variables that will be available on both server and client side
    env: {
        // You will need to set LLAMACLOUD_API_KEY in your deployment environment
        // or in a .env.local file that's not committed to version control
        LLAMACLOUD_API_KEY: process.env.LLAMACLOUD_API_KEY,
        // Internal API key for internal users
        LLAMACLOUD_API_KEY_INTERNAL: process.env.LLAMACLOUD_API_KEY_INTERNAL,
        // Internal email domain (defaults to @runllama.ai)
        INTERNAL_EMAIL_DOMAIN: process.env.INTERNAL_EMAIL_DOMAIN,
    },
    // Other Next.js config options
    reactStrictMode: true,
    // Enable standalone output for Docker deployment
    output: 'standalone',
};

export default nextConfig;
