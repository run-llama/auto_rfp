'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { 
  FileText, 
  Calendar, 
  FolderOpen, 
  ExternalLink, 
  RefreshCw,
  AlertCircle,
  Settings,
  Unplug,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface LlamaCloudDocument {
  id: string;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
  size_bytes?: number;
  pipelineName: string;
  pipelineId: string;
}

interface LlamaCloudPipeline {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

interface LlamaCloudDocumentsProps {
  organizationId: string;
  onDisconnect?: () => void;
}

const INITIAL_DOCUMENTS_SHOWN = 10;

export function LlamaCloudDocuments({ organizationId, onDisconnect }: LlamaCloudDocumentsProps) {
  const [documents, setDocuments] = useState<LlamaCloudDocument[]>([]);
  const [pipelines, setPipelines] = useState<LlamaCloudPipeline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectedAt, setConnectedAt] = useState<string | null>(null);
  const [expandedPipelines, setExpandedPipelines] = useState<Record<string, boolean>>({});
  const [shownDocuments, setShownDocuments] = useState<Record<string, number>>({});
  const { toast } = useToast();

  const fetchDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/llamacloud/documents?organizationId=${organizationId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch documents');
      }

      const data = await response.json();
      setDocuments(data.documents || []);
      setPipelines(data.pipelines || []);
      setConnectedAt(data.connectedAt);

      // Auto-expand first pipeline and initialize shown documents
      if (data.documents && data.documents.length > 0) {
        const pipelineNames: string[] = Array.from(new Set(data.documents.map((doc: LlamaCloudDocument) => doc.pipelineName)));
        const initialExpanded: Record<string, boolean> = {};
        const initialShown: Record<string, number> = {};

        pipelineNames.forEach((pipelineName, index) => {
          initialExpanded[pipelineName] = index === 0; // Expand first pipeline
          initialShown[pipelineName] = INITIAL_DOCUMENTS_SHOWN;
        });

        setExpandedPipelines(initialExpanded);
        setShownDocuments(initialShown);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch documents';
      setError(errorMessage);
      console.error('Error fetching LlamaCloud documents:', err);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleRefresh = () => {
    fetchDocuments();
    toast({
      title: 'Refreshing',
      description: 'Fetching latest documents from LlamaCloud...',
    });
  };

  const handleDisconnect = async () => {
    try {
      const response = await fetch('/api/llamacloud/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
        }),
      });
      
      if (response.ok) {
        toast({
          title: 'Disconnected',
          description: 'Successfully disconnected from LlamaCloud',
        });
        
        if (onDisconnect) {
          onDisconnect();
        }
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to disconnect from LlamaCloud');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to disconnect from LlamaCloud',
        variant: 'destructive',
      });
    }
  };

  const togglePipeline = (pipelineName: string) => {
    setExpandedPipelines(prev => ({
      ...prev,
      [pipelineName]: !prev[pipelineName]
    }));
  };

  const showMoreDocuments = (pipelineName: string) => {
    setShownDocuments(prev => ({
      ...prev,
      [pipelineName]: (prev[pipelineName] || INITIAL_DOCUMENTS_SHOWN) + INITIAL_DOCUMENTS_SHOWN
    }));
  };

  const showAllDocuments = (pipelineName: string, totalCount: number) => {
    setShownDocuments(prev => ({
      ...prev,
      [pipelineName]: totalCount
    }));
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${Math.round(size * 100) / 100} ${units[unitIndex]}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'processing':
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'error':
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-9 w-24" />
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <div>
              <h3 className="font-semibold text-red-900">Error Loading Documents</h3>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchDocuments}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group documents by pipeline
  const documentsByPipeline = documents.reduce((acc, doc) => {
    if (!acc[doc.pipelineName]) {
      acc[doc.pipelineName] = [];
    }
    acc[doc.pipelineName].push(doc);
    return acc;
  }, {} as Record<string, LlamaCloudDocument[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">LlamaCloud Documents</h3>
          {connectedAt && (
            <p className="text-sm text-muted-foreground">
              Connected on {formatDate(connectedAt)} • {documents.length} total documents
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleDisconnect}>
                <Unplug className="mr-2 h-4 w-4" />
                Disconnect
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <FolderOpen className="mx-auto h-8 w-8 mb-2" />
              <p>No documents found in your LlamaCloud pipelines.</p>
              <p className="text-sm mt-1">Upload documents to your LlamaCloud pipelines to see them here.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(documentsByPipeline).map(([pipelineName, pipelineDocs]) => {
            const isExpanded = expandedPipelines[pipelineName] || false;
            const shownCount = shownDocuments[pipelineName] || INITIAL_DOCUMENTS_SHOWN;
            const hasMore = pipelineDocs.length > shownCount;
            const visibleDocs = pipelineDocs.slice(0, shownCount);
            
            return (
              <Card key={pipelineName}>
                <Collapsible open={isExpanded} onOpenChange={() => togglePipeline(pipelineName)}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
                      <CardTitle className="text-base flex items-center">
                        {isExpanded ? (
                          <ChevronDown className="mr-2 h-4 w-4" />
                        ) : (
                          <ChevronRight className="mr-2 h-4 w-4" />
                        )}
                        <FolderOpen className="mr-2 h-4 w-4" />
                        {pipelineName}
                        <Badge variant="secondary" className="ml-2">
                          {pipelineDocs.length} {pipelineDocs.length === 1 ? 'document' : 'documents'}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {visibleDocs.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center space-x-3">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <div className="min-w-0 flex-1">
                                <p className="font-medium truncate">{doc.name}</p>
                                <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                                  <span className="flex items-center">
                                    <Calendar className="mr-1 h-3 w-3" />
                                    {formatDate(doc.updated_at)}
                                  </span>
                                  
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={getStatusColor(doc.status)}>
                                {doc.status}
                              </Badge>
                              <Button variant="ghost" size="sm" asChild>
                                <a
                                  href={`https://cloud.llamaindex.ai/project/${doc.pipelineId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </Button>
                            </div>
                          </div>
                        ))}
                        
                        {hasMore && (
                          <div className="flex justify-center space-x-2 pt-4 border-t">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => showMoreDocuments(pipelineName)}
                            >
                              Show {Math.min(INITIAL_DOCUMENTS_SHOWN, pipelineDocs.length - shownCount)} more
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => showAllDocuments(pipelineName, pipelineDocs.length)}
                            >
                              Show all ({pipelineDocs.length})
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
} 