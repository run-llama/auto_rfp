import { ILlamaCloudClient, LlamaCloudClientConfig } from '@/lib/interfaces/llamacloud-service';
import { 
  LlamaCloudProject, 
  LlamaCloudProjectSchema,
  LlamaCloudPipeline,
  LlamaCloudPipelineSchema,
  LlamaCloudFile,
  LlamaCloudFileSchema
} from '@/lib/validators/llamacloud';
import { ExternalServiceError, LlamaCloudConnectionError } from '@/lib/errors/api-errors';
import { z } from 'zod';
import { env } from '@/lib/env';

/**
 * LlamaCloud API client implementation
 */
export class LlamaCloudClient implements ILlamaCloudClient {
  private config: LlamaCloudClientConfig;

  constructor(config: Partial<LlamaCloudClientConfig> = {}) {
    this.config = {
      baseUrl: `${env.get('LLAMACLOUD_API_URL')!}/api/v1`,
      timeout: 30000,
      retryAttempts: 3,
      ...config,
    };
  }

  /**
   * Verify API key and fetch available projects
   */
  async verifyApiKeyAndFetchProjects(apiKey: string): Promise<LlamaCloudProject[]> {
    try {
      const response = await this.makeRequest('/projects', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new LlamaCloudConnectionError(
          `Invalid API key or unable to connect to LlamaCloud (status: ${response.status})`
        );
      }

      const projects = await response.json();
      
      // Validate the response structure
      const ProjectsArraySchema = z.array(LlamaCloudProjectSchema);
      const validatedProjects = ProjectsArraySchema.parse(projects || []);

      return validatedProjects;
    } catch (error) {
      if (error instanceof LlamaCloudConnectionError) {
        throw error;
      }
      throw new LlamaCloudConnectionError(
        `Failed to verify API key: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check if a specific project is accessible with the API key
   */
  async verifyProjectAccess(apiKey: string, projectId: string): Promise<LlamaCloudProject> {
    try {
      const projects = await this.verifyApiKeyAndFetchProjects(apiKey);
      
      const selectedProject = projects.find(p => p.id === projectId);
      if (!selectedProject) {
        throw new LlamaCloudConnectionError(
          'The specified project is not accessible with this API key'
        );
      }

      return selectedProject;
    } catch (error) {
      if (error instanceof LlamaCloudConnectionError) {
        throw error;
      }
      throw new LlamaCloudConnectionError(
        `Failed to verify project access: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Fetch pipelines for a specific project
   */
  async fetchPipelinesForProject(apiKey: string, projectId: string): Promise<LlamaCloudPipeline[]> {
    try {
      const response = await this.makeRequest('/pipelines', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new LlamaCloudConnectionError(
          `Failed to fetch pipelines (status: ${response.status})`
        );
      }

      const pipelines = await response.json();
      
      // Validate the response structure
      const PipelinesArraySchema = z.array(LlamaCloudPipelineSchema);
      const validatedPipelines = PipelinesArraySchema.parse(pipelines || []);

      console.log("from llamacloud-client 'validatedPipelines'", validatedPipelines)

      console.log("from llamacloud-client 'projectId'", projectId)

      // Filter pipelines to only include those from the specified project
      const filteredPipelines = validatedPipelines.filter(pipeline => 
        pipeline.project_id === projectId
      );

      return filteredPipelines;
    } catch (error) {
      if (error instanceof LlamaCloudConnectionError) {
        throw error;
      }
      throw new LlamaCloudConnectionError(
        `Failed to fetch pipelines: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

    /**
   * Fetch files for a specific pipeline
   */
  async fetchFilesForPipeline(apiKey: string, pipelineId: string): Promise<LlamaCloudFile[]> {
    try {
      const response = await this.makeRequest(`/pipelines/${pipelineId}/files`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn(`Failed to fetch files for pipeline ${pipelineId} (status: ${response.status})`);
        return [];
      }

      const files = await response.json();
      
      // Validate the response structure
      const FilesArraySchema = z.array(LlamaCloudFileSchema);
      const validatedFiles = FilesArraySchema.parse(files || []);

      return validatedFiles;
    } catch (error) {
      // Log error but return empty array to not break the entire operation
      console.error(`Error fetching files for pipeline ${pipelineId}:`, error);
      return [];
    }
  }

  /**
   * Make HTTP request to LlamaCloud API with retry logic
   */
  private async makeRequest(endpoint: string, options: RequestInit): Promise<Response> {
    const url = `${this.config.baseUrl}${endpoint}`;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt === this.config.retryAttempts) {
          break;
        }

        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    throw new ExternalServiceError(
      `LlamaCloud API request failed after ${this.config.retryAttempts} attempts: ${lastError?.message}`,
      'LlamaCloud'
    );
  }
}

// Export singleton instance
export const llamaCloudClient = new LlamaCloudClient(); 