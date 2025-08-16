
import React from 'react';
import { saveAs } from 'file-saver';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export const DocumentExporter: React.FC = () => {
  // Downloads the Source Citations refactor report as a Markdown file
  const handleExport = async () => {
    try {
      const res = await fetch('/docs/source-citations-refactor-report.md', { cache: 'no-cache' });
      if (!res.ok) throw new Error(`Failed to fetch report: ${res.status}`);
      const text = await res.text();
      const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
      saveAs(blob, 'source-citations-refactor-report.md');
    } catch (err) {
      console.error('Export documentation failed:', err);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Documentation</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={handleExport} aria-label="Download Source Citations Refactor Report as Markdown">
          <Download className="mr-2 h-4 w-4" />
          Export Docs
        </Button>
      </CardContent>
    </Card>
  );
};

export default DocumentExporter;
