/**
 * Utility to provide URLs for the application
 * The app runs on https://ai-playground.agile-athletes.de/
 * The webhook URL is https://n8n.agile-athletes.de/webhook/
 */

// Check if test mode is enabled via URL parameter
export const isTestMode = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('test') === 'true';
};

// Get the base URL for backend API calls
export const getBaseUrl = () => {
  // For local development, check if a backend parameter is provided in the URL
  const urlParams = new URLSearchParams(window.location.search);
  const backendParam = urlParams.get('backend');
  
  if (backendParam) {
    return decodeURIComponent(backendParam);
  }
  
  // In production, use the n8n subdomain
  return 'https://n8n.agile-athletes.de';
};

// Get the full webhook URL with the specified path
export const getWebhookUrl = (path) => {
  // Always use the fixed webhook URL
  const webhookBase = 'https://n8n.agile-athletes.de/webhook';
  
  // Append the path if provided
  if (path) {
    return `${webhookBase}/${path}`;
  }
  
  return `${webhookBase}/`;
};

