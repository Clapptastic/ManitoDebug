
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useSignup() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const signUp = async ({ email, password, fullName }: { email: string; password: string; fullName: string }) => {
    try {
      setIsLoading(true);
      setError(null);

      // First, check if user already exists
      const { data: existingUsers, error: searchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .limit(1);

      if (searchError) {
        console.error('Error checking if user exists:', searchError);
      }

      if (existingUsers && existingUsers.length > 0) {
        throw new Error('A user with this email already exists');
      }

      // Sign up with Supabase - include proper redirect URL
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          },
        },
      });

      if (signupError) throw signupError;

      // Note: Profile creation is now handled automatically by database trigger
      // No need to manually create profile - the handle_new_user() trigger will do it

      toast({
        title: 'Account created successfully',
        description: 'Please check your email to confirm your account.',
      });

      // Return full data object for easier access to user and session
      return data;
    } catch (err: any) {
      console.error('Signup error:', err);
      
      // Provide a friendly error message
      let errorMessage = 'An error occurred during signup';
      if (err.message) {
        errorMessage = err.message;
      } else if (err.error_description) {
        errorMessage = err.error_description;
      }
      
      setError(errorMessage);
      
      toast({
        title: 'Error creating account',
        description: errorMessage,
        variant: 'destructive',
      });
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { signUp, isLoading, error };
}
