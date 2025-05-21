/**
 * Logic for handling attention messages in the application
 * This module separates the business logic from the UI components
 */

// Debug logging function
const debugEnabled = true;
function debugLog(...args) {
  if (debugEnabled) {
    console.log('[Attention Debug]', ...args);
  }
}

class AttentionLogic {
  // constructor() {
  //   // No instance variables needed for now
  // }

  /**
   * Get the topic name for WebSocket subscription
   * @param {string} sessionId - The session ID
   * @param {boolean} debugMode - Whether debug mode is enabled
   * @returns {string} - The topic name
   */
  getTopicName(sessionId, debugMode) {
    const topicName = debugMode ? 'attentions' : `attentions/${sessionId}`;
    console.log(`Subscribing to ${topicName} topic (debug mode: ${debugMode ? 'enabled' : 'disabled'})`);
    return topicName;
  }

  /**
   * Extract attentions from different message formats
   * @param {Object} payload - The message payload
   * @returns {Array} - Array of extracted attentions
   */
  extractAttentions(payload) {
    let attentions = [];
    
    // Format 1: Direct attentions array
    if (Array.isArray(payload)) {
      debugLog('Processing direct attentions array format');
      attentions = payload;
    }
    // Format 2: Attentions in a property
    else if (payload && Array.isArray(payload.attentions)) {
      debugLog('Processing attentions property format');
      attentions = payload.attentions;
    }
    // Format 3: Single attention object
    else if (payload && payload.id && payload.name && payload.value) {
      debugLog('Processing single attention object format');
      attentions = [payload];
    }
    
    // Log the number of attentions found
    if (attentions.length > 0) {
      debugLog(`Found ${attentions.length} attentions to process`);
    } else {
      debugLog('No attentions found in payload', payload);
    }
    
    return attentions;
  }

  /**
   * Check if an attention is valid
   * @param {Object} attention - The attention object
   * @returns {boolean} - Whether the attention is valid
   */
  isValidAttention(attention) {
    if (!attention) {
      return false;
    }
    
    // An attention must have id, name, and value properties
    return (
      attention.id !== undefined && 
      attention.name !== undefined && 
      attention.value !== undefined
    );
  }

  /**
   * Sort attentions by weight (if available) or id
   * @param {Array} attentions - The attentions array
   * @returns {Array} - Sorted attentions array
   */
  sortAttentions(attentions) {
    if (!attentions || !Array.isArray(attentions)) {
      return [];
    }
    
    return [...attentions].sort((a, b) => {
      // First try to sort by weight (if available)
      if (a.weight && b.weight) {
        return parseFloat(b.weight) - parseFloat(a.weight);
      }
      
      // Fall back to sorting by id
      return a.id - b.id;
    });
  }

  /**
   * Filter attentions by a specific property value
   * @param {Array} attentions - The attentions array
   * @param {string} property - The property to filter by
   * @param {any} value - The value to filter for
   * @returns {Array} - Filtered attentions array
   */
  filterAttentions(attentions, property, value) {
    if (!attentions || !Array.isArray(attentions)) {
      return [];
    }
    
    return attentions.filter(attention => attention[property] === value);
  }

  /**
   * Group attentions by a specific property
   * @param {Array} attentions - The attentions array
   * @param {string} property - The property to group by
   * @returns {Object} - Object with property values as keys and arrays of attentions as values
   */
  groupAttentions(attentions, property) {
    if (!attentions || !Array.isArray(attentions)) {
      return {};
    }
    
    return attentions.reduce((groups, attention) => {
      const key = attention[property];
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(attention);
      return groups;
    }, {});
  }

  /**
   * Handle MQTT authentication with URL parameters
   * This addresses the CORS issues mentioned in the memory
   * @param {string} url - The WebSocket URL
   * @param {string} token - The JWT token
   * @returns {string} - The URL with authentication parameters
   */
  addAuthToWebSocketUrl(url, token) {
    if (!url) {
      return '';
    }
    
    // Add the auth parameter to the URL
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}auth=Bearer ${token}`;
  }
}

const attentionLogicInstance = new AttentionLogic();
export default attentionLogicInstance;
