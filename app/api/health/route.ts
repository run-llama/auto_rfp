import { NextRequest } from "next/server";
import { apiHandler } from "@/lib/middleware/api-handler";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

/**
 * Health check endpoint for Docker and monitoring
 * GET /api/health
 */
export async function GET(request: NextRequest) {
  return apiHandler(async () => {
    // Check database connectivity
    await db.$queryRaw`SELECT 1`;

    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    };
  });
}
