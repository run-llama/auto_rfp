import { LlamaParseRequest } from '@/lib/validators/llamaparse';
import { ValidationError } from '@/lib/errors/api-errors';

/**
 * Parse FormData into LlamaParseRequest
 */
export function parseFormDataToLlamaParseRequest(formData: FormData): LlamaParseRequest {
  try {
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new ValidationError('No file provided');
    }

    // Parse boolean values
    const fast_mode = formData.get('fast_mode') === 'true';
    const premium_mode = formData.get('premium_mode') === 'true';
    const agentic_mode = formData.get('agentic_mode') !== 'false'; // Default to true

    // Parse preset
    const presetValue = formData.get('preset') as string | null;
    const preset = presetValue === 'complexTables' ? 'complexTables' as const : undefined;

    // Parse document name
    const documentName = formData.get('documentName') as string | null;

    return {
      file,
      fast_mode,
      premium_mode,
      agentic_mode,
      preset,
      documentName: documentName || undefined,
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError(
      `Failed to parse form data: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Extract and validate file from FormData
 */
export function extractFileFromFormData(formData: FormData): File {
  const file = formData.get('file') as File;
  
  if (!file) {
    throw new ValidationError('No file provided');
  }
  
  if (!(file instanceof File)) {
    throw new ValidationError('Invalid file format');
  }
  
  return file;
} 