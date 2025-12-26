'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  FolderOpen, 
  ExternalLink, 
  RefreshCw,
  AlertCircle,
  Database,
  ChevronDown,
  ChevronRight,
  Search,
  CheckCircle2,
  CircleDashed
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface ProjectDocument {
  id: string;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
  size_bytes?: number;
  indexName: string;
  indexId: string;
  file_type?: string;
}

interface ProjectIndex {
  id: string;
  name: string;
}

interface ProjectDocumentsProps {
  projectId: string;
}

// Styling functions from the global DocumentList
const getDocumentCardStyles = (fileType: string): {
  iconBgClass: string;
  iconColorClass: string;
  textPillBgClass: string;
  textPillTextColorClass: string;
} => {
  const type = (fileType || '').toLowerCase();
  if (type === 'pdf') {
    return {
      iconBgClass: 'bg-red-50',
      iconColorClass: 'text-red-600',
      textPillBgClass: 'bg-red-500',
      textPillTextColorClass: 'text-white',
    };
  }
  if (type === 'docx' || type === 'doc') {
    return {
      iconBgClass: 'bg-blue-50',
      iconColorClass: 'text-blue-600',
      textPillBgClass: 'bg-blue-500',
      textPillTextColorClass: 'text-white',
    };
  }
  if (type === 'csv') {
    return {
      iconBgClass: 'bg-green-50',
      iconColorClass: 'text-green-600',
      textPillBgClass: 'bg-green-500',
      textPillTextColorClass: 'text-white',
    };
  }
  if (type === 'txt' || type === 'text') {
    return {
      iconBgClass: 'bg-gray-50',
      iconColorClass: 'text-gray-600',
      textPillBgClass: 'bg-gray-500',
      textPillTextColorClass: 'text-white',
    };
  }
  return { // Fallback default
    iconBgClass: 'bg-gray-100',
    iconColorClass: 'text-gray-600',
    textPillBgClass: 'bg-gray-500',
    textPillTextColorClass: 'text-white',
  };
};

const getPillText = (fileType: string): string => {
  const type = (fileType || '').toLowerCase();
  if (type === 'pdf') return 'PDF';
  if (type === 'docx') return 'DOCX';
  if (type === 'doc') return 'DOC';
  if (type === 'csv') return 'CSV';
  if (type === 'txt' || type === 'text') return 'TXT';
  if (type.length > 0) return type.substring(0, 3).toUpperCase();
  return 'FILE';
};

const INITIAL_DOCUMENTS_SHOWN = 12;

