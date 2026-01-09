import { ILlamaCloudDocumentsService } from '@/lib/interfaces/llamacloud-service';
import { 
  LlamaCloudDocumentsRequest, 
  LlamaCloudDocumentsResponse, 
  LlamaCloudFile 
} from '@/lib/validators/llamacloud';
import { llamaCloudClient } from './llamacloud-client';
import { organizationAuth } from './organization-auth';
import { db } from '@/lib/db';
import { DatabaseError, LlamaCloudConnectionError, NotFoundError } from '@/lib/errors/api-errors';
import { env, getLlamaCloudApiKey } from '@/lib/env';

/**
 * LlamaCloud documents management service
 */
export class LlamaCloudDocumentsService implements ILlamaCloudDocumentsService {
  /**
   * Get documents and pipelines for an organization
   */
  async getDocuments(request: LlamaCloudDocumentsRequest, userId: string): Promise<LlamaCloudDocumentsResponse> {
    try {
      // Step 1: Verify user has organization access
      await organizationAuth.requireMembership(userId, request.organizationId);

      // Step 2: Get user's email to determine which API key to use
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { email: true }
      });
      const apiKey = getLlamaCloudApiKey(user?.email);

      // Step 3: Get connected organization
      const organization = await this.getConnectedOrganization(request.organizationId);

      // Step 4: Fetch pipelines for the project
      const pipelines = await llamaCloudClient.fetchPipelinesForProject(
        apiKey,
        organization.llamaCloudProjectId!
      );

      // Step 5: Collect all documents from all pipelines
      const allDocuments: LlamaCloudFile[] = [];
      const documentFetchPromises = pipelines.map(async (pipeline) => {
        try {
          const documents = await llamaCloudClient.fetchFilesForPipeline(
            apiKey,
            pipeline.id
          );
          return documents.map((doc: any) => ({
            ...doc,
            pipelineName: pipeline.name,
            pipelineId: pipeline.id,
          }));
        } catch (error) {
          console.error(`Failed to fetch documents for pipeline ${pipeline.name}:`, error);
          return [];
        }
      });

      const documentArrays = await Promise.all(documentFetchPromises);
      documentArrays.forEach((docs: any) => allDocuments.push(...docs));

      // Step 6: Return response
      const response: LlamaCloudDocumentsResponse = {
        projectName: organization.llamaCloudProjectName,
        projectId: organization.llamaCloudProjectId,
        pipelines,
        documents: allDocuments,
        connectedAt: organization.llamaCloudConnectedAt,
      };

      return response;
    } catch (error) {
      if (error instanceof LlamaCloudConnectionError || error instanceof DatabaseError || error instanceof NotFoundError) {
        throw error;
      }
      throw new LlamaCloudConnectionError(
        `Failed to fetch documents: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get organization and verify LlamaCloud connection
   */
  private async getConnectedOrganization(organizationId: string) {
    try {
      const organization = await db.organization.findUnique({
        where: { id: organizationId },
        select: {
          id: true,
          name: true,
          llamaCloudProjectId: true,
          llamaCloudProjectName: true,
          llamaCloudConnectedAt: true,
        },
      });

      if (!organization) {
        throw new NotFoundError('Organization not found');
      }

      if (!organization.llamaCloudProjectId || !organization.llamaCloudConnectedAt) {
        throw new LlamaCloudConnectionError('Organization is not connected to LlamaCloud');
      }

      return organization;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof LlamaCloudConnectionError) {
        throw error;
      }
      throw new DatabaseError(
        `Failed to get organization: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Fetch documents for all pipelines
   */
  async fetchDocumentsForAllPipelines(organizationId: string): Promise<LlamaCloudFile[]> {
    try {
      const organization = await this.getConnectedOrganization(organizationId);

      // Get all pipelines for the project
      const pipelines = await llamaCloudClient.fetchPipelinesForProject(
        env.get('LLAMACLOUD_API_KEY')!,
        organization.llamaCloudProjectId!
      );

      // Fetch documents for each pipeline
      const allDocuments: LlamaCloudFile[] = [];
      for (const pipeline of pipelines) {
        try {
          const documents = await llamaCloudClient.fetchFilesForPipeline(
            env.get('LLAMACLOUD_API_KEY')!,
            pipeline.id
          );
          
          // Add pipeline information to each document
          const documentsWithPipeline = documents.map((doc: any) => ({
            ...doc,
            pipelineName: pipeline.name,
            pipelineId: pipeline.id,
          }));
          
          allDocuments.push(...documentsWithPipeline);
        } catch (error) {
          console.error(`Failed to fetch documents for pipeline ${pipeline.name}:`, error);
          // Continue with other pipelines if one fails
        }
      }

      return allDocuments;
    } catch (error) {
      if (error instanceof LlamaCloudConnectionError || error instanceof DatabaseError || error instanceof NotFoundError) {
        throw error;
      }
      throw new LlamaCloudConnectionError(
        `Failed to fetch documents for all pipelines: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

// Export singleton instance
export const llamaCloudDocumentsService = new LlamaCloudDocumentsService(); 