/**
 * WebSocket service for connecting to the MQTT-fed WebSocket server
 * Handles connections for the three topics: reasoning, navigation, and attentions
 */
import mqtt from 'mqtt';

// WebSocket base URL
const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'wss://ai.agile-athletes.de/mqtt';
// const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:9001/mqtt';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.callbacks = {
      reasoning: [],
      navigation: [],
      attentions: []
    };
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimeout = null;
    this.sessionId = null;
  }

  /**
   * Connect to the WebSocket server and listen to all topics
   * Uses a one-shot connection with the JWT token in the WebSocket connection
   */
  connect() {
    if (this.socket) {
      this.disconnect();
    }

    try {
      let token = null;
      
      // Try to get the token from storage (localStorage or sessionStorage based on persistence setting)
      try {
        // Check if we should use localStorage (persistent) or sessionStorage (session only)
        const persistSession = localStorage.getItem('persistJwtSession') === 'true';
        const storageType = persistSession ? localStorage : sessionStorage;
        
        // First try the selected storage type
        let authData = storageType.getItem('authData');
        
        // If not found in the selected storage, try the alternative as fallback
        if (!authData) {
          const altStorageType = persistSession ? sessionStorage : localStorage;
          authData = altStorageType.getItem('authData');
          
          // If found in alternative storage, move it to the preferred storage
          if (authData) {
            console.log(`Moving auth data from ${persistSession ? 'sessionStorage' : 'localStorage'} to ${persistSession ? 'localStorage' : 'sessionStorage'}`);
            storageType.setItem('authData', authData);
            altStorageType.removeItem('authData');
          }
        }
        
        if (authData) {
          const parsedData = JSON.parse(authData);
          if (parsedData && parsedData.length > 0 && parsedData[0].token) {
            token = parsedData[0].token;
            console.log(`Using token from ${persistSession ? 'localStorage' : 'sessionStorage'} for WebSocket connection`);
          } else {
            console.log(`No token found in parsed authData from ${persistSession ? 'localStorage' : 'sessionStorage'}.`);
          }
        } else {
          console.log(`No authData found in ${persistSession ? 'localStorage' : 'sessionStorage'}.`);
        }
      } catch (error) {
        console.error('Error retrieving token from storage:', error);
      }

      // If no token is available from localStorage, we shouldn't connect.
      if (!token) {
        console.error('WebSocketService: No token available from localStorage. Connection aborted.');
        return; // Abort connection if no token
      }
      
      const urlWithParams = `${WS_BASE_URL}?auth=Bearer ${token}${this.sessionId ? `&session_id=${this.sessionId}` : ''}`;
      
      console.log(`Connecting to WebSocket server at ${WS_BASE_URL} with auth parameters`);
      
      // Connect directly to the MQTT server using the mqtt.js library
      // Using URL parameters for authentication instead of headers due to CORS restrictions
      this.socket = mqtt.connect(urlWithParams, {
        protocol: 'wss',
        reconnectPeriod: 0 // Disable automatic reconnection
      });
      
      // Set up event handlers for the MQTT client
      this.socket.on('connect', () => {
        console.log('MQTT client connected to server');
        this.connected = true;
        this.reconnectAttempts = 0;
        
        // Subscriptions are now handled by individual components calling websocketService.subscribe()
        // with their desired topic (base or session-specific).
        console.log('WebSocketService: Connection established. Ready for component subscriptions.');
      });
      
      this.socket.on('message', (topic, message) => {
        try {
          // Try to parse the message as JSON
          const messageStr = message.toString();
          const data = JSON.parse(messageStr);
          console.log(`Received message on topic ${topic}:`, data);
          
          // Route the message to the appropriate callbacks
          if (this.callbacks[topic]) {
            this.notifyCallbacks(topic, data);
          }
        } catch (error) {
          console.error('Error parsing MQTT message:', error);
        }
      });
      
      this.socket.on('error', (error) => {
        console.error('MQTT client error:', error);
      });
      
      this.socket.on('close', () => {
        console.log('MQTT connection closed');
        this.connected = false;
        
        // Automatic reconnection disabled
        console.log('Automatic reconnection is disabled. Connection will remain closed.');
      });
    } catch (error) {
      console.error('Error creating MQTT connection:', error);
    }
  }



  /**
   * Disconnect from the WebSocket server
   */
  disconnect() {
    if (this.socket) {
      if (this.socket.connected) {
        // Unsubscribe from all topics
        const topics = ['reasoning', 'navigation', 'attentions'];
        topics.forEach(topic => {
          try {
            this.socket.unsubscribe(topic, (err) => {
              if (!err) {
                console.log(`Unsubscribed from topic: ${topic}`);
              } else {
                console.error(`Error unsubscribing from topic ${topic}:`, err);
              }
            });
          } catch (error) {
            console.error(`Error unsubscribing from topic ${topic}:`, error);
          }
        });
      }
      
      // End the MQTT connection
      this.socket.end();
      this.socket = null;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.connected = false;
    console.log('MQTT connection closed');
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
    
    // Return unsubscribe function
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
    if (!this.socket || !this.socket.connected) {
      console.error('MQTT client is not connected');
      return;
    }
    
    try {
      // Convert payload to JSON string if it's an object
      const message = typeof payload === 'object' ? JSON.stringify(payload) : payload;
      
      // Publish the message to the topic
      this.socket.publish(topic, message, { qos: 1 }, (error) => {
        if (error) {
          console.error(`Error publishing message to topic ${topic}:`, error);
        } else {
          console.log(`Message sent to topic ${topic}:`, payload);
        }
      });
    } catch (error) {
      console.error(`Error sending message to topic ${topic}:`, error);
    }
  }
  
  /**
   * Set the session ID and reconnect if already connected
   * @param {string} sessionId - The session ID
   */
  setSessionId(sessionId) {
    this.sessionId = sessionId;
    console.log(`Session ID set to: ${sessionId}`);
    
    // If already connected, reconnect with the new session ID
    if (this.connected) {
      this.disconnect();
      this.connect();
    }
  }
}

// Create a singleton instance
const websocketService = new WebSocketService();

// Don't connect automatically on import
// Instead, we'll connect only when we have a valid token
// This prevents failed connection attempts in the logs

/**
 * Initialize the WebSocket connection with a valid token
 * This should be called after authentication is complete
 */
websocketService.initialize = () => {
  // Check if we have a valid token in localStorage before connecting
  try {
    const authData = localStorage.getItem('authData');
    if (authData) {
      const parsedData = JSON.parse(authData);
      if (parsedData && parsedData.length > 0 && parsedData[0].token) {
        console.log('Valid token found, initializing WebSocket connection');
        // Connect with a small delay to ensure everything is ready
        setTimeout(() => {
          websocketService.connect();
        }, 500);
        return true;
      }
    }
    console.log('No valid token found, WebSocket connection deferred');
    return false;
  } catch (error) {
    console.error('Error checking for token:', error);
    return false;
  }
};

export default websocketService;
