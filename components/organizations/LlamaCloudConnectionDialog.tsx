'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, ExternalLink } from 'lucide-react';

interface LlamaCloudConnectionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  onSuccess?: () => void;
}

export function LlamaCloudConnectionDialog({
  isOpen,
  onOpenChange,
  organizationId,
  onSuccess
}: LlamaCloudConnectionDialogProps) {
  const [apiKey, setApiKey] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      toast({
        title: 'Error',
        description: 'API key is required',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsConnecting(true);
      
      const response = await fetch('/api/llamacloud/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          apiKey: apiKey.trim(),
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        
        toast({
          title: 'Success',
          description: `Connected to LlamaCloud project: ${result.llamaCloudProjectName || 'Unknown'}`,
        });
        
        // Reset form
        setApiKey('');
        
        // Close dialog
        onOpenChange(false);
        
        // Call success callback
        if (onSuccess) {
          onSuccess();
        }
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to connect to LlamaCloud');
      }
    } catch (error) {
      toast({
        title: 'Connection Error',
        description: error instanceof Error ? error.message : 'Failed to connect to LlamaCloud',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleConnect}>
          <DialogHeader>
            <DialogTitle>Connect to LlamaCloud Project</DialogTitle>
            <DialogDescription>
              Connect your organization to a LlamaCloud project using the project&apos;s API key to access its pipelines and documents.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="apiKey">LlamaCloud Project API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your LlamaCloud project API key"
                className="col-span-3"
                required
              />
              <p className="text-sm text-muted-foreground">
                You can find your project API key in your{' '}
                <a 
                  href="https://cloud.llamaindex.ai/api-key" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary underline inline-flex items-center gap-1"
                >
                  LlamaCloud project settings
                  <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isConnecting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isConnecting || !apiKey.trim()}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 