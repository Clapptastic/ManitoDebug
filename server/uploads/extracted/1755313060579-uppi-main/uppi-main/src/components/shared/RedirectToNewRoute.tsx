
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface RedirectToNewRouteProps {
  newPath: string;
}

const RedirectToNewRoute: React.FC<RedirectToNewRouteProps> = ({ newPath }) => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(newPath, { replace: true });
  }, [navigate, newPath]);

  return (
    <div className="flex items-center justify-center py-12">
      <p className="text-muted-foreground">Redirecting...</p>
    </div>
  );
};

export default RedirectToNewRoute;
