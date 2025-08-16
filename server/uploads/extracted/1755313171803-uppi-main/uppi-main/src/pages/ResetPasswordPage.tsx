
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const ResetPasswordPage: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [hasResetToken, setHasResetToken] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Check if URL contains a reset token
  useEffect(() => {
    const checkResetToken = async () => {
      const hash = window.location.hash;
      const query = new URLSearchParams(window.location.search);
      
      // Check for hash parameters (Supabase default)
      const hashParams = new URLSearchParams(hash.replace('#', ''));
      
      const type = hashParams.get('type') || query.get('type');
      const accessToken = hashParams.get('access_token') || query.get('access_token');
      
      if (type === 'recovery' && accessToken) {
        setHasResetToken(true);
      } else {
        setFormError('Invalid or missing reset token. Please request a new password reset link.');
      }
    };
    
    checkResetToken();
  }, []);
  
  const validateForm = (): boolean => {
    if (newPassword.length < 6) {
      setFormError('Password must be at least 6 characters long');
      return false;
    }
    
    if (newPassword !== confirmPassword) {
      setFormError('Passwords do not match');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      setFormError(null);
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        throw error;
      }
      
      setIsSuccess(true);
      toast({
        title: 'Password updated',
        description: 'Your password has been successfully reset.',
      });
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        navigate('/auth/login');
      }, 3000);
    } catch (error) {
      console.error('Password reset error:', error);
      
      if (error instanceof Error) {
        setFormError(error.message);
      } else {
        setFormError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  return (
    <div className="container mx-auto flex h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Reset Password</h1>
          <p className="text-muted-foreground mt-2">
            Create a new password for your account
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Set New Password</CardTitle>
            <CardDescription>
              {isSuccess 
                ? 'Your password has been updated successfully' 
                : 'Enter and confirm your new password below'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {isSuccess ? (
              <Alert className="bg-green-50 text-green-800 border-green-300">
                <AlertDescription>
                  Password reset successful! You'll be redirected to the login page shortly.
                </AlertDescription>
              </Alert>
            ) : !hasResetToken ? (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {formError && (
                  <Alert variant="destructive">
                    <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={isSubmitting}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={togglePasswordVisibility}
                      className="absolute right-0 top-0 h-full px-3"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isSubmitting}
                  />
                </div>
                
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || !hasResetToken}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating password...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </form>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-center">
            <div className="text-center text-sm">
              <Link to="/auth/login" className="text-primary font-medium underline-offset-4 hover:underline">
                Back to login
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
