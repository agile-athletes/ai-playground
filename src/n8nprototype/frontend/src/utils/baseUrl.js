/**
 * Utility to provide URLs for the application
 * The app runs on https://ai-playground.agile-athletes.de/ in production
 * For localhost testing, we use different endpoints
 * 
 * Additional URL modification features:
 * - Single shot N8N test: Modifies the URL specifically for a single call to n8n.agile-athletes.de/home/workflows
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
  // Get the base URL
  const baseUrl = getBaseUrl();
  
  // Check if single shot test mode is enabled AND pending (hasn't been used yet)
  const singleShotEnabled = localStorage.getItem('singleShotN8nTest') === 'true';
  const singleShotPending = localStorage.getItem('singleShotN8nTestPending') === 'true';
  
  // Determine the webhook base URL based on whether single shot test is active
  let webhookBase;
  if (singleShotEnabled && singleShotPending) {
    console.log('Single-shot N8N test: Using webhook-test instead of webhook');
    // Clear the pending flag so this only happens once
    localStorage.removeItem('singleShotN8nTestPending');
    // Reset the setting to false
    localStorage.setItem('singleShotN8nTest', 'false');
    webhookBase = `${baseUrl}/webhook-test`;
  } else {
    webhookBase = `${baseUrl}/webhook`;
  }
  
  // If no path provided, return the base webhook URL
  if (!path) {
    return `${webhookBase}/`;
  }
  
  // Apply the localhost test prefix if needed - this is independent of the single shot test
  if (isLocalhost()) {
    // Check if this is a workflow endpoint that needs the 'test-' prefix
    if (path) {
      // This will apply the test- prefix regardless of whether single shot is active
      console.log(`Running on localhost: Adding 'test-' prefix to endpoint: ${path}`);
      return `${webhookBase}/test-${path}`;
    }
  }
  
  // Default case: return URL with the appropriate webhookBase
  return `${webhookBase}/${path}`;
};

// Special function to modify N8N workflow URLs for the single-shot test feature
export const getN8nUrl = (url) => {
  // Check if single shot test mode is enabled AND pending (hasn't been used yet)
  const singleShotEnabled = localStorage.getItem('singleShotN8nTest') === 'true';
  const singleShotPending = localStorage.getItem('singleShotN8nTestPending') === 'true';
  
  // If both conditions are met and this is the specific workflows URL
  if (singleShotEnabled && singleShotPending && url.includes('/home/workflows')) {
    // This is the target URL, append -test and clear the pending flag
    console.log('Single-shot N8N test: Modifying workflows URL to test endpoint');
    localStorage.removeItem('singleShotN8nTestPending');
    
    // Check if the URL already ends with -test (could happen with localhost prefix)
    if (url.endsWith('-test')) {
      return url; // Already has -test suffix
    }
    
    // Append -test to the URL
    return `${url}-test`;
  }
  
  // Return the original URL if conditions aren't met
  return url;
};

