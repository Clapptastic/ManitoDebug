/**
 * MVP Builder Service
 * Handles MVP project creation, management, and progress tracking
 */

import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type MVPProject = Database['public']['Tables']['mvp_projects']['Row'];
type MVPProjectInsert = Database['public']['Tables']['mvp_projects']['Insert'];
type MVPProjectUpdate = Database['public']['Tables']['mvp_projects']['Update'];

export interface MVPTemplate {
  id: string;
  name: string;
  description: string;
  category: 'saas' | 'ecommerce' | 'mobile_app' | 'marketplace' | 'content_platform';
  features: string[];
  techStack: string[];
  estimatedTimeWeeks: number;
  complexity: 'simple' | 'moderate' | 'complex';
  icon: string;
}

export interface MVPMetrics {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  averageCompletionTime: number;
}

export class MVPBuilderService {
  /**
   * Get all MVP projects for the current user
   */
  static async getUserProjects(): Promise<MVPProject[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('mvp_projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching MVP projects:', error);
      throw new Error(`Failed to fetch MVP projects: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Create a new MVP project
   */
  static async createProject(projectData: {
    name: string;
    description?: string;
    template?: string;
    metadata?: any;
  }): Promise<MVPProject> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('mvp_projects')
      .insert({
        user_id: user.id,
        name: projectData.name,
        description: projectData.description,
        status: 'draft',
        metadata: {
          template: projectData.template,
          createdWith: 'mvp-builder',
          ...projectData.metadata
        }
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating MVP project:', error);
      throw new Error(`Failed to create MVP project: ${error.message}`);
    }

    return data;
  }

  /**
   * Update MVP project
   */
  static async updateProject(projectId: string, updates: MVPProjectUpdate): Promise<MVPProject> {
    const { data, error } = await supabase
      .from('mvp_projects')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .select()
      .single();

    if (error) {
      console.error('Error updating MVP project:', error);
      throw new Error(`Failed to update MVP project: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete MVP project
   */
  static async deleteProject(projectId: string): Promise<void> {
    const { error } = await supabase
      .from('mvp_projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      console.error('Error deleting MVP project:', error);
      throw new Error(`Failed to delete MVP project: ${error.message}`);
    }
  }

  /**
   * Get MVP metrics for the current user
   */
  static async getMVPMetrics(): Promise<MVPMetrics> {
    const projects = await this.getUserProjects();
    
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'in_progress' || p.status === 'planning').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    
    // Calculate average completion time (simplified)
    const completedWithDates = projects.filter(p => 
      p.status === 'completed' && p.created_at && p.updated_at
    );
    
    let averageCompletionTime = 0;
    if (completedWithDates.length > 0) {
      const totalTime = completedWithDates.reduce((sum, project) => {
        const start = new Date(project.created_at).getTime();
        const end = new Date(project.updated_at).getTime();
        return sum + (end - start);
      }, 0);
      
      averageCompletionTime = Math.round(totalTime / completedWithDates.length / (1000 * 60 * 60 * 24)); // days
    }

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      averageCompletionTime
    };
  }

  /**
   * Get available MVP templates
   */
  static getMVPTemplates(): MVPTemplate[] {
    return [
      {
        id: 'saas-dashboard',
        name: 'SaaS Dashboard',
        description: 'Complete SaaS platform with user management, billing, and analytics',
        category: 'saas',
        features: ['User Authentication', 'Dashboard', 'Billing Integration', 'Analytics', 'API Management'],
        techStack: ['React', 'Node.js', 'PostgreSQL', 'Stripe'],
        estimatedTimeWeeks: 8,
        complexity: 'complex',
        icon: '💼'
      },
      {
        id: 'ecommerce-store',
        name: 'E-commerce Store',
        description: 'Online store with product catalog, cart, and payment processing',
        category: 'ecommerce',
        features: ['Product Catalog', 'Shopping Cart', 'Payment Processing', 'Order Management', 'Inventory'],
        techStack: ['React', 'Node.js', 'PostgreSQL', 'Stripe'],
        estimatedTimeWeeks: 6,
        complexity: 'moderate',
        icon: '🛍️'
      },
      {
        id: 'mobile-app',
        name: 'Mobile App',
        description: 'Cross-platform mobile application with native features',
        category: 'mobile_app',
        features: ['User Authentication', 'Push Notifications', 'Offline Storage', 'Camera Integration'],
        techStack: ['React Native', 'Firebase', 'Redux'],
        estimatedTimeWeeks: 10,
        complexity: 'complex',
        icon: '📱'
      },
      {
        id: 'marketplace',
        name: 'Marketplace Platform',
        description: 'Two-sided marketplace connecting buyers and sellers',
        category: 'marketplace',
        features: ['Vendor Management', 'Product Listings', 'Review System', 'Commission Tracking'],
        techStack: ['React', 'Node.js', 'PostgreSQL', 'Redis'],
        estimatedTimeWeeks: 12,
        complexity: 'complex',
        icon: '🏪'
      },
      {
        id: 'content-platform',
        name: 'Content Platform',
        description: 'Content management and publishing platform',
        category: 'content_platform',
        features: ['Content Editor', 'Publishing Workflow', 'SEO Tools', 'Analytics'],
        techStack: ['React', 'Node.js', 'MongoDB', 'AWS S3'],
        estimatedTimeWeeks: 4,
        complexity: 'simple',
        icon: '📝'
      }
    ];
  }

  /**
   * Generate MVP roadmap based on template
   */
  static generateRoadmap(template: MVPTemplate): Array<{
    phase: string;
    duration: string;
    tasks: string[];
    deliverables: string[];
  }> {
    const baseRoadmap = [
      {
        phase: 'Planning & Design',
        duration: '1-2 weeks',
        tasks: [
          'Define user personas and user stories',
          'Create wireframes and mockups',
          'Plan database schema',
          'Set up development environment'
        ],
        deliverables: ['User Stories', 'Wireframes', 'Technical Specification']
      },
      {
        phase: 'Core Development',
        duration: `${Math.floor(template.estimatedTimeWeeks * 0.6)} weeks`,
        tasks: [
          'Implement core features',
          'Set up authentication system',
          'Create main user interfaces',
          'Implement core business logic'
        ],
        deliverables: ['Core Features', 'User Authentication', 'Basic UI']
      },
      {
        phase: 'Integration & Testing',
        duration: `${Math.floor(template.estimatedTimeWeeks * 0.3)} weeks`,
        tasks: [
          'Integrate third-party services',
          'Implement payment processing',
          'Conduct thorough testing',
          'Fix bugs and optimize performance'
        ],
        deliverables: ['Integrated Features', 'Payment System', 'Tested Application']
      },
      {
        phase: 'Launch Preparation',
        duration: '1 week',
        tasks: [
          'Deploy to production environment',
          'Set up monitoring and analytics',
          'Create user documentation',
          'Plan launch strategy'
        ],
        deliverables: ['Production Deployment', 'Documentation', 'Launch Plan']
      }
    ];

    return baseRoadmap;
  }
}