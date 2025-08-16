
import React from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export interface TablesFilterProps {
  query: string;
  onQueryChange: (value: string) => void;
  tableCount: number;
  totalTables: number;
}

const TablesFilter: React.FC<TablesFilterProps> = ({
  query,
  onQueryChange,
  tableCount,
  totalTables
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
      <div className="relative w-full sm:max-w-xs">
        <Input
          placeholder="Filter tables..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="pl-8"
        />
        <span className="absolute left-2.5 top-2.5 text-muted-foreground">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-50"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.3-4.3"></path>
          </svg>
        </span>
      </div>
      <div className="text-sm text-muted-foreground flex items-center gap-2">
        <span>Showing</span>
        <Badge variant="outline" className="font-mono">{tableCount}</Badge>
        <span>of</span>
        <Badge variant="outline" className="font-mono">{totalTables}</Badge>
        <span>tables</span>
      </div>
    </div>
  );
};

export default TablesFilter;
