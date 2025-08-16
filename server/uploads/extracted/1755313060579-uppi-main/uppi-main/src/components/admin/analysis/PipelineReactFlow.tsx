import React, { useMemo } from 'react';
import '@xyflow/react/dist/style.css';
import { ReactFlow, Background, Controls, MiniMap, type Node, type Edge } from '@xyflow/react';
import type { DiagramStep, DiagramStatus } from './FlowDiagramAnimated';
import PipelineStatusNode from './PipelineStatusNode';

interface Props {
  steps: DiagramStep[];
}

const statusToClass = (status: DiagramStatus) =>
  status === 'success'
    ? 'stroke-[hsl(var(--primary))]'
    : status === 'error'
    ? 'stroke-[hsl(var(--destructive))]'
    : status === 'warning'
    ? 'stroke-[#7E69AB]'
    : status === 'running'
    ? 'stroke-muted-foreground'
    : 'stroke-border';

export const PipelineReactFlow: React.FC<Props> = ({ steps }) => {
  const { nodes, edges } = useMemo(() => {
    const n: Node[] = steps.map((s, idx) => ({
      id: s.id,
      type: 'status',
      position: { x: idx * 220, y: 0 },
      data: { label: s.name, status: s.status },
      draggable: false,
      selectable: false,
    }));

    // Force edges to connect to explicit handles ('r' -> 'l') to avoid React Flow #008
    const e: Edge[] = steps.slice(0, -1).map((s, idx) => ({
      id: `${s.id}->${steps[idx + 1].id}`,
      source: s.id,
      target: steps[idx + 1].id,
      sourceHandle: 'r',
      targetHandle: 'l',
      animated: steps[idx].status === 'running' || steps[idx + 1].status === 'running',
      className: statusToClass(steps[idx + 1].status),
      type: 'smoothstep',
    }));

    return { nodes: n, edges: e };
  }, [steps]);

  return (
    <div className="w-full border rounded-lg">
      <div className="h-[220px]">
        <ReactFlow 
          nodes={nodes}
          edges={edges}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          nodeTypes={{ status: PipelineStatusNode as any }}
          attributionPosition="bottom-right"
        >
          <MiniMap pannable zoomable />
          <Controls showInteractive={false} />
          <Background />
        </ReactFlow>
      </div>
    </div>
  );
};

export default PipelineReactFlow;
