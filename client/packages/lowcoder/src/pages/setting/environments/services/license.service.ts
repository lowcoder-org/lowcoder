import axios from 'axios';
import { EnvironmentLicense } from '../types/environment.types';

/**
 * Check if license endpoint exists for an environment
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

    // Use GET request to check endpoint existence
    await axios.get(
      `${apiServiceUrl}/api/plugins/enterprise/license`,
      { 
        headers,
        timeout: 500 // Very short timeout for immediate failure when endpoint doesn't exist
      }
    );

    // If we get a successful response, the endpoint exists
    return {
      isValid: true
    };

  } catch (error) {
    // Any error means the endpoint doesn't exist or isn't accessible
    return {
      isValid: false,
      error: 'License not available'
    };
  }
} 