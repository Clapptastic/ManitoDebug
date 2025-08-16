
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { TableDefinition } from '../types';
import TableColumns from './TableColumns';
import TableConstraints from './TableConstraints';
import TableIndexes from './TableIndexes';
import TablePolicies from './TablePolicies';

interface TableViewProps {
  table: TableDefinition;
}

const TableView: React.FC<TableViewProps> = ({ table }) => {
  const [activeTab, setActiveTab] = useState<'columns' | 'constraints' | 'indexes' | 'policies'>('columns');

  return (
    <Card>
      <CardContent className="p-4">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'columns' | 'constraints' | 'indexes' | 'policies')}>
          <TabsList className="mb-4">
            <TabsTrigger value="columns">Columns</TabsTrigger>
            <TabsTrigger value="constraints">Constraints</TabsTrigger>
            <TabsTrigger value="indexes">Indexes</TabsTrigger>
            <TabsTrigger value="policies">Policies</TabsTrigger>
          </TabsList>
          <TabsContent value="columns">
            <TableColumns columns={table.columns} />
          </TabsContent>
          <TabsContent value="constraints">
            <TableConstraints constraints={table.constraints} />
          </TabsContent>
          <TabsContent value="indexes">
            <TableIndexes indexes={table.indexes} />
          </TabsContent>
          <TabsContent value="policies">
            <TablePolicies policies={table.policies} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TableView;
