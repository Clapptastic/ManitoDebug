import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Users } from 'lucide-react';
import { teamService } from '@/services/teamService';
import { toast } from 'sonner';

const createTeamSchema = z.object({
  name: z.string().min(2, 'Team name must be at least 2 characters').max(50, 'Team name must be less than 50 characters'),
  description: z.string().max(200, 'Description must be less than 200 characters').optional().or(z.literal('')),
  subscription_tier: z.string().optional(),
});

type CreateTeamForm = z.infer<typeof createTeamSchema>;

const CreateTeamPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateTeamForm>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: '',
      description: '',
      subscription_tier: 'team_basic',
    },
  });

  const onSubmit = async (data: CreateTeamForm) => {
    try {
      setIsSubmitting(true);
      const teamData = {
        name: data.name || '',
        description: data.description || '',
        subscription_tier: data.subscription_tier || 'team_basic',
      };
      const team = await teamService.createTeam(teamData);
      toast.success('Team created successfully!');
      navigate(`/teams/${team.id}/workspace`);
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error('Failed to create team. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/teams')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Teams
        </Button>
        
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Create New Team</h1>
          <p className="text-muted-foreground mt-2">
            Set up a team workspace for collaboration
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Details
          </CardTitle>
          <CardDescription>
            Provide basic information about your team
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
                      Choose a clear, descriptive name for your team
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      You can upgrade your plan later if needed
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/teams')}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? 'Creating...' : 'Create Team'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateTeamPage;