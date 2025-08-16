
import React from "react";

const NavSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col gap-2 px-4" data-testid="skeleton-loader">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-8 bg-muted/60 rounded-md animate-pulse"></div>
      ))}
    </div>
  );
};

export default NavSkeleton;
