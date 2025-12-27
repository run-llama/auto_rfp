import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { organizationService } from '@/lib/organization-service';
import { env, getLlamaCloudApiKey } from '@/lib/env';

// GET /api/projects/[projectId]/indexes - Get project indexes and available indexes
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const currentUser = await organizationService.getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get project with organization info and project indexes
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            llamaCloudProjectId: true,
            llamaCloudProjectName: true,
            llamaCloudConnectedAt: true,
          },
        },
        projectIndexes: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this organization
    const isMember = await organizationService.isUserOrganizationMember(
      currentUser.id,
      project.organization.id
    );
    
    if (!isMember) {
      return NextResponse.json(
        { error: 'You do not have access to this project' },
        { status: 403 }
      );
    }

    // If organization is not connected to LlamaCloud, return empty data
    if (!project.organization.llamaCloudProjectId || !project.organization.llamaCloudConnectedAt) {
      return NextResponse.json({
        project: {
          id: project.id,
          name: project.name,
        },
        currentIndexes: [],
        availableIndexes: [],
        organizationConnected: false,
      });
    }

    // Fetch available indexes from LlamaCloud
    try {
      // Get the appropriate API key based on user's email
      const apiKey = getLlamaCloudApiKey(currentUser.email);
      
      const pipelinesResponse = await fetch(`${env.LLAMACLOUD_API_URL}/api/v1/pipelines`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!pipelinesResponse.ok) {
        const errorText = await pipelinesResponse.text();
        console.error('Failed to fetch indexes from LlamaCloud:', errorText);
        return NextResponse.json(
          { error: 'Failed to fetch indexes from LlamaCloud' },
          { status: 400 }
        );
      }

      const pipelines = await pipelinesResponse.json();
      
      // Filter pipelines to only include those from the connected LlamaCloud project
      const filteredPipelines = pipelines.filter((pipeline: any) => 
        pipeline.project_id === project.organization.llamaCloudProjectId
      );
      
      
      // Map pipelines to indexes for user-friendly terminology
      const availableIndexes = filteredPipelines.map((pipeline: any) => ({
        id: pipeline.id,
        name: pipeline.name,
        description: pipeline.description,
        created_at: pipeline.created_at,
      }));

      // Get current project indexes and filter out any that no longer exist in LlamaCloud
      const availableIndexIds = new Set(availableIndexes.map((index: { id: string }) => index.id));
      const currentIndexes = project.projectIndexes
        .filter(projectIndex => availableIndexIds.has(projectIndex.indexId))
        .map(projectIndex => ({
        id: projectIndex.indexId,
        name: projectIndex.indexName,
      }));

      // If we found stale indexes, clean them up in the database
      const staleIndexes = project.projectIndexes.filter(
        projectIndex => !availableIndexIds.has(projectIndex.indexId)
      );
      
      if (staleIndexes.length > 0) {
        await db.projectIndex.deleteMany({
          where: {
            projectId,
            indexId: {
              in: staleIndexes.map(projectIndex => projectIndex.indexId)
            }
          }
        });
      }

      return NextResponse.json({
        project: {
          id: project.id,
          name: project.name,
        },
        currentIndexes,
        availableIndexes,
        organizationConnected: true,
        organizationName: project.organization.name,
        llamaCloudProjectName: project.organization.llamaCloudProjectName,
      });

    } catch (error) {
      console.error('Error fetching indexes from LlamaCloud:', error);
      return NextResponse.json(
        { error: 'Failed to fetch indexes from LlamaCloud' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in project indexes API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/projects/[projectId]/indexes - Update project indexes
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { indexIds } = await request.json();
    const currentUser = await organizationService.getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!Array.isArray(indexIds)) {
      return NextResponse.json(
        { error: 'indexIds must be an array' },
        { status: 400 }
      );
    }

    // Get project with organization info
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        organization: {
          select: {
            id: true,
            llamaCloudProjectId: true,
            llamaCloudConnectedAt: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this organization
    const isMember = await organizationService.isUserOrganizationMember(
      currentUser.id,
      project.organization.id
    );
    
    if (!isMember) {
      return NextResponse.json(
        { error: 'You do not have access to this project' },
        { status: 403 }
      );
    }

    // Check if organization is connected to LlamaCloud
    if (!project.organization.llamaCloudProjectId || !project.organization.llamaCloudConnectedAt) {
      return NextResponse.json(
        { error: 'Organization is not connected to LlamaCloud' },
        { status: 400 }
      );
    }

    // If indexIds is empty, remove all project indexes
    if (indexIds.length === 0) {
      await db.projectIndex.deleteMany({
        where: { projectId },
      });

      return NextResponse.json({
        success: true,
        message: 'All indexes removed from project',
        projectIndexes: [],
      });
    }

    // Fetch index names from LlamaCloud to validate and get names
    try {
      // Get the appropriate API key based on user's email
      const apiKey = getLlamaCloudApiKey(currentUser.email);

      const pipelinesResponse = await fetch(`${env.LLAMACLOUD_API_URL}/api/v1/pipelines`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!pipelinesResponse.ok) {
        const errorText = await pipelinesResponse.text();
        console.error('Failed to fetch indexes from LlamaCloud:', errorText);
        return NextResponse.json(
          { error: 'Failed to validate indexes with LlamaCloud' },
          { status: 400 }
        );
      }

      const pipelines = await pipelinesResponse.json();

      // Filter pipelines to only include those from the connected LlamaCloud project
      const filteredPipelines = pipelines.filter((pipeline: any) =>
        pipeline.project_id === project.organization.llamaCloudProjectId
      );
      
      const pipelineMap = new Map<string, string>(filteredPipelines.map((p: any) => [p.id, p.name]));

      // Validate that all provided indexIds exist in the connected project
      const invalidIds = indexIds.filter((id: string) => !pipelineMap.has(id));
      if (invalidIds.length > 0) {
        return NextResponse.json(
          { error: `Invalid index IDs or indexes not from connected LlamaCloud project: ${invalidIds.join(', ')}` },
          { status: 400 }
        );
      }
      

      // Remove existing project indexes
      await db.projectIndex.deleteMany({
        where: { projectId },
      });

      // Add new project indexes
      const projectIndexes = await Promise.all(
        indexIds.map(async (indexId: string) => {
          const indexName = pipelineMap.get(indexId);
          return db.projectIndex.create({
            data: {
              projectId,
              indexId,
              indexName: indexName || 'Unknown',
            },
          });
        })
      );

      return NextResponse.json({
        success: true,
        message: 'Project indexes updated successfully',
        projectIndexes: projectIndexes.map(pi => ({
          id: pi.indexId,
          name: pi.indexName,
        })),
      });

    } catch (error) {
      console.error('Error updating project indexes:', error);
      return NextResponse.json(
        { error: 'Failed to update project indexes' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in project indexes update API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 