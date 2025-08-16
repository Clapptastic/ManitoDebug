import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { DiagramStatus } from './FlowDiagramAnimated';
import { Badge } from '@/components/ui/badge';

export interface PipelineStatusNodeData {
  label: string;
  status: DiagramStatus;
}

interface Props {
  data: PipelineStatusNodeData;
}

const statusIconCls = (status: DiagramStatus) =>
  status === 'success'
    ? 'bg-primary/10 text-primary border-primary/20'
    : status === 'error'
    ? 'bg-destructive/10 text-destructive border-destructive/20'
    : status === 'warning'
    ? 'bg-unicorn-secondary/10 text-unicorn-secondary border-unicorn-secondary/20'
    : status === 'running'
    ? 'bg-muted text-foreground border-border'
    : 'bg-muted text-muted-foreground border-border';

export const PipelineStatusNode: React.FC<Props> = ({ data }) => {
  const { label, status } = data;
  return (
    <div className={`rounded-md border px-3 py-2 ${statusIconCls(status)}`}>
      {/* Invisible default handles to enable edges between nodes */}
      <Handle type="target" position={Position.Left} id="l" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} id="r" style={{ opacity: 0 }} />
      <div className="flex items-center gap-2">
        <Badge variant={status === 'success' ? 'default' : 'secondary'} className="shrink-0">
          <span className="sr-only">{status}</span>
          <span className="h-2 w-2 rounded-full bg-current" />
        </Badge>
        <span className="text-xs font-medium leading-tight">{label}</span>
      </div>
    </div>
  );
};

export default PipelineStatusNode;
