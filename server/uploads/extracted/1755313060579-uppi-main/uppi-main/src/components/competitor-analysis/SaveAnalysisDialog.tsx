
import React, { useState, useEffect } from 'react';
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
import { Save, Loader2 } from 'lucide-react';
import type { CompetitorAnalysisResult } from '@/services/competitorAnalysisService';

interface SaveAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string, description: string) => Promise<void>;
  defaultName?: string;
  isLoading?: boolean;
  results?: CompetitorAnalysisResult[];
}

export const SaveAnalysisDialog: React.FC<SaveAnalysisDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  defaultName = '',
  isLoading = false,
  results = []
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Generate intelligent default name based on competitor results
  useEffect(() => {
    if (open && results.length > 0) {
      const companyNames = results
        .map(result => result.name)
        .filter(Boolean)
        .slice(0, 3); // Limit to first 3 companies
      
      const dateTime = new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      
      let intelligentTitle = '';
      if (companyNames.length === 1) {
        intelligentTitle = `${companyNames[0]} Analysis - ${dateTime}`;
      } else if (companyNames.length > 1) {
        const others = companyNames.length > 3 ? ` +${companyNames.length - 3} others` : '';
        intelligentTitle = `${companyNames.join(', ')}${others} - ${dateTime}`;
      } else {
        intelligentTitle = `Competitor Analysis - ${dateTime}`;
      }
      
      setName(defaultName || intelligentTitle);
    } else if (open && defaultName) {
      setName(defaultName);
    }
  }, [open, defaultName, results]);

  const handleSave = async () => {
    if (!name.trim()) return;
    
    try {
      await onSave(name.trim(), description.trim());
      setName('');
      setDescription('');
      onOpenChange(false);
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setName('');
      setDescription('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Save Analysis
          </DialogTitle>
          <DialogDescription>
            Save this competitor analysis for future reference. You can view and update it later.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Analysis Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Microsoft Analysis - Jan 15, 2024 2:30 PM"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of this analysis..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Analysis
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
