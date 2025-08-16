
import React from 'react';
import { Check, AlertTriangle, AlertCircle, Database, Layers, Gauge, Server } from 'lucide-react';

// Export icon components with standardized props
export const IconCheck = (props: React.ComponentProps<typeof Check>) => <Check {...props} />;
export const IconAlertTriangle = (props: React.ComponentProps<typeof AlertTriangle>) => <AlertTriangle {...props} />;
export const IconAlertCircle = (props: React.ComponentProps<typeof AlertCircle>) => <AlertCircle {...props} />;
export const DatabaseIcon = (props: React.ComponentProps<typeof Database>) => <Database {...props} />;
export const ApiIcon = (props: React.ComponentProps<typeof Layers>) => <Layers {...props} />;
export const ServerIcon = (props: React.ComponentProps<typeof Server>) => <Server {...props} />;
export const GaugeIcon = (props: React.ComponentProps<typeof Gauge>) => <Gauge {...props} />;
