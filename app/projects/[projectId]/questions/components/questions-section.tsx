"use client"

import React, { Suspense, useState } from "react"
import { Toaster } from "@/components/ui/toaster"

// Import the new components
import { QuestionsProvider, useQuestions } from "./questions-provider"
import { QuestionsHeader } from "./questions-header"
import { NoQuestionsAvailable } from "./no-questions-available"
import { SourceDetailsDialog } from "./source-details-dialog"
import { QuestionsFilterTabs } from "./questions-filter-tabs"
import { QuestionsLoadingState, QuestionsErrorState } from "./questions-states"
import { MultiStepResponseHandler } from "./multi-step-response-handler"
import { IndexSelector } from "./index-selector"
import { UploadDialog } from "./upload-dialog"

interface QuestionsSectionProps {
  projectId: string;
}

// Inner component that uses the context
function QuestionsSectionInner({ projectId }: QuestionsSectionProps) {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  
  const {
    isLoading,
    error,
    rfpDocument,
    unsavedQuestions,
    savingQuestions,
    searchQuery,
    setSearchQuery,
    selectedSource,
    isSourceModalOpen,
    setIsSourceModalOpen,
    saveAllAnswers,
    handleExportAnswers,
    selectedIndexes,
    availableIndexes,
    organizationConnected,
    refreshQuestions,
  } = useQuestions();

  const handleUploadComplete = () => {
    // Refresh the questions data after successful upload
    refreshQuestions();
  };

  return (
    <div className="space-y-6 p-6 md:p-8 lg:p-12 min-h-screen">
      {/* Loading state */}
      {isLoading && <QuestionsLoadingState />}

      {/* Error state */}
      {error && <QuestionsErrorState error={error} />}

             {/* No questions state */}
       {(!isLoading && !error && (!rfpDocument || rfpDocument.sections.length === 0 || 
         rfpDocument.sections.every(section => section.questions.length === 0))) && (
         <NoQuestionsAvailable projectId={projectId} onUploadClick={() => setIsUploadDialogOpen(true)} />
       )}

      {/* Questions available state */}
      {!isLoading && !error && rfpDocument && rfpDocument.sections.length > 0 && 
       !rfpDocument.sections.every(section => section.questions.length === 0) && (
        <>
          <QuestionsHeader
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSaveAll={saveAllAnswers}
            onExport={handleExportAnswers}
            unsavedCount={unsavedQuestions.size}
            isSaving={savingQuestions.size > 0}
          />

          {/* Index Selection Panel */}
          <IndexSelector
            availableIndexes={availableIndexes}
            selectedIndexes={selectedIndexes}
            organizationConnected={organizationConnected}
          />

          {/* Questions Filter Tabs */}
          <QuestionsFilterTabs rfpDocument={rfpDocument} />
        </>
      )}

      {/* Source Details Dialog */}
      <SourceDetailsDialog
        isOpen={isSourceModalOpen}
        onClose={() => setIsSourceModalOpen(false)}
        source={selectedSource}
      />
      
             {/* Multi-step Response Dialog */}
       <MultiStepResponseHandler />

       {/* Upload Dialog */}
       <UploadDialog
         isOpen={isUploadDialogOpen}
         onClose={() => setIsUploadDialogOpen(false)}
         projectId={projectId}
         onUploadComplete={handleUploadComplete}
       />
       
       <Toaster />
     </div>
  );
}

// Main export that wraps the inner component with Suspense and Provider
export function QuestionsSection({ projectId }: QuestionsSectionProps) {
  return (
    <QuestionsProvider projectId={projectId}>
      <Suspense fallback={
        <div className="space-y-6 p-6 md:p-8 lg:p-12 min-h-screen">
          <div className="flex items-center justify-between">
            <div className="h-8 w-36 bg-muted animate-pulse rounded"></div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-64 bg-muted animate-pulse rounded"></div>
              <div className="h-9 w-24 bg-muted animate-pulse rounded"></div>
              <div className="h-9 w-32 bg-muted animate-pulse rounded"></div>
            </div>
          </div>
          <div className="h-12 bg-muted animate-pulse rounded"></div>
          <div className="h-[500px] bg-muted animate-pulse rounded"></div>
        </div>
      }>
        <QuestionsSectionInner projectId={projectId} />
      </Suspense>
    </QuestionsProvider>
  );
} 