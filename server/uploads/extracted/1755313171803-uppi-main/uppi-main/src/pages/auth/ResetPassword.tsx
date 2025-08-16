
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const ResetPassword: React.FC = () => {
  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded-lg shadow-sm">
      <h1 className="text-2xl font-bold mb-6 text-center">Reset Password</h1>
      
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">New Password</label>
          <input 
            type="password" 
            placeholder="Enter new password" 
            className="w-full p-2 border rounded-md"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Confirm Password</label>
          <input 
            type="password" 
            placeholder="Confirm new password" 
            className="w-full p-2 border rounded-md"
            required
          />
        </div>
        
        <Button type="submit" className="w-full">Reset Password</Button>
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

export default ResetPassword;
