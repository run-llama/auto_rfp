"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  organization: Organization;
}

interface OrganizationContextType {
  currentOrganization: Organization | null;
  currentProject: Project | null;
  setCurrentOrganization: (org: Organization | null) => void;
  setCurrentProject: (project: Project | null) => void;
  organizations: Organization[];
  projects: Project[];
  loading: boolean;
  refreshData: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function useOrganization() {
  const context = useContext(OrganizationContext);

  if (context === undefined) {
    throw new Error("useOrganization must be used within an OrganizationProvider");
  }
  return context;
}

interface OrganizationProviderProps {
  children: ReactNode;
}

export function OrganizationProvider({ children }: OrganizationProviderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  
  // Track if user has manually selected an organization to prevent auto-overrides
  const manualSelectionRef = useRef(false);
  // Track the latest organization ID we're fetching projects for
  const fetchingProjectsForOrgRef = useRef<string | null>(null);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch("/api/organizations");

      // Check if response is JSON before parsing
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Expected JSON response but got:", contentType);
        return;
      }

      const data = await response.json();
      if (data.success) {
        setOrganizations(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch organizations:", error);
    }
  };

  const fetchProjects = async (organizationId: string) => {
    try {
      // Track which organization we're fetching for
      fetchingProjectsForOrgRef.current = organizationId;

      const response = await fetch(`/api/projects?organizationId=${organizationId}`);

      // Check if response is JSON before parsing
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Expected JSON response but got:", contentType);
        return;
      }

      const data = await response.json();
      if (data.success) {
        // Only set projects if we're still fetching for the same organization
        if (fetchingProjectsForOrgRef.current === organizationId) {
          setProjects(data.data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  };

  const fetchProjectById = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);

      // Check if response is JSON before parsing
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Expected JSON response but got:", contentType);
        throw new Error(`Expected JSON response but got: ${contentType}`);
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch project: ${response.statusText}`);
      }
      const project = await response.json();
      return project;
    } catch (error) {
      console.error("Failed to fetch project by ID:", error);
    }
    return null;
  };

  const refreshData = async () => {
    setLoading(true);
    await fetchOrganizations();
    if (currentOrganization) {
      await fetchProjects(currentOrganization.id);
    }
    setLoading(false);
  };

  // Custom setter that tracks manual selection
  const handleSetCurrentOrganization = (org: Organization | null) => {
    manualSelectionRef.current = true;
    setCurrentOrganization(org);
    
    // Immediately clear current project when changing organization
    setCurrentProject(null);
    
    // Clear projects array to prevent showing projects from previous org
    setProjects([]);
    
    // Update the ref to track the new organization
    fetchingProjectsForOrgRef.current = org?.id || null;
  };

  // Track the last processed pathname to prevent infinite loops
  const lastProcessedPathRef = useRef<string>("");

  // Initialize from URL (on mount and pathname changes)
  useEffect(() => {
    // Skip if we've already processed this pathname
    if (lastProcessedPathRef.current === pathname) {
      return;
    }

    const initializeFromUrl = async () => {
      lastProcessedPathRef.current = pathname;
      
      // Extract project ID from URL if present
      const projectMatch = pathname.match(/\/projects\/([^\/]+)/);
      if (projectMatch) {
        const projectId = projectMatch[1];
        
        
        // Only fetch if we don't already have this project set
        if (!currentProject || currentProject.id !== projectId) {
          const project = await fetchProjectById(projectId);
          
          if (project) {
            setCurrentProject(project);
            setCurrentOrganization(project.organization);
            await fetchProjects(project.organization.id);
            manualSelectionRef.current = true; // Mark as manually set from URL
            
          } else {
            
          }
        }
      } else {
        // Clear project if we're not on a project page and not on project-related pages
        const isProjectRelatedPage = pathname.includes('/questions') || 
                                    pathname.includes('/upload') || 
                                    pathname.includes('/documents');
        if (currentProject && !isProjectRelatedPage) {
          
          setCurrentProject(null);
        }
      }
      
      if (initialLoad) {
        setInitialLoad(false);
      }
    };

    initializeFromUrl();
  }, [pathname, initialLoad]);

  // Fetch organizations on mount
  useEffect(() => {
    const loadData = async () => {
      await fetchOrganizations();
    };
    loadData();
  }, []);

  // Auto-select first organization only if no manual selection has been made
  useEffect(() => {
    if (!initialLoad && 
        !manualSelectionRef.current && 
        organizations.length > 0) {
      setCurrentOrganization(prevOrg => {
        if (!prevOrg) {
          return organizations[0];
        }
        return prevOrg;
      });
    }
  }, [organizations, initialLoad]); // Removed currentOrganization to prevent infinite loop

  // Fetch projects when organization changes
  useEffect(() => {
    if (currentOrganization && !initialLoad) {
      fetchProjects(currentOrganization.id);
    }
  }, [currentOrganization, initialLoad]);

  // Auto-select first project when projects are loaded (only if no manual selection)
  useEffect(() => {
    if (!initialLoad && 
        projects.length > 0 &&
        !pathname.includes('/projects/')) {
      setCurrentProject(prevProject => {
        // Only set if no project is selected and we have an organization
        if (!prevProject && currentOrganization) {
          return projects[0];
        }
        return prevProject;
      });
    }
  }, [projects, initialLoad, pathname]); // Removed currentProject and currentOrganization to prevent infinite loops

  // Set loading state
  useEffect(() => {
    if (!initialLoad) {
      setLoading(false);
    }
  }, [initialLoad]);

  const value: OrganizationContextType = {
    currentOrganization,
    currentProject,
    setCurrentOrganization: handleSetCurrentOrganization,
    setCurrentProject,
    organizations,
    projects,
    loading,
    refreshData,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
} 