
export interface MicroserviceConfig {
  service_id: string;
  service_name: string;
  service_description?: string;
  base_url: string;
  api_key?: string;
  version?: string;
  is_active: boolean;
  is_external?: boolean;
  health_check_path?: string;
  swagger_url?: string;
  readme_url?: string;
  endpoints: MicroserviceEndpoint[];
}

export interface MicroserviceEndpoint {
  path: string;
  method: string;
  description?: string;
  requires_auth: boolean;
  is_public?: boolean;
}
