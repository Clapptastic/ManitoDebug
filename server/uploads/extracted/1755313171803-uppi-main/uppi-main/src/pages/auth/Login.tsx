
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Login: React.FC = () => {
  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded-lg shadow-sm">
      <h1 className="text-2xl font-bold mb-6 text-center">Log In</h1>
      
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
        
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input 
            type="password" 
            placeholder="Enter your password" 
            className="w-full p-2 border rounded-md"
            required
          />
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <input type="checkbox" id="remember" className="mr-2" />
            <label htmlFor="remember" className="text-sm">Remember me</label>
          </div>
          <Link to="/forgot-password" className="text-sm text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        
        <Button type="submit" className="w-full">Login</Button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
