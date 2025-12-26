"use client"

import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Database } from "lucide-react"

interface ProjectIndex {
  id: string;
  name: string;
}

interface IndexSelectorProps {
  availableIndexes: ProjectIndex[];
  selectedIndexes: Set<string>;
  organizationConnected: boolean;
}

export function IndexSelector({
  availableIndexes,
  selectedIndexes,
  organizationConnected,
}: IndexSelectorProps) {
  if (!organizationConnected || availableIndexes.length === 0) {
    return (
      <Card className="mb-6 border-amber-200 bg-amber-50">
        <CardHeader className="py-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">No Project Indexes Configured</p>
              <p className="text-sm text-amber-700">
                This project has no document indexes configured. Go to the project&apos;s Documents tab to select indexes from your organization&apos;s LlamaCloud connection.
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader className="py-4">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base">
            {availableIndexes[0].name}
          </CardTitle>
          {selectedIndexes.size > 0 && (
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
              Active
            </Badge>
          )}
        </div>
        {selectedIndexes.size === 0 && (
          <p className="text-sm text-amber-600 mt-2">
            No project indexes selected. AI generation will use default responses.
          </p>
        )}
      </CardHeader>
    </Card>
  );
}
