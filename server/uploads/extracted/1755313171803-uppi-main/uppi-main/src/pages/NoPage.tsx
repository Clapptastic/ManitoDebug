
import React from 'react';
import { Link } from 'react-router-dom';

const NoPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-xl mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className="bg-primary text-primary-foreground px-6 py-3 rounded-md hover:bg-primary/90 transition-colors">
        Back to Home
      </Link>
    </div>
  );
};

export default NoPage;
