"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { LlamaParseResult } from "@/types/api";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ProcessingModal, ProcessingStatus } from "./ProcessingModal";

interface FileUploaderProps {
  onFileProcessed?: (result: LlamaParseResult) => void;
  processingStatus?: ProcessingStatus;
  updateProcessingStatus?: (status: ProcessingStatus) => void;
}

export function FileUploader({ 
  onFileProcessed,
  processingStatus: externalProcessingStatus,
  updateProcessingStatus: externalUpdateProcessingStatus
}: FileUploaderProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [parsingMode, setParsingMode] = useState<string>("balanced");
  const [documentName, setDocumentName] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Processing modal state - use external state if provided
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [internalProcessingStatus, setInternalProcessingStatus] = useState<ProcessingStatus>("uploading");
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processedResult, setProcessedResult] = useState<LlamaParseResult | null>(null);

  // Use external processing status if provided, otherwise use internal
  const processingStatus = externalProcessingStatus || internalProcessingStatus;
  
  // Function to update processing status - calls external handler if provided
  const updateProcessingStatus = (status: ProcessingStatus) => {
    if (externalUpdateProcessingStatus) {
      externalUpdateProcessingStatus(status);
    } else {
      setInternalProcessingStatus(status);
    }
    
    // If status is "complete", hide the modal after a brief delay
    if (status === "complete") {
      setTimeout(() => {
        setShowProcessingModal(false);
      }, 2000);
    }
  };

  // Debug effect to monitor modal state
  useEffect(() => {
    console.log("Processing modal state changed:", showProcessingModal);
    if (showProcessingModal) {
      console.log("Modal shown with status:", processingStatus);
    }
  }, [showProcessingModal, processingStatus]);

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Handle file input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Handle file validation and state update
  const handleFile = (file: File) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (fileExtension === 'csv' || fileExtension === 'xlsx' || fileExtension === 'xls' || fileExtension === 'pdf') {
      setFile(file);
      if (!documentName) {
        setDocumentName(file.name.split('.')[0]);
      }
    } else {
      toast({
        title: "Unsupported file format",
        description: "Please upload an Excel (.xlsx, .xls), CSV (.csv), or PDF file.",
        variant: "destructive"
      });
    }
  };

  // Handle file upload to LlamaParse
  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload.",
        variant: "destructive"
      });
      return;
    }

    if (!documentName.trim()) {
      toast({
        title: "Document name required",
        description: "Please provide a name for this document.",
        variant: "destructive"
      });
      return;
    }

    // Show the processing modal immediately
    updateProcessingStatus("uploading");
    setProcessingProgress(0);
    setShowProcessingModal(true);
    setIsUploading(true);

    // Set up a timer to automatically progress the UI after a reasonable time
    const progressTimer = setTimeout(() => {
      // If we're still uploading after 3 seconds, assume backend processing has started
      if (processingStatus === "uploading") {
        console.log("Auto-advancing to analyzing state after timeout");
        updateProcessingStatus("analyzing");
      }
    }, 3000);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentName', documentName);
      
      // Add parsing mode parameters based on selection
      if (parsingMode === "fast") {
        formData.append('fast_mode', "true");
      } else if (parsingMode === "premium") {
        formData.append('premium_mode', "true");
      } else if (parsingMode === "complexTables") {
        formData.append('preset', "complexTables");
      }
      
      // Send the file to our API endpoint
  
      const response = await fetch('/api/llamaparse', {
        method: 'POST',
        body: formData,
      });
      
      // Clear the auto-progress timer since the API has responded
      clearTimeout(progressTimer);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload file');
      }
      
      const result = await response.json();
      
      // Upload is done, now switch to import progress flow
      setIsUploading(false);
      setProcessedResult(result);
      
      // Since API has responded completely, go directly to mapping phase
      // The actual parsing is already done at this point
      updateProcessingStatus("mapping");
      
      // Now simulate the mapping progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 5;
        setProcessingProgress(progress);
        
        if (progress >= 100) {
          clearInterval(interval);
          
          // When complete, move to parsing status
          updateProcessingStatus("parsing");
          
          // Call the onFileProcessed callback to begin question extraction
          if (onFileProcessed) {
            onFileProcessed(result);
            
            // Update to extracting status when OpenAI API call begins
            setTimeout(() => {
              updateProcessingStatus("extracting");
              
              // Keep modal open until question extraction completes
              // The page component will handle hiding the modal
            }, 1500);
          } else {
            // This path shouldn't typically be used, but just in case
            setShowProcessingModal(false);
            router.push(`/projects/${result.documentId}/questions`);
          }
        }
      }, 200);
      
    } catch (error) {
      // Clear the auto-progress timer on error
      clearTimeout(progressTimer);
      
      console.error("Error uploading file:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "There was an error uploading your file. Please try again.",
        variant: "destructive"
      });
      setIsUploading(false);
      // Hide the modal on error
      setShowProcessingModal(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Upload Document</CardTitle>
          <CardDescription>
            Upload an Excel, CSV, or PDF file to be processed by LlamaParse
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* File Upload Area with Drag & Drop */}
            <div 
              className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors cursor-pointer ${
                dragActive 
                  ? "border-primary bg-primary/5" 
                  : "border-muted-foreground/25 hover:bg-muted/50"
              }`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              <div className="flex flex-col items-center justify-center gap-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={dragActive ? "text-primary" : "text-muted-foreground"}
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <div>
                  <p className="font-medium">Drag and drop your file here or click to browse</p>
                  <p className="text-sm text-muted-foreground">Supports Excel (.xlsx, .xls), CSV (.csv), and PDF files</p>
                </div>
                <Input 
                  type="file" 
                  accept=".xlsx,.xls,.csv,.pdf" 
                  className="hidden" 
                  ref={inputRef}
                  onChange={handleChange}
                />
                <Button size="sm" type="button">
                  Select File
                </Button>
              </div>
            </div>

            {/* Advanced Settings Accordion */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="advanced-settings">
                <AccordionTrigger className="text-sm font-medium">
                  Advanced Settings
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-4 pt-2">
                    <div>
                      <label className="block text-sm font-medium mb-2">Parsing Mode</label>
                      <Select 
                        defaultValue="balanced" 
                        value={parsingMode}
                        onValueChange={setParsingMode}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select parsing mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fast">Fast (Simple, text-only documents)</SelectItem>
                          <SelectItem value="balanced">Balanced (Default for mixed content)</SelectItem>
                          <SelectItem value="premium">Premium (Complex documents with tables/images)</SelectItem>
                          <SelectItem value="complexTables">Complex Tables (Specialized for tables)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Choose the appropriate mode based on your document&apos;s complexity
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Document Name</label>
                      <Input 
                        placeholder="Enter a name for this document" 
                        className="w-full"
                        value={documentName}
                        onChange={(e) => setDocumentName(e.target.value)}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-6">
          <div className="space-y-1">
            <p className="text-sm">
              Selected File: {file ? (
                <span className="font-medium">{file.name}</span>
              ) : (
                <span className="italic text-muted-foreground">No file selected</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">Powered by LlamaParse</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleUpload} 
              disabled={!file || isUploading}
            >
              {isUploading ? (
                <>
                  <Spinner className="mr-2" size="sm" />
                  Processing...
                </>
              ) : (
                "Upload & Process"
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      {/* Processing Modal - simpler implementation without using Dialog */}
      <ProcessingModal
        isOpen={showProcessingModal}
        fileName={file?.name || "Unknown file"}
        status={processingStatus}
        progress={processingProgress}
      />
    </>
  );
} 