
import React from 'react';
import { TablePolicy } from '../types';
import { Badge } from '@/components/ui/badge';

interface TablePoliciesProps {
  policies: TablePolicy[];
}

const TablePolicies: React.FC<TablePoliciesProps> = ({ policies }) => {
  if (!policies || policies.length === 0) {
    return <div className="text-muted-foreground">No Row Level Security (RLS) policies defined for this table.</div>;
  }

  const getActionBadgeVariant = (action: string) => {
    switch (action.toLowerCase()) {
      case 'select':
        return 'default';
      case 'insert':
        return 'success';
      case 'update':
        return 'warning';
      case 'delete':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-muted/50 text-left text-sm">
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Action</th>
            <th className="p-2 border">Roles</th>
            <th className="p-2 border">USING Expression</th>
            <th className="p-2 border">WITH CHECK Expression</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {policies.map((policy, index) => (
            <tr key={index} className="border-t">
              <td className="p-2 border font-medium">{policy.name}</td>
              <td className="p-2 border">
                <Badge variant={getActionBadgeVariant(policy.action) as any} className="text-xs">
                  {policy.action.toUpperCase()}
                </Badge>
              </td>
              <td className="p-2 border">
                {policy.roles?.map((role, i) => (
                  <span key={i} className="bg-muted rounded px-1 py-0.5 text-xs mr-1">
                    {role}
                  </span>
                ))}
              </td>
              <td className="p-2 border font-mono text-xs overflow-x-auto">
                {policy.using_expression || '-'}
              </td>
              <td className="p-2 border font-mono text-xs overflow-x-auto">
                {policy.check_expression || policy.with_check || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TablePolicies;
