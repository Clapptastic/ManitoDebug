
export enum ComponentStatus {
  OPERATIONAL = 'operational',
  DEGRADED = 'degraded',
  OUTAGE = 'outage',
  MAINTENANCE = 'maintenance'
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
  GUEST = 'guest'
}

export enum ApiStatus {
  OPERATIONAL = 'operational',
  DEGRADED = 'degraded',
  DOWN = 'down',
  MAINTENANCE = 'maintenance',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  PENDING = 'pending'
}

// Alias for backward compatibility
export const ComponentStatusEnum = ComponentStatus;
