import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Users, 
  Shield, 
  Eye, 
  EyeOff, 
  Save, 
  RefreshCw,
  Lock,
  Unlock,
  UserCheck,
  UserX
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { usePermissionsManagement, FrontendPermission } from '@/hooks/useFrontendPermissions';

interface FeatureGroup {
  name: string;
  description: string;
  features: {
    name: string;
    description: string;
    component_path: string;
    defaultPermissions: {
      user: { visible: boolean; enabled: boolean };
      admin: { visible: boolean; enabled: boolean };
      super_admin: { visible: boolean; enabled: boolean };
    };
  }[];
}

const FEATURE_GROUPS: FeatureGroup[] = [
  {
    name: "Dashboard & Analytics",
    description: "Main dashboard and analytics features",
    features: [
      {
        name: "Main Dashboard",
        description: "Primary dashboard with overview widgets",
        component_path: "/dashboard",
        defaultPermissions: {
          user: { visible: true, enabled: true },
          admin: { visible: true, enabled: true },
          super_admin: { visible: true, enabled: true }
        }
      },
      {
        name: "Analytics Page",
        description: "Detailed analytics and reports",
        component_path: "/analytics",
        defaultPermissions: {
          user: { visible: false, enabled: false },
          admin: { visible: true, enabled: true },
          super_admin: { visible: true, enabled: true }
        }
      },
      {
        name: "Performance Metrics",
        description: "System performance monitoring",
        component_path: "/performance",
        defaultPermissions: {
          user: { visible: false, enabled: false },
          admin: { visible: true, enabled: false },
          super_admin: { visible: true, enabled: true }
        }
      }
    ]
  },
  {
    name: "Market Research",
    description: "Market validation and competitor analysis tools",
    features: [
      {
        name: "Competitor Analysis",
        description: "AI-powered competitor research",
        component_path: "/market-research/competitor-analysis",
        defaultPermissions: {
          user: { visible: true, enabled: true },
          admin: { visible: true, enabled: true },
          super_admin: { visible: true, enabled: true }
        }
      },
      {
        name: "Market Validation",
        description: "Market validation tools and surveys",
        component_path: "/market-research/validation",
        defaultPermissions: {
          user: { visible: true, enabled: true },
          admin: { visible: true, enabled: true },
          super_admin: { visible: true, enabled: true }
        }
      },
      {
        name: "Master Company Profiles",
        description: "Consolidated company intelligence",
        component_path: "/admin/master-profiles",
        defaultPermissions: {
          user: { visible: false, enabled: false },
          admin: { visible: false, enabled: false },
          super_admin: { visible: true, enabled: true }
        }
      }
    ]
  },
  {
    name: "AI Tools",
    description: "AI-powered business tools",
    features: [
      {
        name: "AI Chatbot",
        description: "Business guidance chatbot",
        component_path: "/chat",
        defaultPermissions: {
          user: { visible: true, enabled: true },
          admin: { visible: true, enabled: true },
          super_admin: { visible: true, enabled: true }
        }
      },
      {
        name: "Business Plan Generator",
        description: "AI-assisted business plan creation",
        component_path: "/business-plan",
        defaultPermissions: {
          user: { visible: true, enabled: true },
          admin: { visible: true, enabled: true },
          super_admin: { visible: true, enabled: true }
        }
      },
      {
        name: "Document Analysis",
        description: "AI document processing and insights",
        component_path: "/document-analysis",
        defaultPermissions: {
          user: { visible: true, enabled: false },
          admin: { visible: true, enabled: true },
          super_admin: { visible: true, enabled: true }
        }
      }
    ]
  },
  {
    name: "Admin Tools",
    description: "Administrative and management features",
    features: [
      {
        name: "User Management",
        description: "Manage users and roles",
        component_path: "/admin/user-management",
        defaultPermissions: {
          user: { visible: false, enabled: false },
          admin: { visible: true, enabled: true },
          super_admin: { visible: true, enabled: true }
        }
      },
      {
        name: "API Management",
        description: "API keys and integrations",
        component_path: "/admin/api-management",
        defaultPermissions: {
          user: { visible: false, enabled: false },
          admin: { visible: true, enabled: true },
          super_admin: { visible: true, enabled: true }
        }
      },
      {
        name: "System Health",
        description: "System monitoring and health checks",
        component_path: "/admin/system-health",
        defaultPermissions: {
          user: { visible: false, enabled: false },
          admin: { visible: true, enabled: false },
          super_admin: { visible: true, enabled: true }
        }
      },
      {
        name: "Security Audit",
        description: "Security monitoring and audit logs",
        component_path: "/admin/security",
        defaultPermissions: {
          user: { visible: false, enabled: false },
          admin: { visible: false, enabled: false },
          super_admin: { visible: true, enabled: true }
        }
      }
    ]
  }
];

