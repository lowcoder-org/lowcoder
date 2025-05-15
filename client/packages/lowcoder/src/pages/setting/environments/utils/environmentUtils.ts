/**
 * Utility functions for environment-related features
 */

/**
 * Get the appropriate color for an environment tag based on its type
 * @param envType The environment type/stage (e.g. 'PROD', 'DEV', 'STAGING')
 * @returns A color string to use with Ant Design's Tag component
 */
export const getEnvironmentTagColor = (envType: string | undefined): string => {
  if (!envType) return 'default';
  
  // Normalize to uppercase for consistent comparison
  const type = envType.toUpperCase();
  
  switch (type) {
    // Production environment
    case 'PROD':
      return 'red'; // Red for production - indicates caution
    
    // Pre-production environment
    case 'PREPROD':
      return 'orange'; // Orange for pre-production
    
    // Test environment
    case 'TEST':
      return 'purple'; // Purple for test environment
    
    // Development environment
    case 'DEV':
      return 'green'; // Green for development - safe to use
      
    default:
      return 'default'; // Default gray for unknown types
  }
};

/**
 * Format an environment type for display
 * @param envType The environment type string
 * @returns Formatted environment type string
 */
export const formatEnvironmentType = (envType: string | undefined): string => {
  if (!envType) return 'UNKNOWN';
  return envType.toUpperCase();
}; 