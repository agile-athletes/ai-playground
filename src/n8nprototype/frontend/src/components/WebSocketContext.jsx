// WebSocketContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import mqtt from 'mqtt';

// SINGLETON PATTERN: All global state for MQTT connection
// This ensures we have only one instance across the entire application
let mqttClient = null;
let isConnected = false;
let topicCallbacks = { reasoning: new Map(), workflows: new Map(), attentions: new Map() };
let subscribedTopics = new Set(); // Track subscribed topics at module level
let initializationInProgress = false; // Prevent concurrent initialization
let debugMode = true; // Default to true for now to show reasoning and attentions

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
            reconnectPeriod: 5000,
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
            
            // Also subscribe to the base topics without session ID
            // This allows receiving messages from the Python test script
            if ( debugMode ) {
                ['reasoning', 'workflows', 'attentions'].forEach(baseTopic => {
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
    // Parameter 'actualMqttTopic' is the specific topic string for MQTT subscription (e.g., 'reasoning' or 'reasoning/sessionId')
    const subscribe = (actualMqttTopic, callback) => {
        // Determine the base topic key for callback registration (e.g., 'reasoning' from 'reasoning/sessionId')
        const baseTopicKey = Object.keys(topicCallbacks).find(key => actualMqttTopic.startsWith(key));

        if (!baseTopicKey) {
            debugLog(`[WebSocketContext] Cannot determine base topic key for MQTT topic ${actualMqttTopic}. Callback not registered.`);
            return () => {}; // Cannot register callback if no matching base key found
        }
        
        // Generate a unique ID for this subscription
        const subscriptionId = `sub_${Date.now()}_${Math.random().toString(16).slice(2)}`;
        debugLog(`[WebSocketContext] Adding callback for base key: ${baseTopicKey} (from actual MQTT topic: ${actualMqttTopic}), ID: ${subscriptionId}, current callbacks: ${topicCallbacks[baseTopicKey].size}`);
        
        // Add callback to the map under the determined base topic key
        topicCallbacks[baseTopicKey].set(subscriptionId, callback);
        
        // Subscribe to the actual MQTT topic if connected
        // The subscribeToTopic method handles the Set of subscribed topics to avoid duplicate MQTT subscriptions.
        if (isConnected) {
            subscribeToTopic(actualMqttTopic); // Subscribe to the specific MQTT topic (e.g., 'reasoning/sessionId')
        } else {
            // When not connected, subscribeToTopic will be called on successful connection via initializeMqttClient's 'connect' handler
            // which iterates over 'subscribedTopics'. Ensure 'actualMqttTopic' gets added to 'subscribedTopics' via 'subscribeToTopic'.
            // The current 'subscribeToTopic' adds to 'subscribedTopics' before the async call, so this should be fine.
            debugLog(`[WebSocketContext] Client not connected, ${actualMqttTopic} will be subscribed by subscribeToTopic() upon connection (callbacks registered under ${baseTopicKey})`);
            // To be certain, explicitly call subscribeToTopic here to ensure it's in the subscribedTopics set for reconnections, even if not immediately subscribing.
            // However, subscribeToTopic already checks for connection. Let's rely on its existing logic and the on-connect resubscription.
            // If subscribeToTopic is called when not connected, it logs and returns. The topic is added to subscribedTopics set by it.
            subscribeToTopic(actualMqttTopic); 
        }
        
        // Return unsubscribe function
        return () => {
            debugLog(`[WebSocketContext] Removing callback for base key: ${baseTopicKey} (from actual MQTT topic: ${actualMqttTopic}), ID: ${subscriptionId}`);
            if (topicCallbacks[baseTopicKey]) {
                topicCallbacks[baseTopicKey].delete(subscriptionId);
                debugLog(`[WebSocketContext] Remaining callbacks for base key ${baseTopicKey}: ${topicCallbacks[baseTopicKey].size}`);
                // Note: This does not automatically unsubscribe from the MQTT topic.
                // MQTT unsubscription is managed by 'subscribedTopics' and client.unsubscribe calls, which are less frequent.
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