export function ProjectDocuments({ projectId }: ProjectDocumentsProps) {
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [projectIndexes, setProjectIndexes] = useState<ProjectIndex[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organizationConnected, setOrganizationConnected] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [expandedIndexes, setExpandedIndexes] = useState<Record<string, boolean>>({});
  const [shownDocuments, setShownDocuments] = useState<Record<string, number>>({});
  const { toast } = useToast();

  // Helper function to determine file type from filename
  const getFileTypeFromFilename = (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    const fileTypeMap: Record<string, string> = {
      'pdf': 'pdf',
      'doc': 'doc',
      'docx': 'docx',
      'csv': 'csv',
      'txt': 'text',
      'json': 'json'
    };
    return fileTypeMap[extension] || 'other';
  };

  const fetchProjectDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // First get the project indexes
      const indexesResponse = await fetch(`/api/projects/${projectId}/indexes`);

      if (!indexesResponse.ok) {
        const errorData = await indexesResponse.json();
        throw new Error(errorData.error || 'Failed to fetch project indexes');
      }

      const indexesData = await indexesResponse.json();

      if (!indexesData.organizationConnected) {
        setOrganizationConnected(false);
        setProjectIndexes([]);
        setDocuments([]);
        return;
      }

      setOrganizationConnected(true);
      setProjectIndexes(indexesData.currentIndexes || []);

      // If no indexes are selected, show empty state
      if (!indexesData.currentIndexes || indexesData.currentIndexes.length === 0) {
        setDocuments([]);
        return;
      }

      // Get organization ID from project
      const projectResponse = await fetch(`/api/projects/${projectId}`);
      if (!projectResponse.ok) {
        throw new Error('Failed to fetch project details');
      }
      const projectData = await projectResponse.json();

      // Fetch all organization documents
      const documentsResponse = await fetch(`/api/llamacloud/documents?organizationId=${projectData.organizationId}`);

      if (!documentsResponse.ok) {
        const errorData = await documentsResponse.json();
        throw new Error(errorData.error || 'Failed to fetch documents');
      }

      const documentsData = await documentsResponse.json();

      // Filter documents to only include those from selected indexes
      const selectedIndexIds = new Set(indexesData.currentIndexes.map((index: ProjectIndex) => index.id));
      const filteredDocuments = (documentsData.documents || []).filter((doc: any) =>
        selectedIndexIds.has(doc.pipelineId)
      ).map((doc: any) => ({
        ...doc,
        indexName: doc.pipelineName,
        indexId: doc.pipelineId,
        // Map file properties to document properties for consistency
        name: doc.name || 'Unknown',
        status: doc.status || 'unknown',
        created_at: doc.created_at,
        updated_at: doc.updated_at,
        size_bytes: doc.file_size,
        file_type: doc.file_type || getFileTypeFromFilename(doc.name || ''),
      }));

      setDocuments(filteredDocuments);

      // Auto-expand first index and initialize shown documents
      if (filteredDocuments.length > 0) {
        const indexNames: string[] = Array.from(new Set(filteredDocuments.map((doc: ProjectDocument) => doc.indexName)));
        const initialExpanded: Record<string, boolean> = {};
        const initialShown: Record<string, number> = {};

        indexNames.forEach((indexName, index) => {
          initialExpanded[indexName] = index === 0; // Expand first index
          initialShown[indexName] = INITIAL_DOCUMENTS_SHOWN;
        });

        setExpandedIndexes(initialExpanded);
        setShownDocuments(initialShown);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch project documents';
      setError(errorMessage);
      console.error('Error fetching project documents:', err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjectDocuments();
  }, [fetchProjectDocuments]);

  const handleRefresh = () => {
    fetchProjectDocuments();
    toast({
      title: 'Refreshing',
      description: 'Fetching latest documents...',
    });
  };

  const toggleIndex = (indexName: string) => {
    setExpandedIndexes(prev => ({
      ...prev,
      [indexName]: !prev[indexName]
    }));
  };

  const showMoreDocuments = (indexName: string) => {
    setShownDocuments(prev => ({
      ...prev,
      [indexName]: (prev[indexName] || INITIAL_DOCUMENTS_SHOWN) + INITIAL_DOCUMENTS_SHOWN
    }));
  };

  const showAllDocuments = (indexName: string, totalCount: number) => {
    setShownDocuments(prev => ({
      ...prev,
      [indexName]: totalCount
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

  // Filter documents based on search term and active tab
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.indexName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || doc.file_type === activeTab;
    return matchesSearch && matchesTab;
  });

  // Extract unique file types for tab filters
  const fileTypes = Array.from(new Set(documents.map(doc => doc.file_type).filter(Boolean))) as string[];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <Skeleton className="h-5 w-32" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-64" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
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
            <FileText className="h-5 w-5" />
            Project Documents
          </CardTitle>
          <CardDescription>
            Documents available to this project from selected indexes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium mb-2">No LlamaCloud Connection</h3>
            <p className="text-muted-foreground">
              Your organization needs to be connected to LlamaCloud to access documents.
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
            <FileText className="h-5 w-5" />
            Project Documents
          </CardTitle>
          <CardDescription>
            Documents available to this project from selected indexes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-3" />
            <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Documents</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button variant="outline" onClick={fetchProjectDocuments}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (projectIndexes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Project Documents
          </CardTitle>
          <CardDescription>
            Documents available to this project from selected indexes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Database className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium mb-2">No Indexes Selected</h3>
            <p className="text-muted-foreground mb-4">
              Select indexes above to access their documents for this project.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group documents by index
  const documentsByIndex = filteredDocuments.reduce((acc, doc) => {
    if (!acc[doc.indexName]) {
      acc[doc.indexName] = [];
    }
    acc[doc.indexName].push(doc);
    return acc;
  }, {} as Record<string, ProjectDocument[]>);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Project Documents
            </CardTitle>
            <CardDescription>
              {documents.length} documents available from {projectIndexes.length} selected {projectIndexes.length === 1 ? 'index' : 'indexes'}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-8">
            <FolderOpen className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium mb-2">No Documents Available</h3>
            <p className="text-muted-foreground">
              No documents were found in the selected indexes.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Search documents and indexes..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {fileTypes.length > 0 && (
                <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    {fileTypes.map(type => (
                      <TabsTrigger key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              )}
            </div>

            {/* Documents Grid */}
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium mb-2">No documents found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(documentsByIndex).map(([indexName, indexDocs]) => {
                  const isExpanded = expandedIndexes[indexName] || false;
                  const shownCount = shownDocuments[indexName] || INITIAL_DOCUMENTS_SHOWN;
                  const hasMore = indexDocs.length > shownCount;
                  const visibleDocs = indexDocs.slice(0, shownCount);
                  
                  return (
                    <Card key={indexName} className="border-l-4 border-l-blue-500">
                      <Collapsible open={isExpanded} onOpenChange={() => toggleIndex(indexName)}>
                        <CollapsibleTrigger asChild>
                          <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
                            <CardTitle className="text-base flex items-center">
                              {isExpanded ? (
                                <ChevronDown className="mr-2 h-4 w-4" />
                              ) : (
                                <ChevronRight className="mr-2 h-4 w-4" />
                              )}
                              <Database className="mr-2 h-4 w-4" />
                              {indexName}
                              <Badge variant="secondary" className="ml-2">
                                {indexDocs.length} {indexDocs.length === 1 ? 'document' : 'documents'}
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <CardContent className="pt-0">
                            {/* Compact Card Grid */}
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
                              {visibleDocs.map((doc) => {
                                const styles = getDocumentCardStyles(doc.file_type || '');
                                const pillText = getPillText(doc.file_type || '');
                                const displayName = doc.name;

                                return (
                                  <Card key={doc.id} className="rounded-lg overflow-hidden shadow hover:shadow-md transition-all duration-200 flex flex-col bg-white">
                                    <CardContent className="flex flex-col items-center p-3 text-center flex-grow w-full">
                                      {/* Icon Area */}
                                      <div className={cn(
                                          "w-[50px] h-[60px] mb-2 rounded-md flex flex-col items-center justify-center pt-1 pb-1 px-1 relative shrink-0",
                                          styles.iconBgClass
                                      )}>
                                        <FileText size={24} className={cn("mb-auto", styles.iconColorClass)} />
                                        <div className={cn(
                                            "text-[8px] font-bold leading-none py-0.5 px-1 rounded shadow-sm",
                                            styles.textPillBgClass, styles.textPillTextColorClass
                                        )}>
                                          {pillText}
                                        </div>
                                        {/* Status indicator */}
                                        {doc.status === 'success' || doc.status === 'completed' ? (
                                          <div className="absolute top-[calc(50%-8px)] right-[2px] bg-white rounded-full p-0.5 shadow-md">
                                            <CheckCircle2 size={12} className="text-green-500 block" />
                                          </div>
                                        ) : doc.status === 'processing' ? (
                                          <div className="absolute top-[calc(50%-8px)] right-[2px] bg-white rounded-full p-0.5 shadow-md flex items-center justify-center">
                                            <CircleDashed size={12} className="text-blue-500 block" />
                                          </div>
                                        ) : null}
                                      </div>

                                      <h3 className="text-xs font-semibold mb-1 leading-tight truncate w-full" title={displayName}>
                                        {displayName}
                                      </h3>
                                      
                                      {/* Status Badge */}
                                      <div className="mb-1">
                                        <Badge variant="outline" className={cn("text-[10px] px-1 py-0", getStatusColor(doc.status))}>
                                          {doc.status}
                                        </Badge>
                                      </div>
                                      
                                      <p className="text-[10px] text-gray-500 mb-2">{formatDate(doc.created_at)}</p>

                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </div>
                            
                            {hasMore && (
                              <div className="flex justify-center space-x-2 pt-6 border-t mt-6">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => showMoreDocuments(indexName)}
                                >
                                  Show {Math.min(INITIAL_DOCUMENTS_SHOWN, indexDocs.length - shownCount)} more
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => showAllDocuments(indexName, indexDocs.length)}
                                >
                                  Show all ({indexDocs.length})
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </CollapsibleContent>
                      </Collapsible>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 