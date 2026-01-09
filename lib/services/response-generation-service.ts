import { db } from '@/lib/db';
import { organizationService } from '@/lib/organization-service';
import { LlamaIndexService } from '@/lib/llamaindex-service';
import { getLlamaCloudApiKey } from '@/lib/env';
import { 
  GenerateResponseRequest, 
  GenerateResponseResponse,
  GenerateResponseMetadata 
} from '@/lib/validators/generate-response';
import {
  AuthorizationError,
  ForbiddenError,
  NotFoundError,
  LlamaCloudConnectionError
} from '@/lib/errors/api-errors';

interface ProjectWithOrganization {
  id: string;
  organization: {
    id: string;
    llamaCloudProjectId: string | null;
    llamaCloudProjectName: string | null;
    llamaCloudConnectedAt: Date | null;
  };
  projectIndexes: Array<{
    indexId: string;
    indexName: string;
  }>;
}

export class ResponseGenerationService {
  async generateResponse(request: GenerateResponseRequest): Promise<GenerateResponseResponse> {
    const currentUser = await this.getCurrentUser();
    const project = await this.getProjectWithAuthorization(request.projectId, currentUser.id);
    
    this.validateLlamaCloudConnection(project);
    
    if (this.shouldUseDefaultResponse(request, project)) {
      return this.generateDefaultResponse(request.question);
    }

    const selectedIndexNames = this.getSelectedIndexNames(request, project);
    
    if (selectedIndexNames.length === 0 && !request.useAllIndexes) {
      return this.generateDefaultResponse(request.question, 'No valid indexes found');
    }

    return this.generateLlamaIndexResponse(request, project, selectedIndexNames, currentUser.email);
  }

  private async getCurrentUser() {
    const currentUser = await organizationService.getCurrentUser();
    if (!currentUser) {
      throw new AuthorizationError();
    }
    return currentUser;
  }

  private async getProjectWithAuthorization(projectId: string, userId: string): Promise<ProjectWithOrganization> {
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        organization: {
          select: {
            id: true,
            llamaCloudProjectId: true,
            llamaCloudProjectName: true,
            llamaCloudConnectedAt: true,
          },
        },
        projectIndexes: true,
      },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const isMember = await organizationService.isUserOrganizationMember(
      userId,
      project.organization.id
    );
    
    if (!isMember) {
      throw new ForbiddenError('You do not have access to this project');
    }

    return project;
  }

  private validateLlamaCloudConnection(project: ProjectWithOrganization): void {
    if (!project.organization.llamaCloudProjectId || !project.organization.llamaCloudConnectedAt) {
      throw new LlamaCloudConnectionError('Organization is not connected to LlamaCloud');
    }
  }

  private shouldUseDefaultResponse(request: GenerateResponseRequest, project: ProjectWithOrganization): boolean {
    return !request.useAllIndexes && (!request.selectedIndexIds || request.selectedIndexIds.length === 0);
  }

  private getSelectedIndexNames(request: GenerateResponseRequest, project: ProjectWithOrganization): string[] {
    console.log('DEBUG: getSelectedIndexNames called');
    console.log('DEBUG: request.selectedIndexIds:', request.selectedIndexIds);
    console.log('DEBUG: project.projectIndexes:', project.projectIndexes);
    
    const selectedIndexNames = project.projectIndexes
      .filter(projectIndex => {
        const isSelected = request.selectedIndexIds!.includes(projectIndex.indexId);
        console.log(`DEBUG: Checking ${projectIndex.indexName} (${projectIndex.indexId}): ${isSelected}`);
        return isSelected;
      })
      .map(projectIndex => projectIndex.indexName);
    
    console.log('DEBUG: Final selectedIndexNames:', selectedIndexNames);
    return selectedIndexNames;
  }

  private async generateDefaultResponse(question: string, note?: string): Promise<GenerateResponseResponse> {
    const llamaIndexService = new LlamaIndexService();
    const result = await llamaIndexService.generateDefaultResponse(question);
    
    const metadata: GenerateResponseMetadata = {
      confidence: result.confidence,
      generatedAt: result.generatedAt,
      indexesUsed: [],
      note: note || 'Generated using default responses due to no selected indexes'
    };

    return {
      success: true,
      response: result.response,
      sources: result.sources,
      metadata,
    };
  }

  private async generateLlamaIndexResponse(
    request: GenerateResponseRequest, 
    project: ProjectWithOrganization, 
    selectedIndexNames: string[],
    userEmail: string
  ): Promise<GenerateResponseResponse> {
    const apiKey = getLlamaCloudApiKey(userEmail);
    const llamaIndexService = new LlamaIndexService({
      apiKey: apiKey,
      projectName: project.organization.llamaCloudProjectName || 'Default',
      indexNames: request.useAllIndexes ? undefined : selectedIndexNames,
    });

    const result = await llamaIndexService.generateResponse(request.question, {
      documentIds: request.documentIds,
      selectedIndexIds: request.useAllIndexes ? undefined : request.selectedIndexIds,
      useAllIndexes: request.useAllIndexes
    });

    const metadata: GenerateResponseMetadata = {
      confidence: result.confidence,
      generatedAt: result.generatedAt,
      indexesUsed: selectedIndexNames,
    };

    return {
      success: true,
      response: result.response,
      sources: result.sources,
      metadata,
    };
  }
} 