import React from 'react';

export interface AdminPageLayoutProps {
  title?: string;
  children: React.ReactNode;
}

const AdminPageLayout: React.FC<AdminPageLayoutProps> = ({ title, children }) => {
  return (
    <div className="space-y-6">
      {title && (
        <div className="border-b border-border pb-4">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        </div>
      )}
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
};

export default AdminPageLayout;