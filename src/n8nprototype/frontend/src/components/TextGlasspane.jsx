import React, { useState, useEffect, useRef, useCallback } from 'react';
import './TextGlasspane.css';
import { useWebSocket } from './WebSocketContext';
import messageLogic from './helpers/message_logic';

const TextGlasspane = ({ sessionId }) => {
  // States for animation and display
  const [displayedText, setDisplayedText] = useState('');
  const [showPane, setShowPane] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  
  // Get WebSocket context for subscribing to the reasoning topic
  const webSocket = useWebSocket();

  // State to track the queue of considerations to display
  const [considerationsQueue, setConsiderationsQueue] = useState([]);
  const [currentConsiderationIndex, setCurrentConsiderationIndex] = useState(0);
  
  // Function to clear all timers
  const clearAllTimers = useCallback(() => {
    messageLogic.clearAllTimers();
  }, []);
  
  // Function to hide the glasspane
  const hideGlasspane = useCallback(() => {
    messageLogic.clearAllTimers();
    setShowPane(false);
    setFadeOut(false);
    setDisplayedText('');
    setConsiderationsQueue([]);
    setCurrentConsiderationIndex(0);
  }, []);
  
  // Function to display text with a typing animation
  const displayWithTypingAnimation = useCallback((text, index, queueLength, considerations) => {
    // Get the current consideration index (or use the provided index)
    const considerationIndex = index !== undefined ? index : currentConsiderationIndex;
    // Get the queue length (or use the current queue length)
    const totalConsiderations = queueLength || considerationsQueue.length;
    // Use the provided considerations array or fall back to the state
    const considerationsArray = considerations || considerationsQueue;
    
    messageLogic.setupTypingAnimation(
      text,
      considerationIndex,
      totalConsiderations,
      considerationsArray,
      setDisplayedText,
      setFadeOut,
      setShowPane,
      setCurrentConsiderationIndex,
      (nextText, nextIndex, totalConsiderations, considerationsArray) => {
        displayWithTypingAnimation(nextText, nextIndex, totalConsiderations, considerationsArray);
      }
    );
  }, [considerationsQueue, currentConsiderationIndex]);
  
  // Subscribe to the reasoning topic from WebSocket
  useEffect(() => {
    if (!webSocket?.subscribe) {
      console.warn('WebSocket subscribe method not available');
      return;
    }
    
    // Get the topic name for WebSocket subscription
    const topicName = messageLogic.getTopicName(sessionId);
    
    // Subscribe to the appropriate reasoning topic
    const unsubscribe = webSocket.subscribe(topicName, (payload) => {
      // Clear any existing timers and reset state
      clearAllTimers();
      
      // Extract considerations from different message formats
      const extractedConsiderations = messageLogic.extractConsiderations(payload);
      
      // Setup auto close for test messages
      messageLogic.setupAutoClose(payload, hideGlasspane);
      
      // Display the considerations if we found any
      if (extractedConsiderations.length > 0) {
        // Create a local copy of the considerations to avoid state timing issues
        const considerationsToDisplay = [...extractedConsiderations];
        const queueLength = considerationsToDisplay.length;
        
        // Update the state first
        setConsiderationsQueue(considerationsToDisplay);
        setCurrentConsiderationIndex(0);
        
        // Make sure we have at least one consideration to display
        if (queueLength > 0 && considerationsToDisplay[0]) {
          // Use setTimeout to ensure state updates have completed
          setTimeout(() => {
            // Use the local copy to avoid state timing issues
            displayWithTypingAnimation(
              considerationsToDisplay[0], 
              0, 
              queueLength, 
              considerationsToDisplay
            );
            
            // Setup master timeout for the glasspane
            messageLogic.setupMasterTimeout(
              considerationsToDisplay,
              hideGlasspane,
              showPane,
              setShowPane,
              setFadeOut,
              setDisplayedText,
              setConsiderationsQueue,
              setCurrentConsiderationIndex
            );
          }, 100); // Longer timeout to ensure state updates
        }
      }
    });
    
    // Cleanup function
    return () => {
      clearAllTimers();
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [webSocket, displayWithTypingAnimation, hideGlasspane, sessionId, showPane, clearAllTimers]);

  // Don't render anything if we shouldn't show the pane
  if (!showPane) {
    return null;
  }

  return (
    <div 
      className={`text-glasspane ${fadeOut ? 'fade-out' : ''}`}
      onClick={hideGlasspane}
      onTouchEnd={hideGlasspane}
    >
      <div className="text-glasspane-content">
        <p className="trickling-text">{displayedText}</p>
      </div>
    </div>
  );
};

export default TextGlasspane;
