"use client";

import React, { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";

export type ProcessingStatus = "uploading" | "analyzing" | "mapping" | "parsing" | "extracting" | "complete";

interface ProcessingModalProps {
  isOpen: boolean;
  fileName: string;
  status: ProcessingStatus;
  progress?: number;
}

export function ProcessingModal({ 
  isOpen, 
  fileName, 
  status, 
  progress = 0 
}: ProcessingModalProps) {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      setVisible(true);
    } else {
      // Delay hiding to allow for transition
      const timer = setTimeout(() => {
        setVisible(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  
  if (!isOpen && !visible) return null;

  const isUploaded = status === "analyzing" || status === "mapping" || status === "parsing" || status === "extracting" || status === "complete";
  const isAnalyzed = status === "mapping" || status === "parsing" || status === "extracting" || status === "complete";
  const isProcessed = status === "parsing" || status === "extracting" || status === "complete";
  const isComplete = status === "complete";

  // Helper function to get status text
  const getStatusText = () => {
    switch(status) {
      case "uploading":
        return "Uploading and preparing your file...";
      case "analyzing":
        return "Parsing document structure...";
      case "mapping":
        return "Mapping content and formatting...";
      case "parsing":
        return "Document parsed. Waiting for AI to process document content...";
      case "extracting":
        return "AI is extracting and organizing questions...";
      case "complete":
        return "Processing complete!";
      default:
        return "Processing your file...";
    }
  };

  return (
    <div 
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
    >
      <div 
        className={`bg-white rounded-lg shadow-xl w-full max-w-md mx-auto p-6 transition-all duration-300 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
      >
        <div className="mb-4">
          <h2 className="text-xl font-bold">Importing</h2>
          <p className="text-sm text-gray-500">{fileName}</p>
          <p className="text-sm font-medium text-blue-600 mt-1">{getStatusText()}</p>
        </div>
        
        <div className="space-y-6">
          {/* File Upload Step */}
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {isUploaded ? (
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              ) : (
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center animate-pulse">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 animate-spin">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
              )}
            </div>
            <div>
              <div className="font-medium">
                {isUploaded ? "File Upload Complete" : "Uploading File..."}
              </div>
              <div className="text-sm text-gray-500">
                {isUploaded 
                  ? "Your file has been uploaded and processed successfully" 
                  : "Please wait while we upload your file"}
              </div>
              {(status === "uploading" || (!isUploaded && status === "analyzing")) && (
                <div className="mt-2">
                  <Progress value={status === "uploading" ? 30 : 60} className="h-2 w-full bg-blue-100" />
                </div>
              )}
            </div>
          </div>

          {/* Analysis Step */}
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {isAnalyzed ? (
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              ) : status === "analyzing" ? (
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center animate-pulse">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 animate-spin">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="9" y1="21" x2="9" y2="9" />
                  </svg>
                </div>
              ) : (
                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="9" y1="21" x2="9" y2="9" />
                  </svg>
                </div>
              )}
            </div>
            <div>
              <div className="font-medium">Analysis Complete</div>
              <div className="text-sm text-gray-500">Excel File • Your file has been analyzed successfully</div>
            </div>
          </div>

          {/* Mapping Step */}
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {isComplete ? (
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              ) : status === "mapping" ? (
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 animate-spin">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  </svg>
                </div>
              ) : (
                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  </svg>
                </div>
              )}
            </div>
            <div>
              <div className="font-medium">
                {isComplete 
                  ? "File Processing Complete" 
                  : status === "mapping" 
                    ? "File Mapping Agent is processing" 
                    : "Waiting for processing to begin"}
              </div>
              <div className="text-sm text-gray-500">
                The file is being configured. This may take a while, we will notify you when it&apos;s done.
              </div>
              {status === "mapping" && (
                <div className="mt-2">
                  <Progress value={progress} className="h-2 w-full bg-blue-100" />
                </div>
              )}
            </div>
          </div>
        </div>
        
        {isComplete && (
          <div className="mt-6 transition-opacity duration-300" style={{ opacity: isComplete ? 1 : 0 }}>
            <div className="p-4 bg-green-50 rounded-md border border-green-200 text-center">
              <p className="font-medium text-green-800">Processing Complete!</p>
              <p className="text-sm text-green-600">Your document has been processed successfully.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 