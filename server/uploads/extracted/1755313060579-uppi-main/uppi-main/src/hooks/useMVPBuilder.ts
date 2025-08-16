import { useState, useCallback } from 'react';
import { MVPBuilderService } from '@/services/mvpBuilderService';
import { useToast } from '@/hooks/use-toast';

export const useMVPBuilder = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [currentProject, setCurrentProject] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await MVPBuilderService.getUserProjects();
      setProjects(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load projects';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const createProject = useCallback(async (projectData: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await MVPBuilderService.createProject({
        name: projectData.title || projectData.name,
        description: projectData.description,
        template: projectData.template,
        metadata: projectData.metadata
      });
      await loadProjects();
      toast({
        title: "Success",
        description: "MVP project created successfully"
      });
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create project';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [loadProjects, toast]);

  const updateProject = useCallback(async (projectId: string, updates: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await MVPBuilderService.updateProject(projectId, updates);
      await loadProjects();
      if (currentProject?.id === projectId) {
        setCurrentProject(data);
      }
      toast({
        title: "Success",
        description: "Project updated successfully"
      });
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update project';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentProject, loadProjects, toast]);

  const deleteProject = useCallback(async (projectId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await MVPBuilderService.deleteProject(projectId);
      await loadProjects();
      if (currentProject?.id === projectId) {
        setCurrentProject(null);
      }
      toast({
        title: "Success",
        description: "Project deleted successfully"
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete project';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentProject, loadProjects, toast]);

  return {
    // State
    projects,
    currentProject,
    isLoading,
    error,

    // Actions
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
    setCurrentProject
  };
};