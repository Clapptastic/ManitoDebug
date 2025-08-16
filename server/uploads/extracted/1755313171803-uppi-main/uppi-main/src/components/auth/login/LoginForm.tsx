
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

interface LoginFormProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({
  email,
  setEmail,
  password,
  setPassword
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[LoginForm] Form submission started');
    setLoading(true);
    setError('');

    try {
      console.log('[LoginForm] Calling signIn with email:', email);
      const result = await signIn(email, password);
      console.log('[LoginForm] SignIn result:', { success: result.success, hasError: !!result.error });
      
      if (result.success) {
        console.log('[LoginForm] Login successful, navigating to home');
        navigate('/');
      } else {
        const errorMessage = result.error instanceof Error ? result.error.message : (result.error as any)?.message || 'Login failed';
        console.log('[LoginForm] Login failed:', errorMessage);
        setError(errorMessage);
      }
    } catch (err) {
      console.error('[LoginForm] Unexpected error during login:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
          {error}
        </div>
      )}
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-foreground">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
          required
          disabled={loading}
        />
      </div>
      
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-foreground">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
          autoComplete="current-password"
          required
          disabled={loading}
        />
      </div>
      
      <div className="space-y-4">
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sign In
        </Button>
        
        <div className="text-center">
          <Link 
            to="/auth/forgot-password" 
            className="text-sm text-primary hover:underline"
          >
            Forgot your password?
          </Link>
        </div>
      </div>
    </form>
  );
};

export default LoginForm;
