import axios from 'axios';
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
        error: 'API service URL is required'
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
        timeout: 500 // Very short timeout for immediate failure when endpoint doesn't exist
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
    let errorMessage = 'License not available';
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'License check timed out';
      } else if (error.response?.status === 404) {
        errorMessage = 'License endpoint not found';
      } else if (error.response?.status === 401) {
        errorMessage = 'Unauthorized - check API key';
      } else if (error.response && error.response.status >= 500) {
        errorMessage = 'License server error';
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
  
  return `${remaining.toLocaleString()} remaining (${used.toLocaleString()}/${total.toLocaleString()} used, ${percentage}%)`;
}

/**
 * Get API calls status color based on usage percentage
 * @param remainingCalls - Remaining API calls
 * @param totalCalls - Total API calls limit
 * @returns Color string for UI components
 */
export function getAPICallsStatusColor(remainingCalls: number, totalCalls: number): string {
  if (totalCalls === 0) return '#d9d9d9'; // Unknown
  
  const usagePercentage = ((totalCalls - remainingCalls) / totalCalls) * 100;
  
  if (usagePercentage >= 90) return '#ff4d4f'; // Red - Critical
  if (usagePercentage >= 75) return '#faad14'; // Orange - Warning  
  if (usagePercentage >= 50) return '#1890ff'; // Blue - Moderate
  return '#52c41a'; // Green - Good
} 