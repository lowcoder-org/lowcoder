/**
 * Utility functions for environment-related features
 */

/**
 * Get the appropriate color for an environment tag based on its type
 * @param envType The environment type/stage (DEV, TEST, PREPROD, PROD)
 * @returns A color string to use with Ant Design's Tag component
 */
export const getEnvironmentTagColor = (envType: string | undefined): string => {
  if (!envType) return 'default';
  
  // Normalize to uppercase for consistent comparison
  const type = envType.toUpperCase();
  
  switch (type) {
    case 'PROD':
      return 'red'; // Red for production - indicates caution
    
    case 'PREPROD':
      return 'orange'; // Orange for pre-production
    
    case 'TEST':
      return 'purple'; // Purple for test environment
    
    case 'DEV':
      return 'blue'; // Blue for development
      
    default:
      return 'default'; // Default gray for unknown types
  }
};

/**
 * Get the appropriate background gradient for an environment based on its type
 * @param envType The environment type/stage (DEV, TEST, PREPROD, PROD)
 * @returns A CSS linear gradient string for the background
 */
export const getEnvironmentHeaderGradient = (envType: string | undefined): string => {
  if (!envType) return 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)';
  
  // Normalize to uppercase for consistent comparison
  const type = envType.toUpperCase();
  
  switch (type) {
    case 'PROD':
      return 'linear-gradient(135deg, #f5222d 0%, #fa8c16 100%)';
    
    case 'PREPROD':
      return 'linear-gradient(135deg, #fa8c16 0%, #faad14 100%)';
    
    case 'TEST':
      return 'linear-gradient(135deg, #722ed1 0%, #b37feb 100%)';
    
    case 'DEV':
      return 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)';
      
    default:
      return 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)';
  }
};

/**
 * Format an environment type for display
 * @param envType The environment type string
 * @returns Formatted environment type string
 */
export const formatEnvironmentType = (envType: string | undefined): string => {
  if (!envType) return 'TEST';
  return envType.toUpperCase();
}; 