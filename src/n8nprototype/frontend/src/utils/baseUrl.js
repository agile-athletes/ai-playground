/**
 * Utility to provide URLs for the application
 * The app runs on https://ai-playground.agile-athletes.de/ in production
 * For localhost testing, we use different endpoints
 */

// Check if we're running on localhost
export const isLocalhost = () => {
  return window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' ||
         window.location.hostname.includes('192.168.');
};

// Check if test mode is enabled via URL parameter
export const isTestMode = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('test') === 'true' || isLocalhost();
};

// Get the base URL for backend API calls
export const getBaseUrl = () => {
  // For local development, check if a backend parameter is provided in the URL
  const urlParams = new URLSearchParams(window.location.search);
  const backendParam = urlParams.get('backend');
  
  if (backendParam) {
    return decodeURIComponent(backendParam);
  }
  
  // Both on localhost and in production, we use the same n8n backend
  return 'https://n8n.agile-athletes.de';
};

// Get the full webhook URL with the specified path
export const getWebhookUrl = (path) => {
  // Get the base webhook URL based on environment
  const webhookBase = `${getBaseUrl()}/webhook`;
  
  // If no path provided, return the base webhook URL
  if (!path) {
    return `${webhookBase}/`;
  }
  
  // When running on localhost, prefix with 'test-' for workflow endpoints
  if (isLocalhost()) {
    // Check if this is a workflow endpoint that needs the 'test-' prefix
    // These are typically POST endpoints like 'request-token'
    if (path) {
      console.log(`Running on localhost: Adding 'test-' prefix to endpoint: ${path}`);
      return `${webhookBase}/test-${path}`;
    }
    
    // For non-workflow endpoints, use the path as is
    return `${webhookBase}/${path}`;
  }
  
  // For production, use the regular path
  return `${webhookBase}/${path}`;
};

