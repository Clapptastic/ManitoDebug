
import React from 'react';
import { TableColumn } from '../types';

interface TableColumnsProps {
  columns: TableColumn[];
}

const TableColumns: React.FC<TableColumnsProps> = ({ columns }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-muted/50 text-left text-sm">
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Type</th>
            <th className="p-2 border">Nullable</th>
            <th className="p-2 border">Default Value</th>
            <th className="p-2 border">Keys</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {columns.map((column, index) => (
            <tr key={index} className="border-t">
              <td className="p-2 border font-medium">{column.name}</td>
              <td className="p-2 border font-mono text-xs">{column.type}</td>
              <td className="p-2 border text-center">
                {column.nullable ? '✓' : ''}
              </td>
              <td className="p-2 border font-mono text-xs">
                {column.default_value || ''}
              </td>
              <td className="p-2 border">
                {column.primary_key && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded mr-1">
                    PK
                  </span>
                )}
                {column.foreign_key && (
                  <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded" title={`References ${column.foreign_key.table}.${column.foreign_key.column}`}>
                    FK
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TableColumns;
