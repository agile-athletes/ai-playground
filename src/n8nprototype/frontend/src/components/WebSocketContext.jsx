// WebSocketContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import mqtt from 'mqtt';

// SINGLETON PATTERN: All global state for MQTT connection
// This ensures we have only one instance across the entire application
let mqttClient = null;
let isConnected = false;
let topicCallbacks = { reasoning: new Map() };
let subscribedTopics = new Set(); // Track subscribed topics at module level
let initializationInProgress = false; // Prevent concurrent initialization
let debugMode = true; // Set to true to enable detailed logging

// Debug logging function
function debugLog(...args) {
    if (debugMode) {
        console.log('[MQTT Debug]', ...args);
    }
}

// Function to get the current debug mode
function getDebugMode() {
    return debugMode;
}

// Create context
const WebSocketContext = createContext(null);

// Initialize MQTT client only once
function initializeMqttClient(authToken, sessionId, onConnect, onDisconnect, onError) {
    // Prevent concurrent initialization
    if (initializationInProgress) {
        debugLog('MQTT initialization already in progress');
        return;
    }
    
    // If already connected, don't create a new client
    if (mqttClient && isConnected) {
        debugLog('Already connected to MQTT server');
        onConnect();
        return;
    }
    
    // Set flag to prevent concurrent initialization
    initializationInProgress = true;
    debugLog('Starting MQTT client initialization');
    
    // Clean up existing client if needed
    if (mqttClient) {
        try {
            debugLog('Cleaning up existing MQTT client');
            mqttClient.end(true);
            // Clear subscriptions when we disconnect
            subscribedTopics.clear();
        } catch (err) {
            console.error('Error cleaning up MQTT client:', err);
        }
        mqttClient = null;
    }
    
    try {
        // Create connection URL with auth token
        const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'wss://ai.agile-athletes.de/mqtt';
        const urlWithParams = `${WS_BASE_URL}?auth=Bearer ${authToken}${sessionId ? `&session_id=${sessionId}` : ''}`;
        
        // Create client with stable ID - use the sessionId for consistency
        const clientId = `mqtt_${sessionId || Date.now()}`;
        debugLog(`Creating MQTT client with ID: ${clientId}`);
        
        mqttClient = mqtt.connect(urlWithParams, {
            protocol: 'wss',
            clientId: clientId,
            keepalive: 60,
            clean: true,
            reconnectPeriod: 5000,
            connectTimeout: 30000
        });
        
        // Set up event handlers
        mqttClient.on('connect', () => {
            console.log('MQTT client connected to server');
            debugLog(`MQTT client connected with ID: ${clientId}`);
            isConnected = true;
            initializationInProgress = false; // Reset initialization flag
            
            // Resubscribe to any topics we were previously subscribed to
            if (subscribedTopics.size > 0) {
                debugLog(`Resubscribing to ${subscribedTopics.size} topics:`, [...subscribedTopics]);
                subscribedTopics.forEach(topic => {
                    // We need to resubscribe after reconnection
                    mqttClient.subscribe(topic, { qos: 1 }, (err) => {
                        if (err) {
                            console.error(`Error resubscribing to topic ${topic}:`, err);
                        } else {
                            debugLog(`Resubscribed to topic: ${topic}`);
                        }
                    });
                });
            }
            
            // Also subscribe to the base topics without session ID
            // This allows receiving messages from the Python test script
            if ( debugMode ) {
                ['reasoning', 'navigation', 'attentions'].forEach(baseTopic => {
                    if (!subscribedTopics.has(baseTopic)) {
                        mqttClient.subscribe(baseTopic, {qos: 1}, (err) => {
                            if (err) {
                                console.error(`Error subscribing to base topic ${baseTopic}:`, err);
                            } else {
                                debugLog(`Subscribed to base topic: ${baseTopic}`);
                                subscribedTopics.add(baseTopic);
                            }
                        });
                    }
                });
            }
            
            onConnect();
        });
        
        mqttClient.on('message', (topic, message) => {
            try {
                // Always log received messages to help with debugging
                const messageStr = message.toString();
                debugLog(`MQTT message received on topic ${topic}:`, messageStr);
                
                const payload = JSON.parse(messageStr);
                debugLog(`Received message on topic ${topic}:`, payload);
                const callbacks = topicCallbacks[topic];
                
                if (callbacks && callbacks.size > 0) {
                    debugLog(`Executing ${callbacks.size} callbacks for topic ${topic}`);
                    callbacks.forEach(callback => {
                        try {
                            callback(payload);
                        } catch (err) {
                            console.error(`Error in callback for topic ${topic}:`, err);
                        }
                    });
                } else {
                    debugLog(`No callbacks registered for topic ${topic}`);
                }
            } catch (err) {
                console.error(`Error processing message from topic ${topic}:`, err);
            }
        });
        
        mqttClient.on('error', (err) => {
            console.error('MQTT client error:', err);
            debugLog('MQTT client error:', err);
            initializationInProgress = false; // Reset initialization flag on error
            onError(err.message);
        });
        
        mqttClient.on('close', () => {
            console.log('MQTT connection closed');
            debugLog('MQTT connection closed');
            isConnected = false;
            initializationInProgress = false; // Reset initialization flag on close
            onDisconnect();
        });
        
    } catch (err) {
        console.error('Error creating MQTT connection:', err);
        initializationInProgress = false; // Reset initialization flag on error
        onError(err.message);
    }
}

