import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { 
  MoreHorizontal, 
  Edit, 
  UserX, 
  Shield, 
  Mail, 
  Key,
  History,
  Ban
} from 'lucide-react';
import { User, userManagementService } from '@/services/userManagementService';
import { useToast } from '@/hooks/use-toast';

interface UserActionsDropdownProps {
  user: User;
  onEditUser: (user: User) => void;
  onUserUpdated: () => void;
  currentUserRole: 'user' | 'admin' | 'super_admin';
}

const UserActionsDropdown: React.FC<UserActionsDropdownProps> = ({
  user,
  onEditUser,
  onUserUpdated,
  currentUserRole
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSendPasswordReset = async () => {
    try {
      setLoading(true);
      await userManagementService.sendPasswordResetEmail(user.email);
      toast({
        title: 'Password Reset Sent',
        description: `Password reset email sent to ${user.email}`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send password reset email',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendUser = async () => {
    try {
      setLoading(true);
      await userManagementService.suspendUser(user.id);
      toast({
        title: 'User Suspended',
        description: `${user.email} has been suspended`,
      });
      onUserUpdated();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to suspend user',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    try {
      setLoading(true);
      await userManagementService.deleteUser(user.id);
      toast({
        title: 'User Deleted',
        description: `${user.email} has been permanently deleted`,
      });
      onUserUpdated();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewHistory = async () => {
    try {
      const history = await userManagementService.getUserRoleHistory(user.id);
      // Create a simple alert for now - could be enhanced with a modal
      const historyText = history.length > 0 
        ? history.map(h => `${h.role} (${new Date(h.assigned_at).toLocaleDateString()})`).join('\n')
        : 'No role history available';
      
      alert(`Role History for ${user.email}:\n\n${historyText}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load user history',
        variant: 'destructive'
      });
    }
  };

  const handleSendEmail = () => {
    // Open email client with user's email
    const subject = encodeURIComponent('Message from Admin');
    const body = encodeURIComponent('Hello,\n\n');
    window.open(`mailto:${user.email}?subject=${subject}&body=${body}`);
  };

  const canManageUser = currentUserRole === 'super_admin' || 
    (currentUserRole === 'admin' && user.role !== 'super_admin');

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          
          {canManageUser && (
            <>
              <DropdownMenuItem onClick={() => onEditUser(user)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit User
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={handleSendPasswordReset} disabled={loading}>
                <Key className="mr-2 h-4 w-4" />
                Send Password Reset
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {user.status !== 'suspended' && (
                <DropdownMenuItem 
                  onClick={() => setSuspendDialogOpen(true)}
                  className="text-orange-600"
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Suspend User
                </DropdownMenuItem>
              )}
              
              {currentUserRole === 'super_admin' && (
                <DropdownMenuItem 
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-red-600"
                >
                  <UserX className="mr-2 h-4 w-4" />
                  Delete User
                </DropdownMenuItem>
              )}
            </>
          )}
          
          <DropdownMenuItem onClick={handleViewHistory}>
            <History className="mr-2 h-4 w-4" />
            View History
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleSendEmail}>
            <Mail className="mr-2 h-4 w-4" />
            Send Email
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Suspend User Dialog */}
      <AlertDialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to suspend {user.email}? This will prevent them from accessing the application, but their data will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSuspendUser}
              className="bg-orange-600 hover:bg-orange-700"
              disabled={loading}
            >
              Suspend User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete User Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete {user.email}? This action cannot be undone and will remove all their data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700"
              disabled={loading}
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UserActionsDropdown;