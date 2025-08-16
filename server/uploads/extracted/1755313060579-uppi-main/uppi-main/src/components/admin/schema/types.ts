
/**
 * Database schema type definitions
 */

export interface TableDefinition {
  name: string;
  schema: string;
  is_view?: boolean;
  hasRLS?: boolean;
  comment?: string;
  rowCount?: number;
  size?: string;
  columns: ColumnDefinition[];
  constraints?: ConstraintDefinition[];
  indexes?: IndexDefinition[];
  policies?: PolicyDefinition[];
}

export interface ColumnDefinition {
  name: string;
  dataType: string;
  isNullable: boolean;
  isPrimaryKey?: boolean;
  hasDefault?: boolean;
  defaultValue?: string;
  comment?: string;
  // Backward compatibility fields
  type?: string;
  nullable?: boolean;
  default_value?: string;
  primary_key?: boolean;
  foreign_key?: {
    table: string;
    column: string;
  };
}

export interface ConstraintDefinition {
  constraint_name: string;
  constraint_type: string;
  column_names: string[];
  foreign_table?: string;
  foreign_columns?: string[];
  // Backward compatibility fields
  name?: string;
  type?: string;
  columns?: string[];
  definition?: string;
  references_table?: string;
  references_columns?: string[];
}

export interface IndexDefinition {
  index_name: string;
  index_def: string;
  // Backward compatibility fields
  name?: string;
  type?: string;
  unique?: boolean;
  columns?: string[];
  definition?: string;
}

export interface PolicyDefinition {
  policy_name: string;
  roles: string[];
  cmd: string;
  qual: string;
  with_check: string;
  // Backward compatibility fields
  name?: string;
  action?: string;
  using_expression?: string;
  check_expression?: string;
}

// Alias types for backward compatibility
export type TableColumn = ColumnDefinition;
export type TableConstraint = ConstraintDefinition;
export type TableIndex = IndexDefinition;
export type TablePolicy = PolicyDefinition;
