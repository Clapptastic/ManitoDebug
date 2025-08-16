import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users, 
  Settings, 
  Plus, 
  Mail, 
  ArrowLeft,
  UserPlus,
  MoreHorizontal,
  Activity,
  MessageSquare,
  Calendar,
  FileText
} from 'lucide-react';
import { teamService, type Team, type TeamMember } from '@/services/teamService';
import { toast } from 'sonner';

const TeamWorkspacePage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [showInviteForm, setShowInviteForm] = useState(false);

  useEffect(() => {
    if (teamId) {
      loadTeamData();
    }
  }, [teamId]);

  const loadTeamData = async () => {
    if (!teamId) return;
    
    try {
      setLoading(true);
      const [teamData, membersData] = await Promise.all([
        teamService.getTeamById(teamId),
        teamService.getTeamMembers(teamId)
      ]);
      
      setTeam(teamData);
      setMembers(membersData);
    } catch (error) {
      console.error('Error loading team data:', error);
      toast.error('Failed to load team data');
      navigate('/teams');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId || !inviteEmail.trim()) return;

    try {
      await teamService.inviteTeamMember(teamId, inviteEmail.trim(), inviteRole);
      toast.success('Invitation sent successfully!');
      setInviteEmail('');
      setShowInviteForm(false);
    } catch (error) {
      console.error('Error inviting member:', error);
      toast.error('Failed to send invitation');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'member': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground">Team not found</p>
              <Link to="/teams">
                <Button className="mt-4">Back to Teams</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/teams')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Teams
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{team.name}</h1>
            {team.description && (
              <p className="text-muted-foreground mt-2">{team.description}</p>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <Badge className="bg-blue-100 text-blue-800">
              {team.subscription_tier?.replace('team_', '').replace('_', ' ') || 'Basic'}
            </Badge>
            <Link to={`/teams/${teamId}/settings`}>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-20 flex-col">
                  <MessageSquare className="h-6 w-6 mb-2" />
                  <span className="text-sm">Messages</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Calendar className="h-6 w-6 mb-2" />
                  <span className="text-sm">Calendar</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <FileText className="h-6 w-6 mb-2" />
                  <span className="text-sm">Documents</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col"
                  onClick={() => setShowInviteForm(!showInviteForm)}
                >
                  <UserPlus className="h-6 w-6 mb-2" />
                  <span className="text-sm">Invite</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Invite Member Form */}
          {showInviteForm && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Invite Team Member
                </CardTitle>
                <CardDescription>
                  Send an invitation to join this team
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleInviteMember} className="space-y-4">
                  <div>
                    <Label htmlFor="invite-email">Email Address</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      placeholder="colleague@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="invite-role">Role</Label>
                    <select
                      id="invite-role"
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button type="submit">Send Invitation</Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setShowInviteForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
                <p className="text-sm">Team activities will appear here</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Team Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Members
                </div>
                <Badge variant="secondary">{members.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">User {member.user_id.slice(-8)}</p>
                        <p className="text-xs text-muted-foreground">
                          Joined {new Date(member.joined_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge className={getRoleColor(member.role)}>
                      {member.role}
                    </Badge>
                  </div>
                ))}
                
                {members.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    <Users className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No members yet</p>
                  </div>
                )}
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-4"
                onClick={() => setShowInviteForm(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            </CardContent>
          </Card>

          {/* Team Info */}
          <Card>
            <CardHeader>
              <CardTitle>Team Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Created</Label>
                <p className="text-sm">
                  {new Date(team.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Subscription</Label>
                <p className="text-sm capitalize">
                  {team.subscription_tier?.replace('team_', '').replace('_', ' ') || 'Basic'}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Members</Label>
                <p className="text-sm">{members.length} active</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TeamWorkspacePage;