export default function PermissionsManagement() {
  const {
    allPermissions,
    loading,
    saving,
    error,
    updatePermission,
    saveAllPermissions,
    resetToDefaults,
    refreshPermissions
  } = usePermissionsManagement();
  
  const [activeRole, setActiveRole] = useState<'user' | 'admin' | 'super_admin'>('user');
  const { toast } = useToast();

  const handleUpdatePermission = async (
    role: string, 
    componentPath: string, 
    field: 'is_visible' | 'is_enabled', 
    value: boolean
  ) => {
    const success = await updatePermission(role, componentPath, field, value);
    if (success) {
      toast({
        title: "Permission Updated",
        description: `${field.replace('is_', '').replace('_', ' ')} setting updated successfully`,
      });
    } else {
      toast({
        title: "Update Failed",
        description: "Failed to update permission setting",
        variant: "destructive"
      });
    }
  };
  const handleSavePermissions = async () => {
    const success = await saveAllPermissions();
    if (success) {
      toast({
        title: "Success",
        description: "All permissions saved successfully",
      });
    } else {
      toast({
        title: "Save Failed", 
        description: "Failed to save permissions",
        variant: "destructive"
      });
    }
  };

  const handleResetToDefaults = async () => {
    await refreshPermissions();
    toast({
      title: "Reset Complete",
      description: "Permissions refreshed from database",
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'user': return <Users className="h-4 w-4" />;
      case 'admin': return <UserCheck className="h-4 w-4" />;
      case 'super_admin': return <Shield className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'user': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'admin': return 'bg-green-100 text-green-800 border-green-200';
      case 'super_admin': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Permissions Management</h1>
          <p className="text-muted-foreground">
            Control what features different user roles can see and access
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleResetToDefaults} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh from Database
          </Button>
          <Button onClick={handleSavePermissions} disabled={saving} size="sm">
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Role Tabs */}
      <Tabs value={activeRole} onValueChange={(value) => setActiveRole(value as any)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="user" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="admin" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Admins
          </TabsTrigger>
          <TabsTrigger value="super_admin" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Super Admins
          </TabsTrigger>
        </TabsList>

        {['user', 'admin', 'super_admin'].map(role => (
          <TabsContent key={role} value={role} className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getRoleIcon(role)}
                      <CardTitle className="capitalize">{role.replace('_', ' ')} Permissions</CardTitle>
                    </div>
                    <Badge className={getRoleColor(role)}>
                      {role.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {allPermissions.get(role)?.filter(p => p.is_visible).length || 0} features visible
                  </div>
                </div>
                <CardDescription>
                  Configure what features and pages {role.replace('_', ' ')} users can see and interact with
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature Groups */}
            <div className="grid gap-6">
              {FEATURE_GROUPS.map(group => (
                <Card key={group.name}>
                  <CardHeader>
                    <CardTitle className="text-lg">{group.name}</CardTitle>
                    <CardDescription>{group.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {group.features.map(feature => {
                        const permission = allPermissions.get(role)?.find(p => p.component_path === feature.component_path);
                        return (
                          <div key={feature.component_path} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <h4 className="font-medium">{feature.name}</h4>
                                <div className="flex items-center gap-2">
                                  {permission?.is_visible ? (
                                    <Badge variant="outline" className="text-xs gap-1">
                                      <Eye className="h-3 w-3" />
                                      Visible
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-xs gap-1">
                                      <EyeOff className="h-3 w-3" />
                                      Hidden
                                    </Badge>
                                  )}
                                  {permission?.is_enabled ? (
                                    <Badge variant="outline" className="text-xs gap-1">
                                      <Unlock className="h-3 w-3" />
                                      Enabled
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-xs gap-1">
                                      <Lock className="h-3 w-3" />
                                      Disabled
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
                              <p className="text-xs text-muted-foreground mt-1">{feature.component_path}</p>
                            </div>
                            
                            <div className="flex items-center gap-6 ml-4">
                              <div className="flex items-center gap-2">
                                <label className="text-sm font-medium">Visible</label>
                                <Switch
                                  checked={permission?.is_visible || false}
                                  onCheckedChange={(checked) => 
                                    handleUpdatePermission(role, feature.component_path, 'is_visible', checked)
                                  }
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <label className="text-sm font-medium">Enabled</label>
                                <Switch
                                  checked={permission?.is_enabled || false}
                                  onCheckedChange={(checked) => 
                                    handleUpdatePermission(role, feature.component_path, 'is_enabled', checked)
                                  }
                                  disabled={!permission?.is_visible}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}