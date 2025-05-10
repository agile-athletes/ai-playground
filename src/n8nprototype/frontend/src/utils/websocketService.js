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
const TEST_JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NDY4ODAwNzYuMjYwOTksImV4cCI6MTc0Njk2NjQ3Ni4yNjA5OSwidXNlcl9pZCI6ImRpbmVzaEBhZ2lsZS1hdGhsZXRlcy5kZSJ9.8pqIbrLblIwbVFb6zwC5b5v7vJCLZwgS5clY-sr3shA'

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
      // we already have a socket connection
      console.log('Already connected to WebSocket server');
      return;
    }

    try {
      // Add token and session_id as URL parameters
      const token = TEST_JWT_TOKEN;
      const urlWithParams = `${WS_BASE_URL}?auth=Bearer ${token}${this.sessionId ? `&session_id=${this.sessionId}` : ''}`;
      
      console.log(`Connecting to WebSocket server at ${urlWithParams}`);
      
      // Connect directly to the MQTT server using the mqtt.js library
      // Using URL parameters for authentication instead of headers due to CORS restrictions
      this.socket = mqtt.connect(urlWithParams, {
        protocol: 'wss'
      });
      
      // Set up event handlers for the MQTT client
      this.socket.on('connect', () => {
        console.log('MQTT client connected to server');
        this.connected = true;
        this.reconnectAttempts = 0;
        
        // Subscribe to all topics
        const topics = ['reasoning', 'navigation', 'attentions'];
        topics.forEach(topic => {
          this.socket.subscribe(topic, (err) => {
            if (!err) {
              console.log(`Subscribed to topic: ${topic}`);
            } else {
              console.error(`Error subscribing to topic ${topic}:`, err);
            }
          });
        });
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
        
        // Attempt to reconnect if not intentionally closed
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
          
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
          
          this.reconnectTimeout = setTimeout(() => {
            this.connect();
          }, delay);
        }
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

// Connect when the service is imported
// This ensures we establish a connection as soon as possible
setTimeout(() => {
  websocketService.connect();
}, 1000); // Small delay to ensure the page is loaded

export default websocketService;
