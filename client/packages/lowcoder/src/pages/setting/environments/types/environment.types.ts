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
  // Enhanced license details
  licenseDetails?: DetailedLicenseInfo;
}

/**
 * Interface representing license information for an environment
 */
export interface EnvironmentLicense {
  isValid: boolean;
  error?: string;
  // Enhanced license details
  details?: DetailedLicenseInfo;
}

/**
 * Interface representing detailed license information from the license endpoint
 */
export interface DetailedLicenseInfo {
  eeActive: boolean;
  remainingAPICalls: number;
  eeLicenses: LicenseEntry[];
  // Calculated fields
  totalAPICallsLimit?: number;
  apiCallsUsage?: number; // percentage used
}

/**
 * Interface representing a single license entry
 */
export interface LicenseEntry {
  uuid: string;
  customerId: string;
  customerName: string;
  apiCallsLimit: number;
}