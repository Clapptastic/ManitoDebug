import React, { useState } from 'react';
import { useTeamCollaboration } from '@/hooks/useTeamCollaboration';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Users, Mail, Building2 } from 'lucide-react';
import { toast } from 'sonner';

const TeamCollaborationPage: React.FC = () => {
  const {
    teams,
    selectedTeam,
    teamMembers,
    teamInvitations,
    userInvitations,
    teamWorkspaces,
    isLoading,
    selectTeam,
    createTeam,
    inviteTeamMember,
    acceptInvitation,
    createWorkspace
  } = useTeamCollaboration();

  // Form states
  const [createTeamForm, setCreateTeamForm] = useState({ name: '', description: '' });
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'member' });
  const [workspaceForm, setWorkspaceForm] = useState({ name: '', description: '', workspace_type: 'general' });
  
  // Dialog states
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showInviteMember, setShowInviteMember] = useState(false);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);

  const handleCreateTeam = async () => {
    if (!createTeamForm.name.trim()) {
      toast.error('Team name is required');
      return;
    }

    const team = await createTeam(createTeamForm);
    if (team) {
      setCreateTeamForm({ name: '', description: '' });
      setShowCreateTeam(false);
    }
  };

  const handleInviteMember = async () => {
    if (!selectedTeam) {
      toast.error('Please select a team first');
      return;
    }

    if (!inviteForm.email.trim()) {
      toast.error('Email is required');
      return;
    }

    const success = await inviteTeamMember({
      team_id: selectedTeam.id,
      email: inviteForm.email,
      role: inviteForm.role
    });

    if (success) {
      setInviteForm({ email: '', role: 'member' });
      setShowInviteMember(false);
    }
  };

  const handleCreateWorkspace = async () => {
    if (!selectedTeam) {
      toast.error('Please select a team first');
      return;
    }

    if (!workspaceForm.name.trim()) {
      toast.error('Workspace name is required');
      return;
    }

    const workspace = await createWorkspace({
      team_id: selectedTeam.id,
      ...workspaceForm
    });

    if (workspace) {
      setWorkspaceForm({ name: '', description: '', workspace_type: 'general' });
      setShowCreateWorkspace(false);
    }
  };

  const handleAcceptInvitation = async (token: string) => {
    await acceptInvitation(token);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Team Collaboration</h1>
        <p className="text-muted-foreground">Manage your teams, invite members, and create shared workspaces.</p>
      </div>

      {/* User Invitations */}
      {userInvitations.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Pending Invitations
            </CardTitle>
            <CardDescription>You have been invited to join these teams</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userInvitations.map((invitation: any) => (
                <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{invitation.teams?.name || 'Unknown Team'}</h4>
                    <p className="text-sm text-muted-foreground">Role: {invitation.role}</p>
                  </div>
                  <Button onClick={() => handleAcceptInvitation(invitation.token)}>
                    Accept
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Teams Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Teams
                </CardTitle>
                <Dialog open={showCreateTeam} onOpenChange={setShowCreateTeam}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Team</DialogTitle>
                      <DialogDescription>Set up a new team for collaboration</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="team-name">Team Name</Label>
                        <Input
                          id="team-name"
                          value={createTeamForm.name}
                          onChange={(e) => setCreateTeamForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter team name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="team-description">Description (Optional)</Label>
                        <Textarea
                          id="team-description"
                          value={createTeamForm.description}
                          onChange={(e) => setCreateTeamForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Enter team description"
                        />
                      </div>
                      <Button onClick={handleCreateTeam} className="w-full">
                        Create Team
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {teams.map((team) => (
                  <div
                    key={team.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedTeam?.id === team.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => selectTeam(team)}
                  >
                    <h4 className="font-medium">{team.name}</h4>
                    {team.description && (
                      <p className="text-sm opacity-75">{team.description}</p>
                    )}
                    <Badge variant="secondary" className="mt-1">
                      {team.subscription_tier}
                    </Badge>
                  </div>
                ))}
                {teams.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    No teams yet. Create your first team!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          {selectedTeam ? (
            <Tabs defaultValue="members" className="space-y-4">
              <TabsList>
                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="invitations">Invitations</TabsTrigger>
                <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
              </TabsList>

              <TabsContent value="members">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Team Members</CardTitle>
                      <Dialog open={showInviteMember} onOpenChange={setShowInviteMember}>
                        <DialogTrigger asChild>
                          <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Invite Member
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Invite Team Member</DialogTitle>
                            <DialogDescription>Send an invitation to join {selectedTeam.name}</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="invite-email">Email Address</Label>
                              <Input
                                id="invite-email"
                                type="email"
                                value={inviteForm.email}
                                onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                                placeholder="Enter email address"
                              />
                            </div>
                            <div>
                              <Label htmlFor="invite-role">Role</Label>
                              <select
                                id="invite-role"
                                value={inviteForm.role}
                                onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value }))}
                                className="w-full p-2 border rounded-md"
                              >
                                <option value="member">Member</option>
                                <option value="admin">Admin</option>
                                <option value="manager">Manager</option>
                              </select>
                            </div>
                            <Button onClick={handleInviteMember} className="w-full">
                              Send Invitation
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {teamMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">User ID: {member.user_id}</p>
                            <p className="text-sm text-muted-foreground">Role: {member.role}</p>
                            <p className="text-sm text-muted-foreground">
                              Joined: {new Date(member.joined_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
                            {member.role}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="invitations">
                <Card>
                  <CardHeader>
                    <CardTitle>Pending Invitations</CardTitle>
                    <CardDescription>Members who have been invited but haven't joined yet</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {teamInvitations.map((invitation) => (
                        <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{invitation.email}</p>
                            <p className="text-sm text-muted-foreground">Role: {invitation.role}</p>
                            <p className="text-sm text-muted-foreground">
                              Expires: {new Date(invitation.expires_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={invitation.status === 'pending' ? 'outline' : 'secondary'}>
                            {invitation.status}
                          </Badge>
                        </div>
                      ))}
                      {teamInvitations.length === 0 && (
                        <p className="text-muted-foreground text-center py-4">
                          No pending invitations
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="workspaces">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Shared Workspaces</CardTitle>
                      <Dialog open={showCreateWorkspace} onOpenChange={setShowCreateWorkspace}>
                        <DialogTrigger asChild>
                          <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Workspace
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Create Shared Workspace</DialogTitle>
                            <DialogDescription>Create a new workspace for team collaboration</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="workspace-name">Workspace Name</Label>
                              <Input
                                id="workspace-name"
                                value={workspaceForm.name}
                                onChange={(e) => setWorkspaceForm(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Enter workspace name"
                              />
                            </div>
                            <div>
                              <Label htmlFor="workspace-description">Description (Optional)</Label>
                              <Textarea
                                id="workspace-description"
                                value={workspaceForm.description}
                                onChange={(e) => setWorkspaceForm(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Enter workspace description"
                              />
                            </div>
                            <div>
                              <Label htmlFor="workspace-type">Type</Label>
                              <select
                                id="workspace-type"
                                value={workspaceForm.workspace_type}
                                onChange={(e) => setWorkspaceForm(prev => ({ ...prev, workspace_type: e.target.value }))}
                                className="w-full p-2 border rounded-md"
                              >
                                <option value="general">General</option>
                                <option value="project">Project</option>
                                <option value="research">Research</option>
                                <option value="development">Development</option>
                              </select>
                            </div>
                            <Button onClick={handleCreateWorkspace} className="w-full">
                              Create Workspace
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {teamWorkspaces.map((workspace) => (
                        <div key={workspace.id} className="p-4 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Building2 className="h-5 w-5" />
                            <h4 className="font-medium">{workspace.name}</h4>
                            <Badge variant="outline">{workspace.workspace_type}</Badge>
                          </div>
                          {workspace.description && (
                            <p className="text-sm text-muted-foreground mb-2">{workspace.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Created: {new Date(workspace.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                      {teamWorkspaces.length === 0 && (
                        <p className="text-muted-foreground text-center py-4">
                          No workspaces yet. Create your first workspace!
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Select a Team</h3>
                  <p className="text-muted-foreground">Choose a team from the sidebar to manage members and workspaces</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamCollaborationPage;