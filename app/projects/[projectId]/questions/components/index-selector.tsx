"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, Database, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProjectIndex {
  id: string;
  name: string;
}

interface IndexSelectorProps {
  availableIndexes: ProjectIndex[];
  selectedIndexes: Set<string>;
  organizationConnected: boolean;
  onIndexToggle: (indexId: string) => void;
  onSelectAllIndexes: () => void;
}

export function IndexSelector({
  availableIndexes,
  selectedIndexes,
  organizationConnected,
  onIndexToggle,
  onSelectAllIndexes
}: IndexSelectorProps) {
  const [showIndexSelector, setShowIndexSelector] = useState(false);

  if (!organizationConnected) {
    return (
      <Card className="mb-6 border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">No Project Indexes Configured</p>
              <p className="text-sm text-amber-700">
                This project has no document indexes configured. Go to the project&apos;s Documents tab to select indexes from your organization&apos;s LlamaCloud connection.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (availableIndexes.length === 0) {
    return (
      <Card className="mb-6 border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">No Project Indexes Configured</p>
              <p className="text-sm text-amber-700">
                This project has no document indexes configured. Go to the project&apos;s Documents tab to select indexes from your organization&apos;s LlamaCloud connection.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader className="">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">
              {availableIndexes.length === 1 
                ? availableIndexes[0].name
                : `${availableIndexes.length} Project Indexes`
              }
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {selectedIndexes.size} of {availableIndexes.length} selected
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowIndexSelector(!showIndexSelector)}
          >
            <Settings className="h-4 w-4 mr-1" />
            {showIndexSelector ? 'Hide' : 'Configure'}
          </Button>
        </div>
        {selectedIndexes.size === 0 && (
          <p className="text-sm text-amber-600 mt-2">
            ⚠️ No project indexes selected. AI generation will use default responses.
          </p>
        )}
      </CardHeader>
      
      {showIndexSelector && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This selection is temporary for AI generation in this session. 
                You can only select from indexes that are already configured for this project. 
                To add or remove project indexes permanently, use the <strong>Documents</strong> tab.
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Select which of this project&apos;s configured indexes to use when generating AI answers:
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={onSelectAllIndexes}
              >
                {selectedIndexes.size === availableIndexes.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableIndexes.map((index) => (
                <div
                  key={index.id}
                  className={cn(
                    "flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors",
                    selectedIndexes.has(index.id)
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-muted-foreground/30"
                  )}
                  onClick={() => onIndexToggle(index.id)}
                >
                  <Checkbox
                    checked={selectedIndexes.has(index.id)}
                    onChange={() => onIndexToggle(index.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium text-sm truncate">{index.name}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {selectedIndexes.size > 0 && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  ✓ AI will use documents from {selectedIndexes.size} selected project {selectedIndexes.size === 1 ? 'index' : 'indexes'} to generate answers.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
} 