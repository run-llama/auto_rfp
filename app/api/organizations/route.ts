import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { organizationService } from '@/lib/organization-service';
import { llamaCloudConnectionService } from '@/lib/services/llamacloud-connection-service';
import { env, validateEnv, getLlamaCloudApiKey } from '@/lib/env';

export async function GET() {


  try {

    const currentUser = await organizationService.getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    const organizations = await db.organization.findMany({
      where: {
        organizationUsers: {
          some: {
            userId: currentUser.id
          }
        }
      },
      include: {
        organizationUsers: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              }
            }
          }
        },
        projects: {
          select: {
            id: true,
            name: true,
            description: true,
            createdAt: true,
          }
        },
        _count: {
          select: {
            projects: true,
            organizationUsers: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: organizations
    });
  } catch (error) {
    console.error('Failed to fetch organizations:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch organizations',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to fetch available LlamaCloud projects
async function fetchLlamaCloudProjects(userEmail?: string) {
  try {
    if (!validateEnv()) {
      return [];
    }

    // Get the appropriate API key based on user's email
    const apiKey = getLlamaCloudApiKey(userEmail);

    const [projectsResponse, organizationsResponse] = await Promise.all([
      fetch(`${env.LLAMACLOUD_API_URL}/api/v1/projects`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }),
      fetch(`${env.LLAMACLOUD_API_URL}/api/v1/organizations`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })
    ]);

    if (!projectsResponse.ok) {
      console.warn('Failed to fetch LlamaCloud projects:', projectsResponse.status);
      return [];
    }

    const projects = await projectsResponse.json();
    const organizations = organizationsResponse.ok ? await organizationsResponse.json() : [];
    
    // Create a map of organization_id -> organization_name for quick lookup
    const orgMap = new Map();
    if (Array.isArray(organizations)) {
      organizations.forEach((org: any) => {
        orgMap.set(org.id, org.name);
      });
    }
    
    // Enhance projects with organization names
    return (projects || []).map((project: any) => ({
      ...project,
      organization_name: orgMap.get(project.organization_id) || 'Unknown Organization'
    }));
  } catch (error) {
    console.warn('Error fetching LlamaCloud projects for auto-connection:', error);
    return [];
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, slug, description } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: 'Name is required'
        },
        { status: 400 }
      );
    }

    // Get current authenticated user
    const currentUser = await organizationService.getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not authenticated'
        },
        { status: 401 }
      );
    }

    // Use the organization service to create organization and user relationship
    const organization = await organizationService.createOrganization(
      name,
      description || null,
      currentUser.id
    );

    // Attempt automatic LlamaCloud connection if there's exactly one project
    let llamaCloudConnectionResult = null;
    try {
      const availableProjects = await fetchLlamaCloudProjects(currentUser.email);
      
      if (availableProjects.length === 1) {
        const project = availableProjects[0];
        console.log(`Auto-connecting organization ${organization.id} to single LlamaCloud project: ${project.name}`);
        
        llamaCloudConnectionResult = await llamaCloudConnectionService.connectToLlamaCloud({
          organizationId: organization.id,
          projectId: project.id,
          projectName: project.name,
          llamaCloudOrgName: project.organization_name,
        }, currentUser.id);
      } else {
        console.log(`Skipping auto-connection: ${availableProjects.length} LlamaCloud projects available`);
      }
    } catch (error) {
      // Don't fail the organization creation if LlamaCloud connection fails
      console.warn('Auto-connection to LlamaCloud failed:', error);
    }

    // Fetch the complete organization data with relationships for response
    const completeOrganization = await db.organization.findUnique({
      where: { id: organization.id },
      include: {
        organizationUsers: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              }
            }
          }
        },
        projects: true,
        _count: {
          select: {
            projects: true,
            organizationUsers: true,
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: completeOrganization,
      llamaCloudAutoConnected: !!llamaCloudConnectionResult
    });
  } catch (error) {
    console.error('Failed to create organization:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create organization',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 