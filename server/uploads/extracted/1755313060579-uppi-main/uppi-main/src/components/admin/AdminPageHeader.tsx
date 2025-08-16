import React from 'react';

export interface AdminPageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({
  title,
  description,
  icon,
  actions,
  children
}) => {
  return (
    <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
      <div className="flex items-center space-x-4">
        {icon && (
          <div className="flex-shrink-0">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground mt-1">
              {description}
            </p>
          )}
        </div>
      </div>
      {(actions || children) && (
        <div className="flex items-center space-x-2">
          {actions}
          {children}
        </div>
      )}
    </div>
  );
};

export default AdminPageHeader;