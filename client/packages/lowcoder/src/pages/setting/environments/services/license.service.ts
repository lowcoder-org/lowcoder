import axios from 'axios';
import { EnvironmentLicense } from '../types/environment.types';

/**
 * Check license status for an environment
 * @param apiServiceUrl - API service URL for the environment  
 * @param apiKey - API key for the environment
 * @returns Promise with license information
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

    // Make request to the license endpoint
    const response = await axios.get(
      `${apiServiceUrl}/api/plugins/enterprise/license`,
      { 
        headers,
        timeout: 10000 // 10 second timeout
      }
    );

    // If we get a successful response, the license is valid
    return {
      isValid: true
    };

  } catch (error) {
    // If the endpoint doesn't exist or returns an error, license is invalid
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        return {
          isValid: false,
          error: 'License endpoint not found'
        };
      }
      if (error.response?.status === 401 || error.response?.status === 403) {
        return {
          isValid: false,
          error: 'License authentication failed'
        };
      }
      if (error.code === 'ECONNABORTED') {
        return {
          isValid: false,
          error: 'License check timeout'
        };
      }
    }

    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'License check failed'
    };
  }
} 