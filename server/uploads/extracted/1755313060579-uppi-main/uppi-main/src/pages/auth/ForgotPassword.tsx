
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const ForgotPassword: React.FC = () => {
  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded-lg shadow-sm">
      <h1 className="text-2xl font-bold mb-2 text-center">Forgot Password</h1>
      <p className="text-center text-muted-foreground mb-6">
        Enter your email and we'll send you a link to reset your password.
      </p>
      
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input 
            type="email" 
            placeholder="Enter your email" 
            className="w-full p-2 border rounded-md"
            required
          />
        </div>
        
        <Button type="submit" className="w-full">Send Reset Link</Button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm">
          Remember your password?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
