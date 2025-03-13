/**
 * Utility to get the base URL for backend API calls at runtime
 * This replaces hardcoded localhost references with the current hostname
 */

// Get the base URL for backend API calls
export const getBaseUrl = () => {
  // Get the current hostname (e.g., localhost, example.com, etc.)
  const hostname = window.location.hostname;
  
  // n8n backend port locally
  const port = '5678';
  
  // Construct the base URL using the current hostname
  return `http://${hostname}:${port}`;
};

// Get the full webhook URL with the specified path
export const getWebhookUrl = (path) => {
  return `${getBaseUrl()}/webhook/${path}`;
};
