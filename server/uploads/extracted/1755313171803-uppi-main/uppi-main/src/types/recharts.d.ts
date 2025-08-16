/**
 * Type definitions for recharts components
 */

declare module 'recharts' {
  // Core components
  export const BarChart: React.FC<any>;
  export const LineChart: React.FC<any>;
  export const PieChart: React.FC<any>;
  export const ScatterChart: React.FC<any>;
  export const RadarChart: React.FC<any>;
  
  // Chart elements
  export const Bar: React.FC<any>;
  export const Line: React.FC<any>;
  export const Pie: React.FC<any>;
  export const Scatter: React.FC<any>;
  export const Radar: React.FC<any>;
  
  // Axes and grid components
  export const XAxis: React.FC<any>;
  export const YAxis: React.FC<any>;
  export const ZAxis: React.FC<any>;
  export const CartesianGrid: React.FC<any>;
  export const PolarGrid: React.FC<any>;
  export const PolarAngleAxis: React.FC<any>;
  export const PolarRadiusAxis: React.FC<any>;
  
  // Other chart components
  export const Cell: React.FC<any>;
  export const Legend: React.FC<any>;
  export const Tooltip: React.FC<any>;
  export const ResponsiveContainer: React.FC<any>;
  
  // Types
  export type ValueType = string | number;
  
  // Add additional type augmentation for ValueType
  interface Number {
    toFixed(fractionDigits?: number): string;
  }
}
