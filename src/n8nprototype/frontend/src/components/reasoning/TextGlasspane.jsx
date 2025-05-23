import React, { useState, useEffect } from 'react';
import './TextGlasspane.css';
import { useWebSocket } from '../WebSocketContext';
import glasspaneController from './GlasspaneController';

const TextGlasspane = ({ sessionId }) => {
  // State managed by the GlasspaneController singleton
  const [state, setState] = useState({
    isVisible: false,
    isFadingOut: false,
    currentText: ''
  });

  // Simple debugMode flag - set to true to use base topics
  const debugMode = true;
  const { subscribe } = useWebSocket();

  // Subscribe to the glasspane controller for state updates
  useEffect(() => {
    const unsubscribe = glasspaneController.subscribe(newState => {
      setState(newState);
    });
    
    return unsubscribe;
  }, []);

  // Subscribe to WebSocket messages
  useEffect(() => {
    // Skip if we don't have what we need
    if (!subscribe || !sessionId) return;
    
    // Simple topic determination
    const topicName = debugMode ? 'reasoning' : `reasoning/${sessionId}`;
    console.log(`TextGlasspane: Subscribing to topic: ${topicName}`);
    
    const unsubscribeReasoning = subscribe(topicName, (payload) => {
      console.log('TextGlasspane: Received reasoning message:', payload);
      glasspaneController.processMessage(payload);
    });

    return () => {
      if (unsubscribeReasoning) unsubscribeReasoning();
    };
  }, [subscribe, sessionId, debugMode]); // Include all dependencies

  if (!state.isVisible) {
    return null;
  }

  return (
    <div
      className={`text-glasspane ${state.isFadingOut ? 'fade-out' : ''}`}
      onClick={() => glasspaneController.hide()}
      onTouchEnd={() => glasspaneController.hide()}
    >
      <div className="text-glasspane-content">
        <p className="trickling-text">
          {state.currentText}
        </p>
      </div>
    </div>
  );
};

export default TextGlasspane;