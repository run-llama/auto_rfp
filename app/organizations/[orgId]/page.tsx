'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Organization } from '@/types/organization';
import { ProjectGrid } from '@/components/projects/ProjectGrid';
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog';
import { Button } from '@/components/ui/button';
import { PlusCircle, Users } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';

// Main page component with Suspense boundary
interface OrganizationPageProps {
  params: Promise<{ orgId: string }>;
}

export default function OrganizationPage({ params }: OrganizationPageProps) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  // Handle async params
  useEffect(() => {
    const handleParams = async () => {
      const { orgId } = await params;
      setOrganizationId(orgId);
    };
    
    handleParams();
  }, [params]);

  const fetchOrganization = useCallback(async () => {
    if (!organizationId) return;

    try {
      setIsLoading(true);

      // First fetch the organization by slug
      const orgResponse = await fetch(`/api/organizations/${organizationId}`);

      if (!orgResponse.ok) {
        throw new Error('Failed to fetch organization');
      }

      const orgData = await orgResponse.json();

      setOrganization(orgData);
    } catch (error) {
      console.error('Error fetching organization:', error);
      toast({
        title: 'Error',
        description: 'Failed to load organization data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, toast]);

  useEffect(() => {
    if (organizationId) {
      fetchOrganization();
    }
  }, [organizationId, fetchOrganization]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse flex flex-col gap-4 w-full max-w-4xl">
          <div className="h-12 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-64 bg-gray-200 rounded w-full mt-4"></div>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="text-2xl font-bold">Organization not found</h1>
        <p className="text-gray-600 mb-4">The organization you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
        <Link href="/">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-12">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{organization.name}</h1>
          {organization.description && (
            <p className="text-gray-600 mt-1">{organization.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsCreateProjectOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-medium mb-4">Projects</h2>
        {organization.projects && organization.projects.length > 0 ? (
          <ProjectGrid 
            projects={organization.projects} 
            isLoading={false}
            onProjectDeleted={fetchOrganization}
          />
        ) : (
          <div className="border rounded-lg p-8 text-center">
            <h3 className="text-lg font-medium mb-2">No projects yet</h3>
            <p className="text-gray-600 mb-4">Create your first project to get started</p>
            <Button onClick={() => setIsCreateProjectOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          </div>
        )}
      </div>

      {/* Create project dialog */}
      {organization && (
        <CreateProjectDialog
          isOpen={isCreateProjectOpen}
          onOpenChange={setIsCreateProjectOpen}
          organizationId={organization.id}
          onSuccess={(projectId) => {
            // Redirect to the new project page
            router.push(`/projects/${projectId}`);
          }}
        />
      )}
    </div>
  );
} 