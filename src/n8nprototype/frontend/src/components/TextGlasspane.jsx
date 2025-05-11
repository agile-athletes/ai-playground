import React, { useState, useEffect, useRef } from 'react';
import './TextGlasspane.css';
import { useWebSocket } from './WebSocketContext';

const TextGlasspane = ({ text, isVisible }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shouldDisplay, setShouldDisplay] = useState(false);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const fullTextRef = useRef('');
  
  // Get WebSocket context for subscribing to the reasoning topic
  let webSocket = null;
  try {
    webSocket = useWebSocket();
  } catch (err) {
    // It's okay if this fails - we'll handle it gracefully
    console.warn('WebSocket context not available in TextGlasspane');
  }

  useEffect(() => {
    // Reset when text changes or visibility changes
    if (text && isVisible) {
      fullTextRef.current = text; // Store the full text in a ref
      setDisplayedText('');
      setCurrentIndex(0);
      setShouldDisplay(true);
    } else if (!isVisible) {
      // Clear when not visible
      setShouldDisplay(false);
    }
  }, [text, isVisible]);
  
  // Subscribe to the reasoning topic from WebSocket
  useEffect(() => {
    // Only attempt to subscribe if WebSocket is available
    if (!webSocket || !webSocket.subscribe) return;
    
    // Subscribe to the reasoning topic
    const unsubscribe = webSocket.subscribe('reasoning', (payload) => {
      // Only process glasspane type messages
      if (payload && payload.type === 'glasspane' && payload.consideration) {
        // Update the glasspane text
        fullTextRef.current = payload.consideration;
        setDisplayedText('');
        setCurrentIndex(0);
        setShouldDisplay(true);
      }
    });
    
    // Unsubscribe when component unmounts
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [webSocket]);

  useEffect(() => {
    // Start or stop the character-by-character animation
    if (isVisible && fullTextRef.current && currentIndex < fullTextRef.current.length) {
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // Set up new interval to add characters one by one
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prevIndex => {
          const newIndex = prevIndex + 1;
          setDisplayedText(fullTextRef.current.substring(0, newIndex));
          
          // Clear interval when we reach the end of the text
          if (newIndex >= fullTextRef.current.length) {
            clearInterval(intervalRef.current);
            // No longer automatically hiding after completion
            // Let the parent component control visibility
          }
          
          return newIndex;
        });
      }, 30); // Speed of character appearance (milliseconds) - slightly faster
    } else if (!isVisible) {
      // Clear interval when component becomes invisible
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setDisplayedText('');
      setCurrentIndex(0);
      setShouldDisplay(false);
    }

    // Capture the current values of the refs for the cleanup function
    const currentInterval = intervalRef.current;
    const currentTimeout = timeoutRef.current;

    // Cleanup interval and timeout on unmount or when dependencies change
    return () => {
      if (currentInterval) {
        clearInterval(currentInterval);
      }
      if (currentTimeout) {
        clearTimeout(currentTimeout);
      }
    };
  }, [isVisible, currentIndex]);

  if (!isVisible || !shouldDisplay) {
    return null;
  }

  return (
    <div className="text-glasspane">
      <div className="text-glasspane-content">
        <p className="trickling-text">{displayedText}</p>
      </div>
    </div>
  );
};

export default TextGlasspane;
