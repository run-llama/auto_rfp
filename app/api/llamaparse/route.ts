import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/middleware/api-handler';
import { LlamaParseRequestSchema } from '@/lib/validators/llamaparse';
import { llamaParseProcessingService } from '@/lib/services/llamaparse-processing-service';
import { parseFormDataToLlamaParseRequest } from '@/lib/utils/form-data-parser';
import { AuthorizationError } from '@/lib/errors/api-errors';
import { organizationService } from '@/lib/organization-service';

export async function POST(request: NextRequest) {
  return apiHandler(async () => {
    // SECURITY: Verify authentication first
    const currentUser = await organizationService.getCurrentUser();
    if (!currentUser) {
      throw new AuthorizationError('Authentication required');
    }

    // Parse FormData into structured request
    const formData = await request.formData();
    const parsedRequest = parseFormDataToLlamaParseRequest(formData);

    // Validate the parsed request
    const validatedRequest = LlamaParseRequestSchema.parse(parsedRequest);
    
    // Process the file using service layer
    const result = await llamaParseProcessingService.processFile(validatedRequest);

    // Log success
    console.log(`Successfully processed file: ${validatedRequest.file.name} -> Document: ${result.documentId}`);
    
    return result;
  });
} 