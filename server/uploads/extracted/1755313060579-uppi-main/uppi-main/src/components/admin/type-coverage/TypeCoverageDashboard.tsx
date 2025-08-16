import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TypeCoverageData {
  total_files: number;
  typed_files: number;
  untypedFiles: number;
  coverage_percentage: number;
  issues: TypeIssue[];
}

interface TypeIssue {
  id: string;
  file_path: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  line: number;
}

const TypeCoverageDashboard: React.FC = () => {
  const [coverageData, setCoverageData] = useState<TypeCoverageData>({
    total_files: 0,
    typed_files: 0,
    untypedFiles: 0,
    coverage_percentage: 0,
    issues: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTypeCoverage();
  }, []);

  const loadTypeCoverage = async () => {
    try {
      setLoading(true);
      setError(null);

      // Discover TS/TSX files at build-time and load their raw contents
      const modules = import.meta.glob('/src/**/*.{ts,tsx}', { as: 'raw' });
      const entries = Object.entries(modules);

      if (!entries || entries.length === 0) {
        throw new Error('No source files discovered via import.meta.glob');
      }

      let totalFiles = 0;
      let typedFiles = 0;
      const issues: TypeIssue[] = [];

      const maxFiles = 200; // safety cap to avoid heavy scans in large repos
      for (const [path, loader] of entries.slice(0, maxFiles)) {
        totalFiles++;
        const raw = await (loader as () => Promise<string>)();
        const lines = raw.split('\n');

        let hasAny = false;
        for (let i = 0; i < lines.length; i++) {
          const lineText = lines[i];
          const lineNo = i + 1;

          // Detect explicit any
          if (/:[\s]*any\b/.test(lineText)) {
            hasAny = true;
            issues.push({
              id: `${path}:${lineNo}:any`,
              file_path: path.replace(/^\//, ''),
              severity: 'warning',
              message: 'Explicit any detected',
              line: lineNo,
            });
          }

          // Detect type assertions to any
          if (/\bas\s+any\b/.test(lineText)) {
            hasAny = true;
            issues.push({
              id: `${path}:${lineNo}:asany`,
              file_path: path.replace(/^\//, ''),
              severity: 'info',
              message: 'Type assertion to any',
              line: lineNo,
            });
          }
        }

        if (!hasAny) typedFiles++;
      }

      const untypedFiles = totalFiles - typedFiles;
      const coverage_percentage = totalFiles > 0 ? Math.round((typedFiles / totalFiles) * 100) : 0;

      setCoverageData({
        total_files: totalFiles,
        typed_files: typedFiles,
        untypedFiles,
        coverage_percentage,
        issues,
      });
    } catch (err) {
      console.error('Failed to load type coverage from client scan, falling back to edge function:', err);
      // Fallback: use secure edge function which stores/returns metrics
      try {
        const { data, error } = await supabase.functions.invoke('type-coverage-analysis', {
          body: { action: 'runAnalysis' }
        });
        if (error) throw error;

        const results = (data?.results || []) as Array<{
          file_path: string;
          total_lines: number;
          typed_lines: number;
          type_coverage_percentage: number;
          any_types_count: number;
          errors_count: number;
          warnings_count: number;
        }>;

        let totalLines = 0;
        let typedLines = 0;
        const issues: TypeIssue[] = [];
        results.forEach((r) => {
          totalLines += Number(r.total_lines) || 0;
          typedLines += Number(r.typed_lines) || 0;
          if (r.any_types_count > 0) {
            issues.push({
              id: `${r.file_path}:any_count`,
              file_path: r.file_path,
              severity: 'warning',
              message: `Contains any types (${r.any_types_count})`,
              line: 1,
            });
          }
          if (r.warnings_count > 0) {
            issues.push({
              id: `${r.file_path}:warnings`,
              file_path: r.file_path,
              severity: 'info',
              message: `Type warnings (${r.warnings_count})`,
              line: 1,
            });
          }
          if (r.errors_count > 0) {
            issues.push({
              id: `${r.file_path}:errors`,
              file_path: r.file_path,
              severity: 'error',
              message: `Type errors (${r.errors_count})`,
              line: 1,
            });
          }
        });

        const totalFiles = results.length;
        const coverage_percentage = totalLines > 0 ? Math.round((typedLines / totalLines) * 100) : 0;
        const typed_files = results.filter((r) => (r.any_types_count || 0) === 0).length;

        setCoverageData({
          total_files: totalFiles,
          typed_files,
          untypedFiles: Math.max(0, totalFiles - typed_files),
          coverage_percentage,
          issues,
        });
      } catch (fallbackErr: any) {
        console.error('Type coverage edge fallback failed:', fallbackErr);
        setError(fallbackErr?.message || 'Failed to load type coverage data');
      }
    } finally {
      setLoading(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'info':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading type coverage data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Type Coverage</CardTitle>
            <CardDescription>We couldn’t load coverage data.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-destructive text-sm truncate">{error}</p>
              <button
                className="underline text-sm"
                onClick={() => loadTypeCoverage()}
                aria-label="Retry loading type coverage"
              >
                Retry
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">TypeScript Coverage</h2>
        <p className="text-muted-foreground">
          Monitor TypeScript coverage and type safety across your codebase
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coverageData.total_files}</div>
            <p className="text-xs text-muted-foreground">
              TypeScript and JavaScript files
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Typed Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coverageData.typed_files}</div>
            <p className="text-xs text-muted-foreground">
              Files with proper typing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coverageData.coverage_percentage}%</div>
            <Progress value={coverageData.coverage_percentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coverageData.issues.length}</div>
            <p className="text-xs text-muted-foreground">
              Type-related issues found
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Type Issues</CardTitle>
          <CardDescription>
            Recent TypeScript errors, warnings, and suggestions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {coverageData.issues.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <p className="text-muted-foreground">No type issues found!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {coverageData.issues.map((issue) => (
                <div key={issue.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                  {getSeverityIcon(issue.severity)}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium">{issue.file_path}</p>
                      <Badge variant={getSeverityColor(issue.severity) as any}>
                        {issue.severity}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Line {issue.line}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{issue.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TypeCoverageDashboard;