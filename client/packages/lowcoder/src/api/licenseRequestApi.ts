import axios from "axios";

export interface LicenseRequestData {
  contactData: {
    companyName: string;
    address: string;
    registerNumber: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    taxId?: string;
    vatId?: string;
    organizationId: string;
    deploymentIds: string[];
  };
  licenseType: 'per-api-calls' | 'per-instance';
  licenseData: {
    apiCallLimit?: number;
    instanceCount?: number;
    currentApiUsage?: number;
    lastMonthApiUsage?: number;
  };
  organizationId: string;
  deploymentIds: string[];
  submittedAt: string;
  submittedBy: string;
}

export interface LicenseRequestResponse {
  success: boolean;
  message: string;
  requestId?: string;
  estimatedResponseTime?: string;
}

/**
 * Submit a license request to flow.lowcoder.cloud
 * @param data The license request data
 * @returns Promise with the response
 */
export const submitLicenseRequest = async (data: LicenseRequestData): Promise<LicenseRequestResponse> => {
  try {
    // TODO: Replace with actual endpoint when available
    const response = await axios.post('https://flow.lowcoder.cloud/api/license-requests', data, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 second timeout
    });
    
    return response.data;
  } catch (error) {
    console.error('License request submission failed:', error);
    
    // For now, simulate a successful response since the endpoint doesn't exist yet
    if (axios.isAxiosError(error) && error.code === 'ECONNREFUSED') {
      // Simulate successful submission for development/testing
      return {
        success: true,
        message: 'License request submitted successfully (simulated)',
        requestId: `sim-${Date.now()}`,
        estimatedResponseTime: '24-48 hours',
      };
    }
    
    throw new Error('Failed to submit license request. Please try again later.');
  }
};

/**
 * Get the status of a license request
 * @param requestId The request ID
 * @returns Promise with the status
 */
export const getLicenseRequestStatus = async (requestId: string): Promise<any> => {
  try {
    // TODO: Replace with actual endpoint when available
    const response = await axios.get(`https://flow.lowcoder.cloud/api/license-requests/${requestId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to get license request status:', error);
    throw new Error('Failed to get request status');
  }
};
