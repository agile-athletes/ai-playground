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

  const { subscribe, connected: wsConnected, error: wsError } = useWebSocket();

  // Subscribe to the glasspane controller for state updates
  useEffect(() => {
    const unsubscribe = glasspaneController.subscribe(newState => {
      setState(newState);
    });
    
    return unsubscribe;
  }, []);

  // Subscribe to WebSocket messages
  useEffect(() => {
    if (!wsConnected || wsError) {
      console.log('TextGlasspane: WebSocket not connected or error, skipping subscription.');
      return;
    }
    console.log(`TextGlasspane: Subscribing to reasoning topic for session: ${sessionId}`);

    const unsubscribeReasoning = subscribe(`reasoning/${sessionId}`, (payload) => {
      console.log('TextGlasspane: Received raw reasoning message:', payload);
      glasspaneController.processMessage(payload);
    });

    return () => {
      if (unsubscribeReasoning) unsubscribeReasoning();
    };
  }, [subscribe, wsConnected, wsError, sessionId]);

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