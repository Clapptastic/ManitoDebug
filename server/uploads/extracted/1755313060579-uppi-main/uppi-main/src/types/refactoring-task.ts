export interface RefactoringTask {
  id: string;
  name: string;
  description: string;
  status: 'completed' | 'in-progress' | 'pending' | 'blocked';
  category: 'types' | 'components' | 'features' | 'tests' | 'documentation';
  completedAt?: string;
}

export type TaskStatus = RefactoringTask['status'];
export type TaskCategory = RefactoringTask['category'];