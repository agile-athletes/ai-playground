// WebSocketContext.js
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import mqtt from 'mqtt';

const WebSocketContext = createContext(null);

export function WebSocketProvider({ children, authToken, sessionId }) {
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState(null);
    const clientRef = useRef(null);
    // Only focus on the reasoning topic for glasspane
    const topicSubscribersRef = useRef({
        reasoning: 0
    });
    const topicCallbacksRef = useRef({
        reasoning: new Map()
    });

    // Connect to WebSocket
    useEffect(() => {
        if (!authToken) return;

        const connect = () => {
            try {
                const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'wss://ai.agile-athletes.de/mqtt';
                const urlWithParams = `${WS_BASE_URL}?auth=Bearer ${authToken}${sessionId ? `&session_id=${sessionId}` : ''}`;

                clientRef.current = mqtt.connect(urlWithParams, {
                    protocol: 'wss',
                    clientId: `mqtt_client_${Math.random().toString(16).slice(2, 10)}`,
                    keepalive: 60,
                    clean: true,
                    reconnectPeriod: 5000, // Auto reconnect every 5 seconds
                    connectTimeout: 30000
                });

                clientRef.current.on('connect', () => {
                    console.log('MQTT client connected to server');
                    setConnected(true);
                    setError(null);

                    // Subscribe to topics that have subscribers
                    Object.entries(topicSubscribersRef.current).forEach(([topic, count]) => {
                        if (count > 0) {
                            subscribeToTopic(topic);
                        }
                    });
                });

                clientRef.current.on('message', (topic, message) => {
                    try {
                        const payload = JSON.parse(message.toString());
                        const callbacks = topicCallbacksRef.current[topic];

                        if (callbacks) {
                            callbacks.forEach(callback => {
                                try {
                                    callback(payload);
                                } catch (err) {
                                    console.error(`Error in callback for topic ${topic}:`, err);
                                }
                            });
                        }
                    } catch (err) {
                        console.error(`Error processing message from topic ${topic}:`, err);
                    }
                });

                clientRef.current.on('error', (err) => {
                    console.error('MQTT client error:', err);
                    setError(err.message);
                });

                clientRef.current.on('close', () => {
                    console.log('MQTT connection closed');
                    setConnected(false);
                });
            } catch (err) {
                console.error('Error creating MQTT connection:', err);
                setError(err.message);
                setConnected(false);
            }
        };

        connect();

        return () => {
            if (clientRef.current) {
                clientRef.current.end();
                clientRef.current = null;
                setConnected(false);
            }
        };
    }, [authToken, sessionId]);

    // Subscribe to a topic
    const subscribeToTopic = (topic) => {
        if (!clientRef.current || !clientRef.current.connected) return;

        clientRef.current.subscribe(topic, { qos: 1 }, (err) => {
            if (err) {
                console.error(`Error subscribing to topic ${topic}:`, err);
            } else {
                console.log(`Subscribed to topic: ${topic}`);
            }
        });
    };

    // Subscribe callback to a topic
    const subscribe = (topic, callback) => {
        if (!topicCallbacksRef.current[topic]) {
            console.error(`Invalid topic: ${topic}`);
            return () => {};
        }

        // Generate a unique ID for this subscription
        const subscriptionId = Math.random().toString(16).slice(2);

        // Add callback to the map
        topicCallbacksRef.current[topic].set(subscriptionId, callback);

        // Increment subscriber count
        topicSubscribersRef.current[topic]++;

        // If this is the first subscriber, subscribe to the MQTT topic
        if (topicSubscribersRef.current[topic] === 1 && clientRef.current && clientRef.current.connected) {
            subscribeToTopic(topic);
        }

        // Return unsubscribe function
        return () => {
            // Remove callback
            topicCallbacksRef.current[topic].delete(subscriptionId);

            // Decrement subscriber count
            topicSubscribersRef.current[topic]--;

            // If no more subscribers, unsubscribe from the MQTT topic
            if (topicSubscribersRef.current[topic] === 0 && clientRef.current && clientRef.current.connected) {
                clientRef.current.unsubscribe(topic);
                console.log(`Unsubscribed from topic: ${topic}`);
            }
        };
    };

    // WebSocket is only for subscribing, not for sending messages

    return (
        <WebSocketContext.Provider value={{ connected, error, subscribe }}>
            {children}
        </WebSocketContext.Provider>
    );
}

// Custom hook to use the WebSocket context
export function useWebSocket() {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
}