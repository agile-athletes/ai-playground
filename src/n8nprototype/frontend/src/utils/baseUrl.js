/**
 * Utility to get the base URL for backend API calls at runtime
 * This replaces hardcoded localhost references with the current hostname
 */

// Check if test mode is enabled via URL parameter
export const isTestMode = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('test') === 'true';
};

// Get the base URL for backend API calls
export const getBaseUrl = () => {
  // Check if a backend parameter is provided in the URL
  const urlParams = new URLSearchParams(window.location.search);
  const backendParam = urlParams.get('backend');
  
  // If backend parameter is provided, use it directly
  if (backendParam) {
    // The backend parameter might be URL encoded, so decode it
    return decodeURIComponent(backendParam);
  }
  
  // Otherwise, use the default logic with current hostname
  // Get the current hostname (e.g., localhost, example.com, etc.)
  const hostname = window.location.hostname;
  
  // n8n backend port locally
  const port = '5678';
  
  // Construct the base URL using the current hostname
  return `http://${hostname}:${port}`;
};

// Get the full webhook URL with the specified path
export const getWebhookUrl = (path) => {
  const baseUrl = getBaseUrl();
  // Ensure baseUrl ends with a slash before appending webhook path
  const baseWithSlash = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  
  // Determine if we should use the test webhook endpoint
  const webhookPrefix = isTestMode() ? 'webhook-test' : 'webhook';
  
  return `${baseWithSlash}${webhookPrefix}/${path}`;
};

// TODO remove Process a workflow URL based on test mode
// export const processWorkflowUrl = (url) => {
//   if (!url) return null;
//
//   // If test mode is enabled, replace webhook with webhook-test
//   if (isTestMode()) {
//     return url.replace("/webhook/", "/webhook-test/"); // first occurrence
//   }
//
//   return url;
// };
