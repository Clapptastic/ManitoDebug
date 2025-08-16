
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { TableDefinition } from './types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import TableColumns from './components/TableColumns';
import TableConstraints from './components/TableConstraints';
import TableIndexes from './components/TableIndexes';
import TablePolicies from './components/TablePolicies';
import { Badge } from '@/components/ui/badge';
import { Eye, Server } from 'lucide-react';

interface SchemaTableProps {
  table: TableDefinition;
}

const SchemaTable: React.FC<SchemaTableProps> = ({ table }) => {
  const [activeTab, setActiveTab] = useState('columns');

  const columnCount = table.columns?.length || 0;
  const constraintCount = table.constraints?.length || 0;
  const indexCount = table.indexes?.length || 0;
  const policyCount = table.policies?.length || 0;
  
  // Handle properties that might not exist
  const isView = 'is_view' in table ? table.is_view : false;
  const tableComment = 'comment' in table ? table.comment : '';
  
  return (
    <Card id={`table-${table.name}`} className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap justify-between gap-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              {table.name}
              {isView ? (
                <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-800 hover:bg-blue-100">
                  <Eye className="mr-1 h-3 w-3" />
                  View
                </Badge>
              ) : (
                <Badge variant="outline" className="ml-2 bg-gray-50 text-gray-800 hover:bg-gray-100">
                  <Server className="mr-1 h-3 w-3" />
                  Table
                </Badge>
              )}
            </CardTitle>
          </div>
          <Badge variant="outline" className="px-2">
            {table.schema}
          </Badge>
        </div>
        
        {tableComment && (
          <CardDescription>
            {tableComment}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-2 w-full justify-start overflow-x-auto">
            <TabsTrigger value="columns" className="relative">
              Columns
              <Badge variant="secondary" className="ml-1 py-0 h-4 min-w-4 px-1">{columnCount}</Badge>
            </TabsTrigger>
            
            <TabsTrigger value="constraints" className="relative">
              Constraints
              <Badge variant="secondary" className="ml-1 py-0 h-4 min-w-4 px-1">{constraintCount}</Badge>
            </TabsTrigger>
            
            <TabsTrigger value="indexes" className="relative">
              Indexes
              <Badge variant="secondary" className="ml-1 py-0 h-4 min-w-4 px-1">{indexCount}</Badge>
            </TabsTrigger>
            
            <TabsTrigger value="policies" className="relative">
              Policies
              <Badge variant="secondary" className="ml-1 py-0 h-4 min-w-4 px-1">{policyCount}</Badge>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="columns" className="mt-0">
            <TableColumns columns={table.columns || []} />
          </TabsContent>
          
          <TabsContent value="constraints" className="mt-0">
            <TableConstraints constraints={table.constraints || []} />
          </TabsContent>
          
          <TabsContent value="indexes" className="mt-0">
            <TableIndexes indexes={table.indexes || []} />
          </TabsContent>
          
          <TabsContent value="policies" className="mt-0">
            <TablePolicies policies={table.policies || []} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SchemaTable;
