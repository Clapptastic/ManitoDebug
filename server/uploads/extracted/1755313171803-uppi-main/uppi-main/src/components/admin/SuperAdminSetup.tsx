import React from 'react';
import useAuthContext from '@/hooks/auth/useAuthContext';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Users, Settings } from 'lucide-react';

const SuperAdminSetup: React.FC = () => {
  // Access current session to send as Bearer token (if available)
  const { session } = useAuthContext();

  /**
   * Promote a user to super_admin by calling the edge function.
   * Defaults to 'perryrjohnson7@gmail.com' as requested.
   */
  const handleAddSuperAdmin = async () => {
    try {
      const defaultEmail = 'perryrjohnson7@gmail.com';
      const email = window.prompt(
        'Enter email to promote to super admin',
        defaultEmail
      );
      if (!email) return;

      const res = await fetch(
        'https://jqbdjttdaihidoyalqvs.supabase.co/functions/v1/set-super-admin',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token
              ? { Authorization: `Bearer ${session.access_token}` }
              : {})
          },
          body: JSON.stringify({ targetEmail: email })
        }
      );

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || json?.message || 'Failed to set super admin');
      }

      toast.success(`Super admin granted to ${email}`);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to set super admin');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Super Admin Status
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active</div>
            <Badge variant="default" className="mt-2">
              Enabled
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Admin Users
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">
              Active administrators
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Permissions
            </CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Full</div>
            <p className="text-xs text-muted-foreground">
              All system access
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Super Admin Configuration</CardTitle>
          <CardDescription>
            Configure super admin settings and permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Current Super Admins</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 border rounded">
                <span>akclapp@gmail.com</span>
                <Badge variant="default">Super Admin</Badge>
              </div>
              <div className="flex items-center justify-between p-2 border rounded">
                <span>samdyer27@gmail.com</span>
                <Badge variant="default">Super Admin</Badge>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleAddSuperAdmin}>
              Add Super Admin
            </Button>
            <Button variant="outline">
              Update Permissions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperAdminSetup;