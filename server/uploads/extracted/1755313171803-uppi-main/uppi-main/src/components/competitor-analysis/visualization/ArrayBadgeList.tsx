import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ArrayBadgeListProps {
  title: string;
  items?: Array<string> | null;
}

export const ArrayBadgeList: React.FC<ArrayBadgeListProps> = ({ title, items }) => {
  const list = Array.isArray(items) ? items.filter(Boolean) : [];
  if (list.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {list.map((item, idx) => (
            <Badge key={idx} variant="outline">{item}</Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ArrayBadgeList;
