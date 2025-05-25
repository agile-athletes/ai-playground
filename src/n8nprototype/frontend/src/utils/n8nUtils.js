/**
 * Utilities for interacting with the N8N workflow system
 */
import { getN8nUrl } from './baseUrl';

/**
 * Opens the N8N workflows page in a new tab, applying the single-shot test modification if enabled
 * This ensures the URL is properly modified with "-test" suffix when the setting is active
 */
export const openN8nWorkflows = () => {
    // Base URL for the N8N workflows interface
    let workflowsUrl = 'https://n8n.agile-athletes.de/home/workflows';
    
    // Apply the single-shot test modification if enabled
    workflowsUrl = getN8nUrl(workflowsUrl);
    
    // Log the URL we're opening
    console.log(`Opening N8N workflows URL: ${workflowsUrl}`);
    
    // Open in a new tab
    window.open(workflowsUrl, '_blank');
    
    // Reset the single-shot N8N test flag if it was used
    // This is redundant since getN8nUrl already clears the pending flag, but included for clarity
    if (localStorage.getItem('singleShotN8nTest') === 'true' && 
        !localStorage.getItem('singleShotN8nTestPending')) {
        console.log('Single-shot N8N test used, resetting setting');
        localStorage.setItem('singleShotN8nTest', 'false');
    }
};
