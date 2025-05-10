/**
 * WebSocket service for connecting to the MQTT-fed WebSocket server
 * Handles connections for the three topics: reasoning, navigation, and attentions
 */
import mqtt from 'mqtt';

// WebSocket base URL
const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'wss://ai.agile-athletes.de/mqtt';
// const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:9001/mqtt';

// TODO: REMOVE THIS FOR PRODUCTION - Test JWT token for development only
// This is a hardcoded JWT token for testing purposes only
// It matches the format used in the Python test
const TEST_JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3MTQ1NTY3MDAsImV4cCI6MTcxNDY0MzEwMCwidXNlcl9pZCI6ImRpbmVzaEBhZ2lsZS1hdGhsZXRlcy5kZSJ9.qGxEKGgVQGfGzqz7-5RLNXecnLKVGMDdM5_0tGUNRiQ';

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
   */
  connect() {
    if (this.socket) {
      this.disconnect();
    }

    try {
      console.log(`Connecting to WebSocket server at ${WS_BASE_URL}`);
      
      // The browser's WebSocket API doesn't allow setting headers directly
      // We need to make an HTTP request first with the proper Authorization header
      // This is required for the auth provider to validate the JWT token
      // TODO const httpUrl = WS_BASE_URL.replace('wss:', 'https:').replace('ws:', 'http:');
      const httpUrl = WS_BASE_URL;

      // Use fetch API with proper CORS settings
      fetch(httpUrl, {
        method: 'GET',
        mode: 'cors',
        credentials: 'include',  // Include cookies if needed
        headers: {
          'Authorization': `Bearer ${TEST_JWT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      })
      .then(response => {
        if (response.ok) {
          console.log('Authentication successful, establishing WebSocket connection');
        } else {
          console.warn(`Authentication request failed with status ${response.status}, attempting WebSocket connection anyway`);
        }
        // Proceed with WebSocket connection regardless of the response
        this.establishWebSocketConnection();
      })
      .catch(error => {
        console.warn('Authentication request failed, attempting WebSocket connection anyway:', error);
        this.establishWebSocketConnection();
      });
    } catch (error) {
      console.error('Error in connect method:', error);
      // Try to establish WebSocket connection directly as a fallback
      this.establishWebSocketConnection();
    }
  }

  /**
   * Establish the WebSocket connection after authentication
   * This is called after the HTTP request with the Authorization header
   */
  establishWebSocketConnection() {
    try {
      // Create the WebSocket connection
      // The authentication was already done via the HTTP request with the Authorization header
      // We only need to include the session ID if available
      let wsUrl = WS_BASE_URL;
      
      // Add session ID as a parameter if available
      if (this.sessionId) {
        const separator = wsUrl.includes('?') ? '&' : '?';
        wsUrl = `${wsUrl}${separator}sessionId=${encodeURIComponent(this.sessionId)}`;
      }

      console.log(`Creating WebSocket connection to ${wsUrl}`);
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = () => {
        console.log('WebSocket connected to server');
        this.connected = true;
        this.reconnectAttempts = 0;
        
        // Subscribe to all topics
        const topics = ['reasoning', 'navigation', 'attentions'];
        topics.forEach(topic => {
          const subscribeMessage = JSON.stringify({
            type: 'subscribe',
            topic: topic
          });
          this.socket.send(subscribeMessage);
          console.log(`Subscribed to topic: ${topic}`);
        });
      };

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('Received message:', message);

          // Check if the message has a topic field
          if (message && message.topic && this.callbacks[message.topic]) {
            // Extract the actual data from the message
            const data = message.data || message.payload || message;
            console.log(`Routing message to topic ${message.topic}:`, data);
            this.notifyCallbacks(message.topic, data);
          } else {
            // Try to determine the topic from the message content
            for (const topic of Object.keys(this.callbacks)) {
              if (message && (message[topic] || (message.type === topic))) {
                const data = message[topic] || message;
                console.log(`Inferred topic ${topic} from message:`, data);
                this.notifyCallbacks(topic, data);
                break;
              }
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      this.socket.onclose = (event) => {
        console.log(`WebSocket closed: ${event.code} ${event.reason}`);
        this.connected = false;

        // Attempt to reconnect if not intentionally closed
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

          console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

          this.reconnectTimeout = setTimeout(() => {
            this.connect();
          }, delay);
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect() {
    if (this.socket) {
      if (this.socket.readyState === WebSocket.OPEN) {
        // Send unsubscribe messages for all topics
        const topics = ['reasoning', 'navigation', 'attentions'];
        topics.forEach(topic => {
          try {
            const unsubscribeMessage = JSON.stringify({
              type: 'unsubscribe',
              topic: topic
            });
            this.socket.send(unsubscribeMessage);
            console.log(`Unsubscribed from topic: ${topic}`);
          } catch (error) {
            console.error(`Error unsubscribing from topic ${topic}:`, error);
          }
        });
      }
      
      this.socket.close();
      this.socket = null;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.connected = false;
    console.log('WebSocket connection closed');
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
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not open');
      return;
    }
    
    try {
      const message = JSON.stringify({
        type: 'publish',
        topic: topic,
        payload: payload
      });

      this.socket.send(message);
      console.log(`Message sent to topic ${topic}:`, payload);
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

// Connect when the service is imported
// This ensures we establish a connection as soon as possible
setTimeout(() => {
  websocketService.connect();
}, 1000); // Small delay to ensure the page is loaded

export default websocketService;
