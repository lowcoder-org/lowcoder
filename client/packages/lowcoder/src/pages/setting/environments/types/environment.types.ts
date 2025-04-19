/**
 * Interface representing an Environment entity
 */
export interface Environment {
  environmentId: string;
  environmentName?: string;
  environmentDescription?: string;
  environmentIcon?: string;
  environmentType: string;
  environmentApiServiceUrl?: string;
  environmentNodeServiceUrl?: string;
  environmentFrontendUrl?: string;
  environmentApikey: string;
  isMaster: boolean;
  createdAt: string;
  updatedAt: string;
}