'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { 
  Database, 
  Settings, 
  Check, 
  AlertCircle,
  RefreshCw,
  ExternalLink,
  FolderOpen,
  Edit3,
  X
} from 'lucide-react';

interface ProjectIndex {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
}

interface ProjectIndexSelectorProps {
  projectId: string;
}

export function ProjectIndexSelector({ projectId }: ProjectIndexSelectorProps) {
  const [currentIndexes, setCurrentIndexes] = useState<ProjectIndex[]>([]);
  const [availableIndexes, setAvailableIndexes] = useState<ProjectIndex[]>([]);
  const [selectedIndexIds, setSelectedIndexIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [organizationConnected, setOrganizationConnected] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [llamaCloudProjectName, setLlamaCloudProjectName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const fetchProjectIndexes = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/projects/${projectId}/indexes`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch project indexes');
      }

      const data = await response.json();

      setCurrentIndexes(data.currentIndexes || []);
      setAvailableIndexes(data.availableIndexes || []);
      setSelectedIndexIds(data.currentIndexes?.map((index: ProjectIndex) => index.id) || []);
      setOrganizationConnected(data.organizationConnected);
      setProjectName(data.project?.name || '');
      setOrganizationName(data.organizationName || '');
      setLlamaCloudProjectName(data.llamaCloudProjectName || '');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch project indexes';
      setError(errorMessage);
      console.error('Error fetching project indexes:', err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjectIndexes();
  }, [fetchProjectIndexes]);

  const handleIndexToggle = (indexId: string, checked: boolean) => {
    if (!isEditing) return; // Only allow changes in edit mode
    
    if (checked) {
      setSelectedIndexIds(prev => [...prev, indexId]);
    } else {
      setSelectedIndexIds(prev => prev.filter(id => id !== indexId));
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    // Reset to current indexes
    setSelectedIndexIds(currentIndexes.map(index => index.id));
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      const response = await fetch(`/api/projects/${projectId}/indexes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          indexIds: selectedIndexIds,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update project indexes');
      }
      
      const data = await response.json();
      
      setCurrentIndexes(data.projectIndexes || []);
      setIsEditing(false); // Exit edit mode after successful save
      
      toast({
        title: 'Success',
        description: data.message || 'Project indexes updated successfully',
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update project indexes';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = () => {
    const currentIds = new Set(currentIndexes.map(index => index.id));
    const selectedIds = new Set(selectedIndexIds);
    
    if (currentIds.size !== selectedIds.size) return true;
    
    for (const id of currentIds) {
      if (!selectedIds.has(id)) return true;
    }
    
    return false;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <Skeleton className="h-5 w-32" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-64" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-48" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!organizationConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Project Indexes
          </CardTitle>
          <CardDescription>
            Select which indexes this project can access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium mb-2">No LlamaCloud Connection</h3>
            <p className="text-muted-foreground mb-4">
              Your organization needs to be connected to LlamaCloud to select indexes for this project.
            </p>
            <p className="text-sm text-muted-foreground">
              Ask your organization admin to connect to LlamaCloud in the organization settings.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Project Indexes
          </CardTitle>
          <CardDescription>
            Select which indexes this project can access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-3" />
            <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Indexes</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button variant="outline" onClick={fetchProjectIndexes}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Project Indexes
        </CardTitle>
        <CardDescription>
          Select which indexes from {organizationName}&apos;s LlamaCloud project &quot;{llamaCloudProjectName}&quot; this project can access
          {isEditing && (
            <span className="inline-flex items-center gap-1 ml-2 text-blue-600 font-medium">
              <Edit3 className="h-3 w-3" />
              Editing
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {availableIndexes.length === 0 ? (
          <div className="text-center py-6">
            <FolderOpen className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium mb-2">No Indexes Available</h3>
            <p className="text-muted-foreground">
              No indexes were found in your organization&apos;s LlamaCloud project.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {availableIndexes.map((index) => {
                const isSelected = selectedIndexIds.includes(index.id);
                
                return (
                  <div
                    key={index.id}
                    className={`flex items-start space-x-3 p-3 border rounded-lg transition-colors ${
                      isEditing 
                        ? 'hover:bg-muted/50 border-blue-200' 
                        : 'hover:bg-muted/20'
                    }`}
                  >
                    <Checkbox
                      id={`index-${index.id}`}
                      checked={isSelected}
                      disabled={!isEditing}
                      onCheckedChange={(checked) => handleIndexToggle(index.id, checked as boolean)}
                    />
                    <div className="flex-1 min-w-0">
                      <label
                        htmlFor={`index-${index.id}`}
                        className={`block font-medium ${isEditing ? 'cursor-pointer' : 'cursor-default'}`}
                      >
                        {index.name}
                      </label>
                      {index.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {index.description}
                        </p>
                      )}
                      {index.created_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Created {new Date(index.created_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <Check className="mr-1 h-3 w-3" />
                        Selected
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {selectedIndexIds.length} of {availableIndexes.length} indexes selected
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchProjectIndexes}
                  disabled={isSaving || isEditing}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
                
                {!isEditing ? (
                  <Button
                    onClick={handleEdit}
                    size="sm"
                    variant="outline"
                  >
                    <Edit3 className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handleCancel}
                      size="sm"
                      variant="outline"
                      disabled={isSaving}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={!hasChanges() || isSaving}
                      size="sm"
                    >
                      {isSaving ? (
                        <>
                          <Settings className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 