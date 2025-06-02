import axios from 'axios';
import { trans } from 'i18n';
import { EnvironmentLicense, DetailedLicenseInfo } from '../types/environment.types';

/**
 * Check license and fetch detailed license information for an environment
 * @param apiServiceUrl - API service URL for the environment  
 * @param apiKey - API key for the environment
 * @returns Promise with license information including detailed data
 */
export async function checkEnvironmentLicense(
  apiServiceUrl: string,
  apiKey?: string
): Promise<EnvironmentLicense> {
  try {
    if (!apiServiceUrl) {
      return {
        isValid: false,
        error: trans('environments.services_license_apiServiceUrlRequired')
      };
    }

    // Prepare headers with API key if available
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }

    // Fetch detailed license information
    const response = await axios.get(
      `${apiServiceUrl}/api/plugins/enterprise/license`,
      { 
        headers,
        timeout: 1500 // Very short timeout for immediate failure when endpoint doesn't exist
      }
    );

    // Parse the license response
    const licenseData = response.data;
    
    // Calculate total API calls limit and usage percentage
    const totalAPICallsLimit = licenseData.eeLicenses?.reduce(
      (sum: number, license: any) => sum + (license.apiCallsLimit || 0), 
      0
    ) || 0;
    
    const apiCallsUsage = totalAPICallsLimit > 0 
      ? Math.round(((totalAPICallsLimit - licenseData.remainingAPICalls) / totalAPICallsLimit) * 100)
      : 0;

    const licenseDetails: DetailedLicenseInfo = {
      eeActive: licenseData.eeActive || false,
      remainingAPICalls: licenseData.remainingAPICalls || 0,
      eeLicenses: licenseData.eeLicenses || [],
      totalAPICallsLimit,
      apiCallsUsage
    };

    // Determine if license is valid based on enterprise edition status and remaining calls
    const isValid = licenseDetails.eeActive && licenseDetails.remainingAPICalls > 0;

    return {
      isValid,
      details: licenseDetails
    };

  } catch (error) {
    // Determine the specific error type
    let errorMessage = trans('environments.services_license_licenseInformationUnavailable');
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        errorMessage = trans('environments.services_license_licenseCheckTookTooLong');
      } else if (error.response?.status === 404) {
        errorMessage = trans('environments.services_license_licenseServiceNotAvailable');
      } else if (error.response?.status === 401) {
        errorMessage = trans('environments.services_license_authenticationRequired');
      } else if (error.response && error.response.status >= 500) {
        errorMessage = trans('environments.services_license_licenseServiceTemporarilyUnavailable');
      }
    }

    return {
      isValid: false,
      error: errorMessage
    };
  }
}

/**
 * Format API calls for display
 * @param remaining - Remaining API calls
 * @param total - Total API calls limit
 * @returns Formatted string
 */
export function formatAPICalls(remaining: number, total: number): string {
  const used = total - remaining;
  const percentage = total > 0 ? Math.round((used / total) * 100) : 0;
  
  return trans('environments.services_license_remainingAPICalls', {
    remaining: remaining.toLocaleString(),
    used: used.toLocaleString(),
    total: total.toLocaleString(),
    percentage
  });
}

/**
 * Get API calls status color based on usage percentage - using softer, less aggressive colors
 * @param remainingCalls - Remaining API calls
 * @param totalCalls - Total API calls limit
 * @returns Color string for UI components
 */
export function getAPICallsStatusColor(remainingCalls: number, totalCalls: number): string {
  if (totalCalls === 0) return '#d9d9d9'; // Unknown
  
  const usagePercentage = ((totalCalls - remainingCalls) / totalCalls) * 100;
  
  if (usagePercentage >= 90) return '#ff7875'; // Soft red - High usage
  if (usagePercentage >= 75) return '#ffc53d'; // Soft orange - Moderate usage  
  if (usagePercentage >= 50) return '#40a9ff'; // Soft blue - Normal usage
  return '#73d13d'; // Soft green - Low usage
} 