/**
 * Interface representing an Environment entity
 */
export interface Environment {
  environmentId: string;
  environmentName?: string;
  environmentDescription?: string;
  environmentIcon?: string;
  environmentType?: string;
  environmentApiServiceUrl?: string;
  environmentNodeServiceUrl?: string;
  environmentFrontendUrl?: string;
  environmentApikey: string;
  isMaster: boolean;
  createdAt: string;
  updatedAt: string;
  // License-related properties
  isLicensed?: boolean;
  licenseStatus?: 'checking' | 'licensed' | 'unlicensed' | 'error';
  licenseError?: string;
}

/**
 * Interface representing license information for an environment
 */
export interface EnvironmentLicense {
  isValid: boolean;
  error?: string;
}