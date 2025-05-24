// WebSocketContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import mqtt from 'mqtt';

// SINGLETON PATTERN: All global state for MQTT connection
// This ensures we have only one instance across the entire application
let mqttClient = null;
let isConnected = false;
let topicCallbacks = {}; // Dynamic map of topics to callbacks
let subscribedTopics = new Set(); // Track subscribed topics at module level
let initializationInProgress = false; // Prevent concurrent initialization
let debugMode = true; // Debug mode flag (no longer affects topic subscription)

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

// Function to set debug mode
function setDebugMode(enabled) {
    debugMode = enabled;
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
        // Use the same MQTT server for both localhost and production
        const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'wss://ai.agile-athletes.de/mqtt';
        debugLog(`Using MQTT server: ${WS_BASE_URL}`);
        
        // Create connection URL with auth token
        if (!authToken) {
            onError('Authentication token is missing');
            initializationInProgress = false;
            return;
        }
        
        const urlWithParams = `${WS_BASE_URL}?auth=Bearer ${authToken}${sessionId ? `&session_id=${sessionId}` : ''}`;
        debugLog(`Connecting to MQTT server: ${WS_BASE_URL}`);
        
        // Create client with stable ID - use the sessionId for consistency
        const clientId = `mqtt_${sessionId || Date.now()}`;
        debugLog(`Creating MQTT client with ID: ${clientId}`);
        
        mqttClient = mqtt.connect(urlWithParams, {
            protocol: 'wss',
            clientId: clientId,
            keepalive: 60,
            clean: true,
            reconnectPeriod: 0, // Disable automatic reconnection
            connectTimeout: 30000
        });
        
        // Set up event handlers
        mqttClient.on('connect', () => {
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
            
            // Only subscribe to topics with session ID if available
            if (sessionId && typeof sessionId === 'string' && sessionId.trim() !== '') {
                debugLog(`Using session ID for subscriptions: ${sessionId}`);
                // Subscribe to all base topics with session ID
                ['reasoning', 'workflows', 'attentions'].forEach(baseTopic => {
                    const sessionTopic = `${baseTopic}/${sessionId}`;
                    if (!subscribedTopics.has(sessionTopic)) {
                        mqttClient.subscribe(sessionTopic, {qos: 1}, (err) => {
                            if (err) {
                                console.error(`Error subscribing to session topic ${sessionTopic}:`, err);
                            } else {
                                debugLog(`Subscribed to session topic: ${sessionTopic}`);
                                subscribedTopics.add(sessionTopic);
                            }
                        });
                    }
                });
            } else {
                console.warn('No valid session ID available for MQTT subscriptions');
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
                
                // Get callbacks registered for this topic
                const callbacks = topicCallbacks[topic];
                
                // Execute callbacks if we found any
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
        if (!authToken) {
            return;
        }
        
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
                // Remove from subscribed topics if there was an error
                subscribedTopics.delete(topic);
            }
        });
        
        return true;
    };
    
    // Subscribe callback function
    // Always use session-specific topics for subscriptions (e.g., 'reasoning/sessionId')
    const subscribe = (baseTopic, callback) => {
        // Make sure we have a valid sessionId
        if (!sessionId) {
            console.error('Cannot subscribe without sessionId');
            return () => {}; // Return empty unsubscribe function
        }
        
        // Convert base topic to session-specific topic
        const topic = `${baseTopic}/${sessionId}`;
        
        // Initialize the callback map for this topic if it doesn't exist
        if (!topicCallbacks[topic]) {
            topicCallbacks[topic] = new Map();
        }
        
        // Generate a unique ID for this subscription
        const subscriptionId = `sub_${Date.now()}_${Math.random().toString(16).slice(2)}`;
        debugLog(`[WebSocketContext] Adding callback for topic: ${topic}, ID: ${subscriptionId}, current callbacks: ${topicCallbacks[topic] ? topicCallbacks[topic].size : 0}`);
        
        // Add callback to the map
        topicCallbacks[topic].set(subscriptionId, callback);
        
        // Subscribe to the MQTT topic if connected
        if (isConnected) {
            subscribeToTopic(topic);
        } else {
            // Topic will be subscribed on connection
            debugLog(`[WebSocketContext] Client not connected, ${topic} will be subscribed upon connection`);
            subscribeToTopic(topic); 
        }
        
        // Return unsubscribe function
        return () => {
            debugLog(`[WebSocketContext] Removing callback for topic: ${topic}, ID: ${subscriptionId}`);
            if (topicCallbacks[topic]) {
                topicCallbacks[topic].delete(subscriptionId);
                debugLog(`[WebSocketContext] Remaining callbacks for topic ${topic}: ${topicCallbacks[topic].size}`);
                // Note: This does not automatically unsubscribe from the MQTT topic.
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

// Export the debug mode getter and setter
export { getDebugMode, setDebugMode };