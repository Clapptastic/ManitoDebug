import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileText, Table, FileImage, Settings, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { CompetitorAnalysisEntity } from '@/types/competitor-analysis';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';

// Extend jsPDF type for autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: { finalY: number };
  }
}

interface AdvancedExportDialogProps {
  analysis: CompetitorAnalysisEntity;
  trigger?: React.ReactNode;
}

type ExportFormat = 'json' | 'csv' | 'pdf';
type PDFFormat = 'basic' | 'comprehensive' | 'executive';

export const AdvancedExportDialog: React.FC<AdvancedExportDialogProps> = ({ 
  analysis, 
  trigger 
}) => {
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [pdfFormat, setPdfFormat] = useState<PDFFormat>('comprehensive');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const formatOptions = [
    { 
      value: 'pdf' as ExportFormat, 
      label: 'PDF Report', 
      icon: FileImage,
      description: 'Professional PDF report with charts and formatting'
    },
    { 
      value: 'csv' as ExportFormat, 
      label: 'CSV Data', 
      icon: Table,
      description: 'Raw data export for analysis and spreadsheets'
    },
    { 
      value: 'json' as ExportFormat, 
      label: 'JSON Data', 
      icon: FileText,
      description: 'Complete structured data for developers'
    }
  ];

  const pdfFormatOptions = [
    {
      value: 'executive' as PDFFormat,
      label: 'Executive Summary',
      description: 'Concise overview for leadership',
      icon: Zap
    },
    {
      value: 'comprehensive' as PDFFormat,
      label: 'Comprehensive Report',
      description: 'Complete analysis with all data points',
      icon: Settings
    },
    {
      value: 'basic' as PDFFormat,
      label: 'Basic Report',
      description: 'Essential information only',
      icon: FileText
    }
  ];

  const exportAsJson = () => {
    const exportData = {
      name: analysis.name,
      createdAt: analysis.created_at,
      analysis: analysis,
      exportedAt: new Date().toISOString(),
      version: '2.0'
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${analysis.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_analysis.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsCsv = () => {
    const headers = [
      'Field', 'Value'
    ];

    const rows = [
      ['Company Name', analysis.name || ''],
      ['Description', analysis.description || ''],
      ['Website URL', analysis.website_url || ''],
      ['Industry', analysis.industry || ''],
      ['Founded Year', analysis.founded_year?.toString() || ''],
      ['Headquarters', analysis.headquarters || ''],
      ['Employee Count', analysis.employee_count?.toString() || ''],
      ['Business Model', analysis.business_model || ''],
      ['Market Position', analysis.market_position || ''],
      ['Market Share Estimate (%)', analysis.market_share_estimate?.toString() || ''],
      ['Revenue Estimate', analysis.revenue_estimate?.toString() || ''],
      ['Strengths', (analysis.strengths || []).join('; ')],
      ['Weaknesses', (analysis.weaknesses || []).join('; ')],
      ['Opportunities', (analysis.opportunities || []).join('; ')],
      ['Threats', (analysis.threats || []).join('; ')],
      ['Competitive Advantages', (analysis.competitive_advantages || []).join('; ')],
      ['Competitive Disadvantages', (analysis.competitive_disadvantages || []).join('; ')],
      ['Overall Threat Level', analysis.overall_threat_level || ''],
      ['Data Quality Score', analysis.data_quality_score?.toString() || ''],
      ['Data Completeness Score', analysis.data_completeness_score?.toString() || ''],
      ['Innovation Score', analysis.innovation_score?.toString() || ''],
      ['Brand Strength Score', analysis.brand_strength_score?.toString() || ''],
      ['Market Sentiment Score', analysis.market_sentiment_score?.toString() || ''],
      ['Patent Count', analysis.patent_count?.toString() || ''],
      ['Target Markets', (analysis.target_market || []).join('; ')],
      ['Customer Segments', (analysis.customer_segments || []).join('; ')],
      ['Geographic Presence', (analysis.geographic_presence || []).join('; ')],
      ['Partnerships', (analysis.partnerships || []).join('; ')],
      ['Status', analysis.status || ''],
      ['Created At', analysis.created_at || ''],
      ['Updated At', analysis.updated_at || ''],
      ['Completed At', analysis.completed_at || '']
    ];

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${analysis.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_analysis.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsPdf = async () => {
    try {
      console.log('🔄 Starting PDF generation via edge function...');
      
      const { data, error } = await supabase.functions.invoke('generate-analysis-pdf', {
        body: {
          analysisId: analysis.id,
          format: pdfFormat,
          includeCharts,
          customSections: []
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        // Fallback to client-side PDF generation
        await generateClientSidePdf();
        return;
      }

      if (!data.success) {
        throw new Error(data.error || 'PDF generation failed');
      }

      console.log('✅ PDF data received from edge function');
      
      // Generate PDF from structured data
      await createPdfFromStructuredData(data.data);
      
    } catch (error) {
      console.error('❌ Edge function PDF generation failed, falling back to client-side:', error);
      await generateClientSidePdf();
    }
  };

  const createPdfFromStructuredData = async (pdfData: any) => {
    const doc = new jsPDF();
    let yPosition = 20;

    // Process each section from the structured data
    for (const section of pdfData.sections) {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      switch (section.type) {
        case 'header':
          doc.setFontSize(20);
          doc.text(section.title, 20, yPosition);
          yPosition += 10;
          doc.setFontSize(12);
          doc.text(section.subtitle, 20, yPosition);
          yPosition += 10;
          if (section.metadata) {
            doc.setFontSize(10);
            doc.text(`Data Quality: ${section.metadata.dataQuality}% | Status: ${section.metadata.status}`, 20, yPosition);
            yPosition += 15;
          }
          break;

        case 'executive_summary':
          doc.setFontSize(16);
          doc.text(section.title, 20, yPosition);
          yPosition += 10;
          doc.setFontSize(10);
          const splitText = doc.splitTextToSize(section.content, 170);
          doc.text(splitText, 20, yPosition);
          yPosition += splitText.length * 5 + 10;
          break;

        case 'company_overview':
        case 'financial_overview':
        case 'market_analysis':
        case 'technology_analysis':
        case 'methodology':
          doc.setFontSize(14);
          doc.text(section.title, 20, yPosition);
          yPosition += 10;

          const tableData = Object.entries(section.data).map(([key, value]) => [
            key, 
            typeof value === 'string' ? value : JSON.stringify(value)
          ]);

          doc.autoTable({
            startY: yPosition,
            head: [['Field', 'Value']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246] },
            margin: { left: 20, right: 20 }
          });

          yPosition = doc.lastAutoTable.finalY + 15;
          break;

        case 'swot_analysis':
          doc.setFontSize(14);
          doc.text(section.title, 20, yPosition);
          yPosition += 10;

          const swotData = [
            ['Strengths', section.data.strengths.join('; ') || 'N/A'],
            ['Weaknesses', section.data.weaknesses.join('; ') || 'N/A'],
            ['Opportunities', section.data.opportunities.join('; ') || 'N/A'],
            ['Threats', section.data.threats.join('; ') || 'N/A']
          ];

          doc.autoTable({
            startY: yPosition,
            head: [['Category', 'Details']],
            body: swotData,
            theme: 'striped',
            headStyles: { fillColor: [34, 197, 94] },
            margin: { left: 20, right: 20 }
          });

          yPosition = doc.lastAutoTable.finalY + 15;
          break;

        case 'performance_scores':
          doc.setFontSize(14);
          doc.text(section.title, 20, yPosition);
          yPosition += 10;

          doc.autoTable({
            startY: yPosition,
            head: [['Metric', 'Score']],
            body: section.scores.map(([metric, score]: [string, number]) => [metric, `${score}/100`]),
            theme: 'striped',
            headStyles: { fillColor: [168, 85, 247] },
            margin: { left: 20, right: 20 }
          });

          yPosition = doc.lastAutoTable.finalY + 15;
          break;
      }
    }

    const fileName = `${analysis.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${pdfFormat}_report.pdf`;
    doc.save(fileName);
  };

  const generateClientSidePdf = async () => {
    const doc = new jsPDF();
    
    // Basic PDF generation (fallback)
    doc.setFontSize(20);
    doc.text(`Competitor Analysis: ${analysis.name}`, 20, 20);
    
    doc.setFontSize(16);
    doc.text(`${pdfFormat.charAt(0).toUpperCase() + pdfFormat.slice(1)} Report`, 20, 35);
    
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 45);
    doc.text(`Data Quality Score: ${analysis.data_completeness_score || 'N/A'}%`, 20, 52);
    
    let yPosition = 65;
    
    // Company Information
    const companyData = [
      ['Industry', analysis.industry || 'N/A'],
      ['Founded Year', analysis.founded_year?.toString() || 'N/A'],
      ['Headquarters', analysis.headquarters || 'N/A'],
      ['Employee Count', analysis.employee_count?.toString() || 'N/A'],
      ['Business Model', analysis.business_model || 'N/A'],
      ['Market Position', analysis.market_position || 'N/A']
    ];

    doc.autoTable({
      startY: yPosition,
      head: [['Field', 'Value']],
      body: companyData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] }
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    // SWOT Analysis if available
    if (analysis.strengths?.length || analysis.weaknesses?.length || 
        analysis.opportunities?.length || analysis.threats?.length) {
      
      const swotData = [
        ['Strengths', (analysis.strengths || []).join('; ') || 'N/A'],
        ['Weaknesses', (analysis.weaknesses || []).join('; ') || 'N/A'],
        ['Opportunities', (analysis.opportunities || []).join('; ') || 'N/A'],
        ['Threats', (analysis.threats || []).join('; ') || 'N/A']
      ];

      doc.autoTable({
        startY: yPosition,
        head: [['Category', 'Details']],
        body: swotData,
        theme: 'striped',
        headStyles: { fillColor: [34, 197, 94] }
      });
    }

    const fileName = `${analysis.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${pdfFormat}_report.pdf`;
    doc.save(fileName);
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      switch (format) {
        case 'json':
          exportAsJson();
          break;
        case 'csv':
          exportAsCsv();
          break;
        case 'pdf':
          await exportAsPdf();
          break;
      }
      
      toast({
        title: "Export Complete",
        description: `Analysis exported as ${format.toUpperCase()}${format === 'pdf' ? ` (${pdfFormat})` : ''}`
      });
      
      setIsOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export analysis data",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Export Analysis Report</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Format Selection */}
          <div>
            <Label className="text-sm font-medium">Export Format:</Label>
            <RadioGroup 
              value={format} 
              onValueChange={(value) => setFormat(value as ExportFormat)}
              className="mt-3"
            >
              {formatOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <div key={option.value} className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor={option.value} className="flex items-center gap-2 font-medium cursor-pointer">
                        <IconComponent className="w-4 h-4" />
                        {option.label}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {option.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* PDF Format Options */}
          {format === 'pdf' && (
            <div>
              <Label className="text-sm font-medium">PDF Report Type:</Label>
              <RadioGroup 
                value={pdfFormat} 
                onValueChange={(value) => setPdfFormat(value as PDFFormat)}
                className="mt-3"
              >
                {pdfFormatOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <div key={option.value} className="flex items-start space-x-3 p-2 rounded border hover:bg-muted/30">
                      <RadioGroupItem value={option.value} id={`pdf-${option.value}`} className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor={`pdf-${option.value}`} className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                          <IconComponent className="w-3 h-3" />
                          {option.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </RadioGroup>

              {/* PDF Options */}
              <div className="mt-4 p-3 bg-muted/30 rounded">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="include-charts" 
                    checked={includeCharts} 
                    onCheckedChange={(checked) => setIncludeCharts(checked as boolean)}
                  />
                  <Label htmlFor="include-charts" className="text-sm">
                    Include charts and visualizations (when available)
                  </Label>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? 'Exporting...' : `Export ${format.toUpperCase()}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};