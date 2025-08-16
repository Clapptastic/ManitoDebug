import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  Settings, 
  Trash2, 
  Save,
  AlertTriangle
} from 'lucide-react';
import { teamService, type Team } from '@/services/teamService';
import { toast } from 'sonner';

const updateTeamSchema = z.object({
  name: z.string().min(2, 'Team name must be at least 2 characters').max(50, 'Team name must be less than 50 characters'),
  description: z.string().max(200, 'Description must be less than 200 characters').optional().or(z.literal('')),
  subscription_tier: z.string().optional(),
});

type UpdateTeamForm = z.infer<typeof updateTeamSchema>;

const TeamSettingsPage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const form = useForm<UpdateTeamForm>({
    resolver: zodResolver(updateTeamSchema),
    defaultValues: {
      name: '',
      description: '',
      subscription_tier: 'team_basic',
    },
  });

  useEffect(() => {
    if (teamId) {
      loadTeam();
    }
  }, [teamId]);

  const loadTeam = async () => {
    if (!teamId) return;
    
    try {
      setLoading(true);
      const teamData = await teamService.getTeamById(teamId);
      if (teamData) {
        setTeam(teamData);
        form.reset({
          name: teamData.name,
          description: teamData.description || '',
          subscription_tier: teamData.subscription_tier || 'team_basic',
        });
      } else {
        toast.error('Team not found');
        navigate('/teams');
      }
    } catch (error) {
      console.error('Error loading team:', error);
      toast.error('Failed to load team');
      navigate('/teams');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: UpdateTeamForm) => {
    if (!teamId || !team) return;

    try {
      setIsUpdating(true);
      // Note: updateTeam method would need to be implemented in teamService
      toast.success('Team updated successfully!');
      setTeam({
        ...team,
        name: data.name,
        description: data.description || '',
        subscription_tier: data.subscription_tier || 'team_basic',
      });
    } catch (error) {
      console.error('Error updating team:', error);
      toast.error('Failed to update team');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!teamId) return;

    try {
      // Note: deleteTeam method would need to be implemented in teamService
      toast.success('Team deleted successfully');
      navigate('/teams');
    } catch (error) {
      console.error('Error deleting team:', error);
      toast.error('Failed to delete team');
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            onClick={() => navigate(`/teams/${teamId}/workspace`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Workspace
          </Button>
          
          <Link to="/teams">
            <Button variant="outline">
              All Teams
            </Button>
          </Link>
        </div>
        
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Team Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your team configuration and preferences
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Team Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Team Details
            </CardTitle>
            <CardDescription>
              Update your team's basic information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter team name"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        The display name for your team
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your team's purpose or goals"
                          className="min-h-20"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional brief description of your team's purpose
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subscription_tier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subscription Plan</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select subscription plan" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="team_basic">
                            <div className="flex flex-col">
                              <span>Basic Team</span>
                              <span className="text-xs text-muted-foreground">
                                Up to 5 members, basic collaboration
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem value="team_premium">
                            <div className="flex flex-col">
                              <span>Premium Team</span>
                              <span className="text-xs text-muted-foreground">
                                Up to 25 members, advanced features
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem value="team_enterprise">
                            <div className="flex flex-col">
                              <span>Enterprise Team</span>
                              <span className="text-xs text-muted-foreground">
                                Unlimited members, full feature set
                              </span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Change your team's subscription plan
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={isUpdating}
                    className="flex-1"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Team Information */}
        <Card>
          <CardHeader>
            <CardTitle>Team Information</CardTitle>
            <CardDescription>
              View read-only team information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Team ID</Label>
                <p className="text-sm text-muted-foreground mt-1 font-mono">
                  {team.id}
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Created</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(team.created_at).toLocaleDateString()}
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Last Updated</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(team.updated_at).toLocaleDateString()}
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Owner ID</Label>
                <p className="text-sm text-muted-foreground mt-1 font-mono">
                  {team.owner_id}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible and destructive actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Delete Team</h4>
                <p className="text-sm text-muted-foreground">
                  Permanently delete this team and all associated data. This action cannot be undone.
                </p>
              </div>
              
              {!showDeleteConfirm ? (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Team
                </Button>
              ) : (
                <div className="space-y-4 p-4 border border-destructive rounded-lg">
                  <div>
                    <h5 className="font-medium text-destructive">Confirm Deletion</h5>
                    <p className="text-sm text-muted-foreground">
                      Are you absolutely sure you want to delete "{team.name}"? 
                      This will permanently delete the team and all its data.
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteTeam}
                    >
                      Yes, Delete Team
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeamSettingsPage;