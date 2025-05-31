/**
 * WebSocket service adapter for the MQTT client
 * Uses the MQTT client from WebSocketContext instead of creating a new one
 * Provides a backward-compatible API for code that hasn't been migrated to use the React context
 */

// Import is removed as we'll use the context's mqtt client

class WebSocketService {
  constructor() {
    this.callbacks = {
      reasoning: [],
      navigation: [],
      attentions: []
    };
    this.sessionId = null;
  }

  /**
   * Connect to the WebSocket server using the WebSocketContext's MQTT client
   * This is now a no-op method since the connection is managed by the WebSocketContext
   */
  connect() {
    console.log('WebSocketService.connect() is deprecated. Connection is now managed by WebSocketContext');
    
    // The actual connection is now managed by WebSocketContext
    // This method is kept for backward compatibility
    return this.isConnected();
  }

  /**
   * Disconnect from the WebSocket server
   * This is now a no-op method since the connection is managed by the WebSocketContext
   */
  disconnect() {
    console.log('WebSocketService.disconnect() is deprecated. Connection is now managed by WebSocketContext');
    // The actual disconnection is now managed by WebSocketContext
    // This method is kept for backward compatibility
  }

  /**
   * Subscribe to messages from a specific topic
   * @param {string} topic - The topic to subscribe to
   * @param {function} callback - The callback function to be called when a message is received
   * @returns {function} - A function to unsubscribe the callback
   */
  subscribe(topic, callback) {
    if (!this.callbacks[topic]) {
      console.error(`Invalid topic: ${topic}`);
      return () => {};
    }
    
    this.callbacks[topic].push(callback);
    
    // If we have access to the WebSocketContext's subscribe function, use it
    if (window.webSocketInstance && window.webSocketInstance.subscribe) {
      // Subscribe through the context
      return window.webSocketInstance.subscribe(topic, callback);
    }
    
    // Fallback unsubscribe function if context not available
    return () => {
      const index = this.callbacks[topic].indexOf(callback);
      if (index !== -1) {
        this.callbacks[topic].splice(index, 1);
      }
    };
  }

  /**
   * Notify all callbacks for a specific topic
   * @param {string} topic - The topic
   * @param {object} data - The message data
   */
  notifyCallbacks(topic, data) {
    if (this.callbacks[topic]) {
      this.callbacks[topic].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in MQTT callback for ${topic}:`, error);
        }
      });
    }
  }

  /**
   * Send a message to a specific topic
   * @param {string} topic - The topic to send the message to
   * @param {object} payload - The message payload
   */
  send(topic, payload) {
    try {
      // Use the WebSocketContext's mqtt client if available
      if (window.mqttClientInstance) {
        // Convert payload to JSON string if it's an object
        const message = typeof payload === 'object' ? JSON.stringify(payload) : payload;
        
        // Publish using the singleton client from WebSocketContext
        window.mqttClientInstance.publish(topic, message, { qos: 1 }, (error) => {
          if (error) {
            console.error(`Error publishing message to topic ${topic}:`, error);
          } else {
            console.log(`Message sent to topic ${topic}:`, payload);
          }
        });
      } else {
        console.error('MQTT client from WebSocketContext is not available');
      }
    } catch (error) {
      console.error(`Error sending message to topic ${topic}:`, error);
    }
  }
  
  /**
   * Set the session ID
   * @param {string} sessionId - The session ID
   */
  setSessionId(sessionId) {
    this.sessionId = sessionId;
    console.log(`Session ID set to: ${sessionId}`);
    // No need to reconnect as the WebSocketContext will handle this
  }
}

// Create a singleton instance
const websocketService = new WebSocketService();

/**
 * Check if the service is connected
 * @returns {boolean} - True if connected, false otherwise
 */
websocketService.isConnected = () => {
  // Use the WebSocketContext's connected state if available
  if (window.webSocketInstance) {
    return window.webSocketInstance.connected;
  }
  return false;
};

/**
 * Initialize the WebSocket connection
 * This method is now a no-op as the connection is managed by WebSocketContext
 * Kept for backward compatibility
 */
websocketService.initialize = () => {
  console.log('WebSocketService.initialize() is deprecated. Connection is now managed by WebSocketContext');
  // The actual connection is now managed by WebSocketContext
  // This method is kept for backward compatibility
  return websocketService.isConnected();
};

export default websocketService;
