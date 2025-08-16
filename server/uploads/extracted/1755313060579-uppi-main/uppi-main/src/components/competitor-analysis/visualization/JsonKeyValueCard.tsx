import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface JsonKeyValueCardProps {
  title: string;
  data?: Record<string, any> | null;
  emptyText?: string;
}

function isPlainObject(val: any): val is Record<string, any> {
  return val && typeof val === 'object' && !Array.isArray(val);
}

export const JsonKeyValueCard: React.FC<JsonKeyValueCardProps> = ({ title, data, emptyText = 'No data available' }) => {
  if (!data || (isPlainObject(data) && Object.keys(data).length === 0)) return null;

  const entries = isPlainObject(data) ? Object.entries(data) : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {entries.map(([k, v]) => (
              <div key={k} className="border rounded-md p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  {k.replace(/_/g, ' ')}
                </div>
                {typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' ? (
                  <div className="text-sm font-medium break-words">{String(v)}</div>
                ) : Array.isArray(v) ? (
                  <div className="text-sm text-muted-foreground">{v.length} items</div>
                ) : isPlainObject(v) ? (
                  <pre className="text-xs bg-muted/40 rounded p-2 max-h-40 overflow-auto">{JSON.stringify(v, null, 2)}</pre>
                ) : (
                  <div className="text-sm text-muted-foreground">—</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">{emptyText}</div>
        )}
      </CardContent>
    </Card>
  );
};

export default JsonKeyValueCard;