// Provider component
export function WebSocketProvider({ children, authToken, sessionId }) {
    const [connected, setConnected] = useState(isConnected);
    const [error, setError] = useState(null);
    
    // Initialize connection on mount or when auth changes
    useEffect(() => {
        if (!authToken) return;
        
        // Initialize the client
        initializeMqttClient(
            authToken,
            sessionId,
            () => setConnected(true),
            () => setConnected(false),
            (errorMsg) => setError(errorMsg)
        );
        
        // No cleanup - we want the connection to persist
    }, [authToken, sessionId]);
    
    // Subscribe to a topic (only if not already subscribed)
    const subscribeToTopic = (topic) => {
        if (!mqttClient || !isConnected) {
            debugLog(`Cannot subscribe to topic ${topic}: client not connected`);
            return false;
        }
        
        // Check if we're already subscribed to this topic
        if (subscribedTopics.has(topic)) {
            debugLog(`Already subscribed to topic: ${topic}`);
            return true; // Already subscribed is a success
        }
        
        // Mark this topic as subscribed BEFORE the async call to prevent race conditions
        // This prevents multiple subscription attempts to the same topic
        subscribedTopics.add(topic);
        debugLog(`Marking topic as subscribed: ${topic}`);
        
        // Subscribe to the topic
        mqttClient.subscribe(topic, { qos: 1 }, (err) => {
            if (err) {
                console.error(`Error subscribing to topic ${topic}:`, err);
                debugLog(`Error subscribing to topic ${topic}:`, err);
                // Remove from subscribed topics if there was an error
                subscribedTopics.delete(topic);
            } else {
                // Only log to console once per topic
                console.log(`Subscribed to topic: ${topic}`);
                debugLog(`Successfully subscribed to topic: ${topic}`);
            }
        });
        
        return true;
    };
    
    // Subscribe callback function
    const subscribe = (topic, callback) => {
        // Validate topic
        if (!topicCallbacks[topic]) {
            console.error(`Invalid topic: ${topic}`);
            return () => {};
        }
        
        // Generate a unique ID for this subscription
        const subscriptionId = `sub_${Date.now()}_${Math.random().toString(16).slice(2)}`;
        debugLog(`Adding callback for topic: ${topic}, ID: ${subscriptionId}, current callbacks: ${topicCallbacks[topic].size}`);
        
        // Add callback to the map
        topicCallbacks[topic].set(subscriptionId, callback);
        
        // Subscribe to the topic if connected
        // This will only actually subscribe if we're not already subscribed
        if (isConnected) {
            subscribeToTopic(topic);
        } else {
            debugLog(`Client not connected, will subscribe to ${topic} when connected`);
        }
        
        // Return unsubscribe function
        return () => {
            debugLog(`Removing callback for topic: ${topic}, ID: ${subscriptionId}`);
            if (topicCallbacks[topic]) {
                topicCallbacks[topic].delete(subscriptionId);
                debugLog(`Remaining callbacks for topic ${topic}: ${topicCallbacks[topic].size}`);
            }
        };
    };
    
    return (
        <WebSocketContext.Provider value={{ connected, error, subscribe }}>
            {children}
        </WebSocketContext.Provider>
    );
}

// Custom hook
export function useWebSocket() {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
}

// Export the debug mode getter
export { getDebugMode };