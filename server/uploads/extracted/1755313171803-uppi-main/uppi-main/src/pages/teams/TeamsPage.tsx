import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Settings, Crown, UserCheck } from 'lucide-react';
import { teamService, type Team } from '@/services/teamService';
import { toast } from 'sonner';

const TeamsPage: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const userTeams = await teamService.getUserTeams();
      setTeams(userTeams);
    } catch (error) {
      console.error('Error loading teams:', error);
      toast.error('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const getSubscriptionTierColor = (tier: string) => {
    switch (tier) {
      case 'team_basic': return 'bg-blue-100 text-blue-800';
      case 'team_premium': return 'bg-purple-100 text-purple-800';
      case 'team_enterprise': return 'bg-gold-100 text-gold-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSubscriptionTierLabel = (tier: string) => {
    switch (tier) {
      case 'team_basic': return 'Basic';
      case 'team_premium': return 'Premium';
      case 'team_enterprise': return 'Enterprise';
      default: return tier;
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Teams</h1>
          <p className="text-muted-foreground mt-2">
            Collaborate with your team members on business projects
          </p>
        </div>
        <Link to="/teams/create">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Team
          </Button>
        </Link>
      </div>

      {teams.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No teams yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first team to start collaborating with others
            </p>
            <Link to="/teams/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Team
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <Card key={team.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      {team.name}
                    </CardTitle>
                    {team.description && (
                      <CardDescription className="mt-2">
                        {team.description}
                      </CardDescription>
                    )}
                  </div>
                  <Link to={`/teams/${team.id}/settings`}>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge className={getSubscriptionTierColor(team.subscription_tier)}>
                      {getSubscriptionTierLabel(team.subscription_tier)}
                    </Badge>
                    {team.owner_id && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Crown className="h-3 w-3" />
                        Owner
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Link 
                      to={`/teams/${team.id}/workspace`}
                      className="flex-1"
                    >
                      <Button variant="outline" className="w-full">
                        <UserCheck className="h-4 w-4 mr-2" />
                        Open Workspace
                      </Button>
                    </Link>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Created {new Date(team.created_at).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamsPage;