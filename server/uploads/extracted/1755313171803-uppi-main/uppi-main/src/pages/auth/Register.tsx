
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Register: React.FC = () => {
  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded-lg shadow-sm">
      <h1 className="text-2xl font-bold mb-6 text-center">Create an Account</h1>
      
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Full Name</label>
          <input 
            type="text" 
            placeholder="Enter your full name" 
            className="w-full p-2 border rounded-md"
            required
          />
        </div>
        
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
            placeholder="Create a password" 
            className="w-full p-2 border rounded-md"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Confirm Password</label>
          <input 
            type="password" 
            placeholder="Confirm your password" 
            className="w-full p-2 border rounded-md"
            required
          />
        </div>
        
        <div className="flex items-center">
          <input type="checkbox" id="terms" className="mr-2" required />
          <label htmlFor="terms" className="text-sm">
            I agree to the{' '}
            <Link to="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </label>
        </div>
        
        <Button type="submit" className="w-full">Register</Button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
