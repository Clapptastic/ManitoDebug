
/**
 * Type definitions for refactoring tasks and related components
 */

export interface RefactoringTask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  category: string;
  priority: 'high' | 'medium' | 'low';
}

export interface RefactoringCategory {
  id: string;
  name: string;
  description?: string;
  tasks: RefactoringTask[];
}

export interface RefactoringProgress {
  total: number;
  completed: number;
  percentage: number;
  byCategory: Record<string, {
    total: number;
    completed: number;
    percentage: number;
  }>;
}

export interface RefactoringPlan {
  title: string;
  description: string;
  phases: {
    title: string;
    tasks: string[];
    completed: boolean;
  }[];
}
