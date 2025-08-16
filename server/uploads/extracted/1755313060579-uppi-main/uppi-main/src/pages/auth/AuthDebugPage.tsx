
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { authDebugger } from '@/utils/debugging/auth-debugger';
import { supabase } from '@/integrations/supabase/client';

const AuthDebugPage: React.FC = () => {
  const { user, session, isAuthenticated, hasRole, loading } = useAuth();
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [userRoles, setUserRoles] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    setSessionHistory([]); // Initialize with empty array

    // Fetch user roles from profiles table instead
    const fetchUserRoles = async () => {
      if (!user?.id) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
        
      if (!error && data) {
        setUserRoles([{ role: data.role, created_at: new Date().toISOString() }]);
      }
    };
    
    // Set user details
    if (user) {
      setUserDetails({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_sign_in_at: user.last_sign_in_at,
        metadata: user.user_metadata,
        appMetadata: user.app_metadata
      });
      fetchUserRoles();
    }
  }, [user]);
  
  const refreshSessionHistory = () => {
    // For now, just refresh with empty array
    setSessionHistory([]);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Auth Debugging</h1>
      
      <div className="mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Authentication Status</CardTitle>
            <CardDescription>Current authentication state</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-center">
              <div>
                <Badge variant={isAuthenticated ? "success" : "destructive"}>
                  {isAuthenticated ? "Authenticated" : "Not Authenticated"}
                </Badge>
              </div>
              <div>
                <Badge variant={loading ? "default" : "outline"} className="ml-2">
                  {loading ? "Loading" : "Ready"}
                </Badge>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-auto"
                onClick={refreshSessionHistory}
              >
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="user">User</TabsTrigger>
          <TabsTrigger value="session">Session</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
              <CardDescription>Summary of authentication state</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-md">
                  <h3 className="text-lg font-medium mb-2">User</h3>
                  <p><span className="font-semibold">ID:</span> {user?.id || 'Not logged in'}</p>
                  <p><span className="font-semibold">Email:</span> {user?.email || 'Not available'}</p>
                  <p><span className="font-semibold">Created:</span> {user?.created_at ? new Date(user.created_at).toLocaleString() : 'Not available'}</p>
                </div>
                <div className="p-4 border rounded-md">
                  <h3 className="text-lg font-medium mb-2">Session</h3>
                  <p><span className="font-semibold">Active:</span> {session ? 'Yes' : 'No'}</p>
                  <p><span className="font-semibold">Expires:</span> {session?.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'Not available'}</p>
                  <p><span className="font-semibold">Has Refresh Token:</span> {session?.refresh_token ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="user">
          <Card>
            <CardHeader>
              <CardTitle>User Details</CardTitle>
              <CardDescription>Detailed user information</CardDescription>
            </CardHeader>
            <CardContent>
              {userDetails ? (
                <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded-md overflow-auto text-xs">
                  {JSON.stringify(userDetails, null, 2)}
                </pre>
              ) : (
                <p>No user logged in</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="session">
          <Card>
            <CardHeader>
              <CardTitle>Session Details</CardTitle>
              <CardDescription>Current authentication session</CardDescription>
            </CardHeader>
            <CardContent>
              {session ? (
                <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded-md overflow-auto text-xs">
                  {JSON.stringify({
                    expires_at: session.expires_at,
                    access_token_partial: session.access_token?.substring(0, 20) + '...',
                    refresh_token_available: !!session.refresh_token,
                  }, null, 2)}
                </pre>
              ) : (
                <p>No active session</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Auth Events</CardTitle>
              <CardDescription>Recent authentication events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 overflow-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Event</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {sessionHistory.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">No auth events recorded</td>
                      </tr>
                    ) : (
                      sessionHistory.map((event, idx) => (
                        <tr key={idx}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-200">
                            {event.event}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <Badge variant={event.authenticated ? "success" : "destructive"}>
                              {event.authenticated ? "Auth" : "Unauth"}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle>User Roles</CardTitle>
              <CardDescription>Assigned roles and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              {userRoles.length > 0 ? (
                <div>
                  <h3 className="text-lg font-medium mb-2">Assigned Roles</h3>
                  <ul className="list-disc pl-5 mb-4">
                    {userRoles.map((role, idx) => (
                      <li key={idx} className="mb-2">
                        <Badge className="mr-2">{role.role}</Badge>
                        <span className="text-sm text-gray-500">
                          (since {new Date(role.created_at).toLocaleDateString()})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p>No roles assigned to current user</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AuthDebugPage;
