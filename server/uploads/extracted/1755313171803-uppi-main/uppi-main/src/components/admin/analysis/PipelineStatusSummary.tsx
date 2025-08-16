import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { DiagramStep } from './FlowDiagramAnimated';

interface Props {
  steps: DiagramStep[];
}

export const PipelineStatusSummary: React.FC<Props> = ({ steps }) => {
  const data = useMemo(() => {
    const counts: Record<string, number> = { success: 0, error: 0, warning: 0, running: 0, idle: 0 };
    for (const s of steps) counts[s.status] = (counts[s.status] ?? 0) + 1;
    return [
      { name: 'Success', value: counts.success, fill: 'hsl(var(--primary))' },
      { name: 'Error', value: counts.error, fill: 'hsl(var(--destructive))' },
      { name: 'Warning', value: counts.warning, fill: '#eab308' },
      { name: 'Running', value: counts.running, fill: 'hsl(var(--muted-foreground))' },
      { name: 'Idle', value: counts.idle, fill: 'hsl(var(--border))' },
    ];
  }, [steps]);

  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  return (
    <div className="w-full h-40">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={40} outerRadius={60} paddingAngle={2} stroke="none">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PipelineStatusSummary;
