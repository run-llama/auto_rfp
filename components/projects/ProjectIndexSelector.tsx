'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import {
  Database,
  Settings,
  Check,
  AlertCircle,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectIndex {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
}

interface ProjectIndexSelectorProps {
  projectId: string;
  onSaveSuccess?: () => void;
}

export function ProjectIndexSelector({ projectId, onSaveSuccess }: ProjectIndexSelectorProps) {
  const [currentIndexes, setCurrentIndexes] = useState<ProjectIndex[]>([]);
  const [availableIndexes, setAvailableIndexes] = useState<ProjectIndex[]>([]);
  const [selectedIndexId, setSelectedIndexId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [organizationConnected, setOrganizationConnected] = useState(false);
  const [organizationName, setOrganizationName] = useState('');
  const [llamaCloudProjectName, setLlamaCloudProjectName] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
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
      // Take first index if any exist (single select)
      const currentIds = data.currentIndexes?.map((index: ProjectIndex) => index.id) || [];
      setSelectedIndexId(currentIds.length > 0 ? currentIds[0] : null);
      setOrganizationConnected(data.organizationConnected);
      setOrganizationName(data.organizationName || '');
      setLlamaCloudProjectName(data.llamaCloudProjectName || '');
      setIsInitialized(true);

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

  const handleIndexSelect = (indexId: string) => {
    if (isSaving) return;

    // Toggle: if already selected, deselect; otherwise select this one
    setSelectedIndexId(prev => prev === indexId ? null : indexId);
  };

  const hasChanges = useCallback(() => {
    const currentId = currentIndexes.length > 0 ? currentIndexes[0].id : null;
    return selectedIndexId !== currentId;
  }, [currentIndexes, selectedIndexId]);

  const handleSave = useCallback(async () => {
    try {
      setIsSaving(true);

      const response = await fetch(`/api/projects/${projectId}/indexes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          indexIds: selectedIndexId ? [selectedIndexId] : [],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update project indexes');
      }

      const data = await response.json();

      setCurrentIndexes(data.projectIndexes || []);

      // Notify parent that save succeeded
      onSaveSuccess?.();

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
  }, [projectId, selectedIndexId, onSaveSuccess, toast]);

  // Debounced auto-save effect
  useEffect(() => {
    // Don't save on initial load or while loading
    if (!isInitialized || isLoading) return;

    // Only save if there are actual changes
    if (!hasChanges()) return;

    const timer = setTimeout(() => {
      handleSave();
    }, 800);

    return () => clearTimeout(timer);
  }, [selectedIndexId, isInitialized, isLoading, hasChanges, handleSave]);

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
                <Skeleton className="h-4 w-4 rounded-full" />
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
            Project Index
          </CardTitle>
          <CardDescription>
            Select an index for this project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium mb-2">No LlamaCloud Connection</h3>
            <p className="text-muted-foreground mb-4">
              Your organization needs to be connected to LlamaCloud to select an index for this project.
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
            Project Index
          </CardTitle>
          <CardDescription>
            Select an index for this project
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
          Project Index
        </CardTitle>
        <CardDescription>
          Select an index from {organizationName}&apos;s LlamaCloud project &quot;{llamaCloudProjectName}&quot;
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
                const isSelected = selectedIndexId === index.id;

                return (
                  <div
                    key={index.id}
                    onClick={() => handleIndexSelect(index.id)}
                    className={cn(
                      "flex items-start space-x-3 p-3 border rounded-lg transition-colors cursor-pointer",
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "hover:bg-muted/50",
                      isSaving && "opacity-50 pointer-events-none"
                    )}
                  >
                    {/* Radio-style indicator */}
                    <div className={cn(
                      "w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0",
                      isSelected ? "border-blue-500 bg-blue-500" : "border-gray-300"
                    )}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="block font-medium">
                        {index.name}
                      </div>
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
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        <Check className="mr-1 h-3 w-3" />
                        Active
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {selectedIndexId
                  ? `Selected: ${availableIndexes.find(i => i.id === selectedIndexId)?.name}`
                  : "No index selected"}
              </div>
              <div className="flex items-center gap-2">
                {isSaving && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Settings className="h-3 w-3 animate-spin" />
                    Saving...
                  </span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchProjectIndexes}
                  disabled={isSaving}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
