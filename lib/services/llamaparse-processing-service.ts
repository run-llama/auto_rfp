import { ILlamaParseProcessingService } from '@/lib/interfaces/llamaparse-service';
import { 
  LlamaParseRequest, 
  LlamaParseResponse, 
  LlamaParseOptions 
} from '@/lib/validators/llamaparse';
import { fileValidator } from './file-validator';
import { llamaParseClient } from './llamaparse-client';
import { documentStoreService } from './document-store-service';
import { ValidationError } from '@/lib/errors/api-errors';

/**
 * Main LlamaParse processing service implementation
 */
export class LlamaParseProcessingService implements ILlamaParseProcessingService {
  /**
   * Process file upload and parsing
   */
  async processFile(request: LlamaParseRequest): Promise<LlamaParseResponse> {
    try {
      // Step 1: Validate the file
      await fileValidator.validateFile(request.file);
      console.log(`File validation passed for: ${request.file.name}`);

      // Step 2: Prepare parsing options
      const parseOptions: LlamaParseOptions = {
        fastMode: request.fast_mode || false,
        premiumMode: request.premium_mode || false,
        complexTables: request.preset === 'complexTables',
        agenticMode: request.agentic_mode ?? true,
      };

      // Step 3: Parse the file using LlamaParse
      const parseResult = await llamaParseClient.parseFile(request.file, parseOptions);
      console.log(`File parsing completed for document: ${parseResult.id}`);

      // Step 4: Prepare response with normalized document name
      const documentName = request.documentName || this.extractDocumentName(request.file.name);
      
      const response: LlamaParseResponse = {
        success: true,
        documentId: parseResult.id,
        documentName,
        status: parseResult.status,
        content: parseResult.content,
        metadata: {
          ...parseResult.metadata,
          fileSize: request.file.size,
          originalFileName: request.file.name,
          processedAt: new Date().toISOString(),
          parseOptions,
        },
      };

      // Step 5: Store the processed document
      await documentStoreService.addDocument(response);
      console.log(`Document stored successfully: ${response.documentId}`);

      return response;
    } catch (error) {
      console.error('File processing failed:', error);
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      throw new ValidationError(
        `File processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Extract document name from filename (remove extension)
   */
  private extractDocumentName(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.slice(0, -1).join('.') : filename;
  }

  /**
   * Get processing statistics
   */
  async getProcessingStats(): Promise<{
    totalProcessed: number;
    lastProcessed: Date | null;
    serviceStatus: {
      fileValidator: boolean;
      llamaParseClient: boolean;
      documentStore: boolean;
    };
  }> {
    try {
      const documentStats = await documentStoreService.getStats();
      
      return {
        totalProcessed: documentStats.totalDocuments,
        lastProcessed: documentStats.lastProcessed,
        serviceStatus: {
          fileValidator: true, // Always available
          llamaParseClient: llamaParseClient.isConfigured(),
          documentStore: documentStoreService.isAvailable(),
        },
      };
    } catch (error) {
      console.error('Failed to get processing stats:', error);
      return {
        totalProcessed: 0,
        lastProcessed: null,
        serviceStatus: {
          fileValidator: false,
          llamaParseClient: false,
          documentStore: false,
        },
      };
    }
  }

  /**
   * Validate service dependencies
   */
  validateServiceDependencies(): {
    isReady: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    if (!llamaParseClient.isConfigured()) {
      issues.push('LlamaParse service is not configured');
    }

    if (!documentStoreService.isAvailable()) {
      issues.push('Document store is not available');
    }

    return {
      isReady: issues.length === 0,
      issues,
    };
  }
}

// Export singleton instance
export const llamaParseProcessingService = new LlamaParseProcessingService(); 