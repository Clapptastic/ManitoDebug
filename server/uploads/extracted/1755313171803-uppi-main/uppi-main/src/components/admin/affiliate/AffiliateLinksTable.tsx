
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, ExternalLink } from 'lucide-react';
import { AffiliateLink } from '@/types/admin';
import { OutboundLink } from '@/components/shared/OutboundLink';

interface AffiliateLinksTableProps {
  links: AffiliateLink[];
  isLoading?: boolean;
  onEdit?: (link: AffiliateLink) => void;
  onDelete?: (id: string) => void;
}

export const AffiliateLinksTable: React.FC<AffiliateLinksTableProps> = ({
  links,
  isLoading = false,
  onEdit,
  onDelete
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Loading affiliate links...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Program</TableHead>
            <TableHead>URL</TableHead>
            <TableHead className="text-right">Clicks</TableHead>
            <TableHead className="text-right">Conversions</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {links.map((link) => (
            <TableRow key={link.id}>
              <TableCell className="font-medium">{link.name}</TableCell>
              <TableCell>{link.program_name || link.category}</TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <span className="max-w-xs truncate">{link.url}</span>
                  <Button variant="ghost" size="sm" asChild>
                    <OutboundLink href={link.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3" />
                    </OutboundLink>
                  </Button>
                </div>
              </TableCell>
              <TableCell className="text-right">{link.clicks}</TableCell>
              <TableCell className="text-right">{link.conversions}</TableCell>
              <TableCell className="text-right">${link.revenue.toFixed(2)}</TableCell>
              <TableCell>
                <Badge 
                  variant={link.status === 'active' ? 'default' : 'secondary'}
                >
                  {link.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  {onEdit && (
                    <Button variant="ghost" size="sm" onClick={() => onEdit(link)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button variant="ghost" size="sm" onClick={() => onDelete(link.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
          
          {links.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                No affiliate links found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default AffiliateLinksTable;
