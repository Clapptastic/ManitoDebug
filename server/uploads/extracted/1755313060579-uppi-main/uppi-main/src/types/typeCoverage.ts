
/**
 * TypeScript coverage types for admin dashboard
 */

export interface TypeCoverageData {
  percentage: number;
  typedFiles: number;
  totalFiles: number;
  typedLines?: number;
  totalLines?: number;
  directoryBreakdown: DirectoryCoverageRaw[];
  worstFiles: FileCoverageRaw[];
  history: TypeCoverageHistory[];
  lastUpdated: string;
}

export interface TypeCoverageHistory {
  date: string;
  percentage: number;
  errorsFixed?: number;
}

export interface DirectoryCoverageRaw {
  name: string;
  path: string;
  coverage: number;
  files: number;
  typedFiles: number;
  typedLines: number;
  totalLines: number;
  percentage?: number;
}

export interface FileCoverageRaw {
  name?: string;
  path?: string;
  filePath?: string;
  coverage: number;
  anyCount?: number;
  totalCount?: number;
  errors?: number;
  warnings?: number;
  lastUpdated?: string;
  typedLines?: number;
  totalLines?: number;
  percentage?: number;
}

export interface DirectoryCoverage {
  name: string;
  path: string;
  coverage: number;
  percentage: number; // Same as coverage, needed for component compatibility
  files: number;
  typedFiles: number;
  totalFiles: number; // Alias for files
  filesCovered: number; // Alias for typedFiles
  subdirectories?: DirectoryCoverage[];
  children?: DirectoryCoverage[];
  typedLines: number;
  totalLines: number;
}

export interface FileCoverage {
  name: string;
  path: string;
  coverage: number;
  percentage: number; // Same as coverage, needed for component compatibility
  anyCount: number;
  totalCount: number;
  errors: number; // Number of type errors
  linesTotal?: number; // Total lines of code
  linesCovered?: number; // Lines with proper typing
}

export interface TypeError {
  id: string;
  file: string;
  line: number;
  column: number;
  message: string;
  code: string;
  severity: 'error' | 'warning';
}

export interface TypeCoverageMetrics {
  totalCoverage: number;
  totalFiles: number;
  typedFiles: number;
  lastUpdated: string;
}

export interface ProjectCoverage {
  files: FileCoverage[];
  directories: DirectoryCoverage[];
  metrics: {
    totalCoverage: number;
    totalFiles: number;
    typedFiles: number;
  };
  overallCoverage: number;
  lastUpdated: string;
  filesCovered: number;
  filesWithIssues: number;
  typeErrors?: TypeError[];
}

// For type compatibility with hooks/admin/types.ts
export interface TypeFile {
  path: string;
  coverage: number;
  issues: number;
  linesOfCode: number;
  name: string;
  anyCount: number;
  totalCount: number;
}

// Coverage trend data
export interface CoverageTrend {
  date: string;
  percentage: number;
  files: number;
  errorsFixed?: number;
}
