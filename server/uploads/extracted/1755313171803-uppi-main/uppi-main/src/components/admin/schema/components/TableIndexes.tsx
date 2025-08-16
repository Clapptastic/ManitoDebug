
import React from 'react';
import { TableIndex } from '../types';
import { Badge } from '@/components/ui/badge';

interface TableIndexesProps {
  indexes: TableIndex[];
}

const TableIndexes: React.FC<TableIndexesProps> = ({ indexes }) => {
  if (!indexes || indexes.length === 0) {
    return <div className="text-muted-foreground">No indexes defined for this table.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-muted/50 text-left text-sm">
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Type</th>
            <th className="p-2 border">Unique</th>
            <th className="p-2 border">Columns</th>
            <th className="p-2 border">Definition</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {indexes.map((index, i) => (
            <tr key={i} className="border-t">
              <td className="p-2 border font-medium">{index.name}</td>
              <td className="p-2 border">
                <Badge variant="outline" className="text-xs">
                  {index.type || 'btree'}
                </Badge>
              </td>
              <td className="p-2 border text-center">
                {index.unique ? '✓' : ''}
              </td>
              <td className="p-2 border">
                {index.columns?.map((col, i) => (
                  <span key={i} className="bg-muted rounded px-1 py-0.5 text-xs mr-1">
                    {col}
                  </span>
                ))}
              </td>
              <td className="p-2 border font-mono text-xs">
                {index.definition}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TableIndexes;
