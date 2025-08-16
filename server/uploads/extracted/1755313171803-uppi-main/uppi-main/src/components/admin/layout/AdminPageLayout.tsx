import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/utils/cn';

interface AdminPageLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

const AdminPageLayout: React.FC<AdminPageLayoutProps> = ({
  title,
  description,
  children,
  actions,
  className
}) => {
  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div>{actions}</div>}
      </div>
      
      <Card>
        <CardContent className="pt-6">
          {children}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPageLayout;