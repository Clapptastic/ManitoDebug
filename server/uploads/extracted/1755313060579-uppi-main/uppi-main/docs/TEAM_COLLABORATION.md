# Team Collaboration Feature Documentation

## Overview

The Team Collaboration feature enables users to create teams, invite members, assign roles, and collaborate on shared workspaces within the platform. This feature provides comprehensive team management with role-based access control.

## Features

### Team Management
- **Team Creation**: Users can create new teams with customizable names and descriptions
- **Member Invitations**: Send email invitations to new team members
- **Role Management**: Assign roles (owner, admin, member) with specific permissions
- **Team Settings**: Configure team preferences and subscription tiers

### Workspace Collaboration
- **Shared Workspaces**: Create collaborative spaces for team projects
- **Real-time Collaboration**: Work together on analyses and projects
- **Access Control**: Workspace permissions based on team membership

### User Interface
- **Team Dashboard**: Central hub for team management
- **Member Management**: View and manage team members
- **Invitation System**: Track pending and accepted invitations
- **Navigation Integration**: Teams accessible via main navigation

## Database Schema

### Core Tables

#### `teams`
- `id`: Unique team identifier
- `name`: Team display name
- `description`: Optional team description
- `owner_id`: User ID of team owner
- `subscription_tier`: Team subscription level
- `settings`: Team configuration (JSONB)
- `created_at`, `updated_at`: Timestamps

#### `team_members`
- `id`: Unique member record identifier
- `team_id`: Reference to teams table
- `user_id`: Reference to user
- `role`: Member role (owner, admin, member)
- `status`: Member status (active, removed)
- `permissions`: Role-specific permissions (JSONB)
- `joined_at`, `invited_at`: Timestamps

#### `team_invitations`
- `id`: Unique invitation identifier
- `team_id`: Reference to teams table
- `email`: Invited user's email
- `role`: Assigned role for invitation
- `token`: Unique invitation token
- `invited_by`: User who sent invitation
- `expires_at`: Invitation expiration
- `accepted_at`: Acceptance timestamp

#### `shared_workspaces`
- `id`: Unique workspace identifier
- `team_id`: Reference to teams table
- `name`: Workspace display name
- `description`: Workspace description
- `created_by`: User who created workspace
- `settings`: Workspace configuration (JSONB)

### Feature Flags
- `TEAMS`: Controls team feature availability (enabled globally)

## API Endpoints

### Team Operations
- `GET /teams` - List user's teams
- `POST /teams` - Create new team
- `GET /teams/:id` - Get team details
- `PUT /teams/:id` - Update team
- `DELETE /teams/:id` - Delete team

### Member Management
- `GET /teams/:id/members` - List team members
- `POST /teams/:id/invite` - Invite member
- `PUT /teams/:id/members/:userId` - Update member role
- `DELETE /teams/:id/members/:userId` - Remove member

### Invitations
- `GET /invitations` - List user invitations
- `POST /invitations/:token/accept` - Accept invitation
- `DELETE /invitations/:id` - Decline invitation

### Workspaces
- `GET /teams/:id/workspaces` - List team workspaces
- `POST /teams/:id/workspaces` - Create workspace

## Service Architecture

### TeamCollaborationService
Central service handling all team-related operations:
- Team CRUD operations
- Member management
- Invitation processing
- Workspace management
- Role and permission validation

### Hooks
- `useTeamCollaboration`: Main hook for team operations
- `useTeamInvitations`: Specialized hook for invitation management

## Security & Permissions

### Row Level Security (RLS)
All team-related tables implement RLS policies:
- Users can only access teams they belong to
- Team owners have full management rights
- Members have restricted access based on role
- Invitations are visible to invited users and team admins

### Role Hierarchy
1. **Owner**: Full team management, billing, deletion
2. **Admin**: Member management, workspace creation
3. **Member**: Basic workspace access, collaboration

## User Interface Components

### Pages
- `/teams` - Team dashboard and listing
- `/teams/create` - Team creation form
- `/teams/:id/workspace` - Team workspace
- `/teams/:id/settings` - Team configuration

### Components
- `CreateTeamPage`: Team creation interface
- `TeamWorkspacePage`: Collaborative workspace
- `TeamSettingsPage`: Team management interface

## Usage Examples

### Creating a Team
```typescript
const { createTeam } = useTeamCollaboration();

await createTeam({
  name: "Development Team",
  description: "Main development team",
  subscription_tier: "pro"
});
```

### Inviting Members
```typescript
const { inviteTeamMember } = useTeamCollaboration();

await inviteTeamMember({
  team_id: teamId,
  email: "user@example.com",
  role: "member"
});
```

### Accepting Invitations
```typescript
const { acceptInvitation } = useTeamInvitations();

await acceptInvitation(invitationToken);
```

## Integration Points

### Navigation
- Teams menu item in main navigation
- Contextual team selection
- Breadcrumb navigation within teams

### Authentication
- Requires user authentication
- Integrates with existing auth system
- Session-based team context

### Notifications
- Toast notifications for team operations
- Email notifications for invitations
- Real-time updates for team changes

## Testing

### Unit Tests
- Service layer testing for all operations
- Hook testing for React integration
- Component testing for UI interactions

### Integration Tests
- End-to-end team creation flow
- Invitation acceptance process
- Multi-user collaboration scenarios

## Future Enhancements

### Planned Features
- Team analytics and insights
- Advanced permission granularity
- Team templates and presets
- Integration with external collaboration tools

### Scalability Considerations
- Database indexing optimization
- Caching strategies for team data
- Real-time collaboration infrastructure

## Troubleshooting

### Common Issues
1. **Invitation emails not received**: Check email delivery settings
2. **Permission errors**: Verify user roles and team membership
3. **Workspace access issues**: Confirm team subscription tier

### Debug Tools
- Console logging for service operations
- Network request monitoring
- Database query logging for RLS policies

## Migration Notes

The team collaboration feature was implemented with database migrations that:
- Created all required tables with proper relationships
- Implemented RLS policies for security
- Enabled the TEAMS feature flag
- Set up proper indexing for performance

All migrations are reversible and maintain data integrity throughout the process.