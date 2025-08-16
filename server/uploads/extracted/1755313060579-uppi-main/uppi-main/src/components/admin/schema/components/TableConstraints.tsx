
import React from 'react';
import { TableConstraint } from '../types';
import { Badge } from '@/components/ui/badge';

interface TableConstraintsProps {
  constraints: TableConstraint[];
}

const TableConstraints: React.FC<TableConstraintsProps> = ({ constraints }) => {
  if (!constraints || constraints.length === 0) {
    return <div className="text-muted-foreground">No constraints defined for this table.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-muted/50 text-left text-sm">
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Type</th>
            <th className="p-2 border">Columns</th>
            <th className="p-2 border">References</th>
            <th className="p-2 border">Definition</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {constraints.map((constraint, index) => (
            <tr key={index} className="border-t">
              <td className="p-2 border font-medium">{constraint.name}</td>
              <td className="p-2 border">
                <Badge variant="outline" className="text-xs">
                  {constraint.type}
                </Badge>
              </td>
              <td className="p-2 border">
                {constraint.columns?.map((col, i) => (
                  <span key={i} className="bg-muted rounded px-1 py-0.5 text-xs mr-1">
                    {col}
                  </span>
                ))}
              </td>
              <td className="p-2 border font-mono text-xs">
                {constraint.references_table && (
                  <div>
                    {constraint.references_table}
                    {constraint.references_columns && (
                      <span className="text-muted-foreground">
                        ({constraint.references_columns.join(", ")})
                      </span>
                    )}
                  </div>
                )}
              </td>
              <td className="p-2 border font-mono text-xs">
                {constraint.definition}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TableConstraints;
