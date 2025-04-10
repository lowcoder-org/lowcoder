import axios from 'axios';
import { message } from 'antd';
import { Environment } from '../types/environment.types';

/**
 * Fetch all environments
 * @returns Promise with environments data
 */
export async function getEnvironments(): Promise<Environment[]> {
  try {
    // The response contains the data array directly in response.data
    const response = await axios.get('/api/plugins/enterprise/environments/list');
    
    // Return the data array directly from response.data
    return response.data || [];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch environments';
    message.error(errorMessage);
    throw error;
  }
}

/**
 * Fetch a single environment by ID
 * @param id Environment ID
 * @returns Promise with environment data
 */
export async function getEnvironmentById(id: string): Promise<Environment> {
  try {
    const response = await axios.get(`/api/plugins/enterprise/environments/${id}`);
    
    if (!response.data) {
      throw new Error('Failed to fetch environment');
    }
    
    return response.data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch environment';
    message.error(errorMessage);
    throw error;
  }
}