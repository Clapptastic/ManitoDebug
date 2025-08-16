import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '@/hooks/admin/useAdminAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, Settings, Key, AlertCircle, CheckCircle, Clock, UserCog } from 'lucide-react';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface UserPermission {
  id: string;
  user_id: string;
  permission: string;
  granted_by: string;
  granted_at: string;
  expires_at?: string;
  metadata?: any;
  user?: {
    email: string;
    full_name?: string;
  };
  granted_by_user?: {
    email: string;
  };
}

interface UserWithRole {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  created_at: string;
  last_sign_in_at?: string;
  is_active: boolean;
  permissions_count: number;
}

interface PermissionMatrix {
  [role: string]: {
    [permission: string]: boolean;
  };
}

const AVAILABLE_PERMISSIONS = [
  'admin.read',
  'admin.write', 
  'admin.delete',
  'users.manage',
  'api_keys.manage',
  'system.configure',
  'reports.view',
  'reports.export',
  'database.query',
  'security.audit',
  'super_admin.access'
];

const ROLE_HIERARCHY = ['user', 'moderator', 'admin', 'super_admin'];

const PermissionsPage: React.FC = () => {
  const { isAuthenticated, isAdmin, isSuperAdmin, loading: authLoading } = useAdminAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [permissionMatrix, setPermissionMatrix] = useState<PermissionMatrix>({});
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedPermission, setSelectedPermission] = useState<string>('');
  const [newRole, setNewRole] = useState<string>('');
  const [isGrantDialogOpen, setIsGrantDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchUsers();
      fetchPermissions();
    } else if (isAuthenticated && !isAdmin) {
      // User is authenticated but not admin - stop loading
      setLoading(false);
    }
  }, [isAuthenticated, isAdmin]);

  const fetchUsers = async () => {
    try {
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          email,
          full_name,
          role,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Compute permission counts in one query per page load
      const userIds = (profilesData || []).map((p: any) => p.user_id).filter(Boolean);
      let countsByUser: Record<string, number> = {};
      if (userIds.length) {
        const { data: permRows } = await supabase
          .from('admin_permissions')
          .select('user_id')
          .in('user_id', userIds as string[]);
        countsByUser = (permRows || []).reduce((acc: Record<string, number>, row: any) => {
          const id = row.user_id;
          acc[id] = (acc[id] || 0) + 1;
          return acc;
        }, {});
      }

      const usersWithCounts = (profilesData || []).map((profile: any) => ({
        id: profile.user_id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        created_at: profile.created_at,
        is_active: true, // Default to true for now
        permissions_count: countsByUser[profile.user_id] || 0
      }));

      setUsers(usersWithCounts);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      });
    }
  };

  const fetchPermissions = async () => {
    try {
      const { data: perms, error } = await supabase
        .from('admin_permissions')
        .select('id, user_id, permission, granted_by, granted_at, expires_at, metadata')
        .order('granted_at', { ascending: false });

      if (error) throw error;

      const userIds = Array.from(new Set((perms || []).flatMap(p => [p.user_id, p.granted_by]).filter(Boolean)));

      let profileMap = new Map<string, { email: string; full_name?: string }>();
      if (userIds.length) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, email, full_name')
          .in('user_id', userIds as string[]);
        (profiles || []).forEach((p: any) => profileMap.set(p.user_id, { email: p.email, full_name: p.full_name }));
      }

      const permissionsWithUsers = (perms || []).map((p: any) => ({
        ...p,
        user: profileMap.get(p.user_id) || undefined,
        granted_by_user: profileMap.get(p.granted_by) ? { email: profileMap.get(p.granted_by)!.email } : undefined,
      }));

      setPermissions(permissionsWithUsers);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch permissions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const buildPermissionMatrix = () => {
    const matrix: PermissionMatrix = {};
    const now = Date.now();

    ROLE_HIERARCHY.forEach(role => {
      matrix[role] = {};
      AVAILABLE_PERMISSIONS.forEach(permission => {
        // Defaults by role (baseline)
        let allowedDefault = false;
        switch (role) {
          case 'super_admin':
            allowedDefault = true;
            break;
          case 'admin':
            allowedDefault = !permission.includes('super_admin');
            break;
          case 'moderator':
            allowedDefault = ['reports.view', 'users.manage'].includes(permission);
            break;
          default:
            allowedDefault = false;
        }

        // Dynamic override: if any user with this role has this permission explicitly granted and not expired
        const hasGrantForRole = permissions.some((p) => {
          if (p.permission !== permission) return false;
          if (p.expires_at && new Date(p.expires_at).getTime() < now) return false;
          return users.some((u) => u.id === p.user_id && u.role === role);
        });

        matrix[role][permission] = allowedDefault || hasGrantForRole;
      });
    });

    setPermissionMatrix(matrix);
  };

  // Keep matrix in sync with live data (users, permissions)
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      buildPermissionMatrix();
    }
  }, [users, permissions, isAuthenticated, isAdmin]);
  const grantPermission = async () => {
    if (!selectedUser || !selectedPermission) {
      toast({
        title: 'Error',
        description: 'Please select both user and permission',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('admin_permissions')
        .insert({
          user_id: selectedUser,
          permission: selectedPermission,
          granted_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Permission granted successfully',
      });

      setIsGrantDialogOpen(false);
      setSelectedUser('');
      setSelectedPermission('');
      fetchPermissions();
    } catch (error) {
      console.error('Error granting permission:', error);
      toast({
        title: 'Error',
        description: 'Failed to grant permission',
        variant: 'destructive',
      });
    }
  };

  const revokePermission = async (permissionId: string) => {
    try {
      const { error } = await supabase
        .from('admin_permissions')
        .delete()
        .eq('id', permissionId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Permission revoked successfully',
      });

      fetchPermissions();
    } catch (error) {
      console.error('Error revoking permission:', error);
      toast({
        title: 'Error',
        description: 'Failed to revoke permission',
        variant: 'destructive',
      });
    }
  };

  const updateUserRole = async (userId: string) => {
    if (!newRole) {
      toast({
        title: 'Error',
        description: 'Please select a role',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User role updated successfully',
      });

      setIsRoleDialogOpen(false);
      setNewRole('');
      fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
    }
  };

  if (authLoading || loading) return <LoadingSpinner />;

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You need admin privileges to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Permissions Management
          </h1>
          <p className="text-muted-foreground">
            Manage user roles and permissions across the platform
          </p>
        </div>
        
        {isSuperAdmin && (
          <Dialog open={isGrantDialogOpen} onOpenChange={setIsGrantDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Key className="h-4 w-4 mr-2" />
                Grant Permission
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Grant New Permission</DialogTitle>
                <DialogDescription>
                  Select a user and permission to grant access
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="user-select">User</Label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.email} ({user.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="permission-select">Permission</Label>
                  <Select value={selectedPermission} onValueChange={setSelectedPermission}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select permission" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_PERMISSIONS.map((permission) => (
                        <SelectItem key={permission} value={permission}>
                          {permission}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsGrantDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={grantPermission}>
                  Grant Permission
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users & Roles
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Active Permissions
          </TabsTrigger>
          <TabsTrigger value="matrix" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Permission Matrix
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user roles and view permission counts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.email}</p>
                          {user.full_name && (
                            <p className="text-sm text-muted-foreground">{user.full_name}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            user.role === 'super_admin' ? 'destructive' :
                            user.role === 'admin' ? 'default' :
                            user.role === 'moderator' ? 'secondary' : 'outline'
                          }
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? 'default' : 'secondary'}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {user.permissions_count} permissions
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {isSuperAdmin && (
                          <Dialog open={isRoleDialogOpen && selectedUser === user.id} 
                                 onOpenChange={(open) => {
                                   setIsRoleDialogOpen(open);
                                   if (open) setSelectedUser(user.id);
                                 }}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <UserCog className="h-3 w-3 mr-1" />
                                Change Role
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Change User Role</DialogTitle>
                                <DialogDescription>
                                  Update role for {user.email}
                                </DialogDescription>
                              </DialogHeader>
                              <div>
                                <Label htmlFor="role-select">New Role</Label>
                                <Select value={newRole} onValueChange={setNewRole}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {ROLE_HIERARCHY.map((role) => (
                                      <SelectItem key={role} value={role}>
                                        {role}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button onClick={() => updateUserRole(user.id)}>
                                  Update Role
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Permissions</CardTitle>
              <CardDescription>
                View and manage individual user permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Permission</TableHead>
                    <TableHead>Granted By</TableHead>
                    <TableHead>Granted At</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissions.map((permission) => (
                    <TableRow key={permission.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{permission.user?.email}</p>
                          {permission.user?.full_name && (
                            <p className="text-sm text-muted-foreground">{permission.user.full_name}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{permission.permission}</Badge>
                      </TableCell>
                      <TableCell>
                        {permission.granted_by_user?.email || 'System'}
                      </TableCell>
                      <TableCell>
                        {new Date(permission.granted_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {permission.expires_at ? (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(permission.expires_at).toLocaleDateString()}
                          </div>
                        ) : (
                          <Badge variant="outline">No expiry</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {isSuperAdmin && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => revokePermission(permission.id)}
                          >
                            Revoke
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matrix" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Permission Matrix</CardTitle>
              <CardDescription>
                Overview of default permissions by role
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Permission</th>
                      {ROLE_HIERARCHY.map(role => (
                        <th key={role} className="text-center p-2 capitalize">{role}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {AVAILABLE_PERMISSIONS.map(permission => (
                      <tr key={permission} className="border-b">
                        <td className="p-2 font-mono text-sm">{permission}</td>
                        {ROLE_HIERARCHY.map(role => (
                          <td key={`${permission}-${role}`} className="text-center p-2">
                            {permissionMatrix[role]?.[permission] ? (
                              <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PermissionsPage;