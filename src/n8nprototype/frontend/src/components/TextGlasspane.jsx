import React, { useState, useEffect, useRef } from 'react';
import './TextGlasspane.css';
import { useWebSocket, getDebugMode } from './WebSocketContext';

// Debug logging function
const debugEnabled = false;
function debugLog(...args) {
  if (debugEnabled) {
    console.log('[GlassPane Debug]', ...args);
  }
}

const TextGlasspane = ({ text, isVisible }) => {
  // States for animation and display
  const [displayedText, setDisplayedText] = useState('');
  const [showPane, setShowPane] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Refs for timers and full text content
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const fullTextRef = useRef('');
  
  // Get WebSocket context for subscribing to the reasoning topic
  const webSocket = useWebSocket();

  // Function to start the character-by-character animation
  const startTextAnimation = () => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Reset animation state
    setCurrentIndex(0);
    setDisplayedText('');
    
    // Set up new interval to add characters one by one
    intervalRef.current = setInterval(() => {
      setCurrentIndex(prevIndex => {
        const newIndex = prevIndex + 1;
        setDisplayedText(fullTextRef.current.substring(0, newIndex));
        
        // Clear interval when we reach the end of the text
        if (newIndex >= fullTextRef.current.length) {
          clearInterval(intervalRef.current);
          
          // Set timeout to start fade-out after a delay
          // Use a short base time and a smaller scaling factor for faster disappearance
          const readingTime = Math.max(80, fullTextRef.current.length * 10);
          debugLog(`Setting fade-out timeout for ${readingTime}ms`);
          
          timeoutRef.current = setTimeout(() => {
            debugLog('Starting fade-out animation');
            startFadeOut();
          }, readingTime);
        }
        
        return newIndex;
      });
    }, 30); // Speed of character appearance (milliseconds)
  };
  
  // Function to start the fade-out animation
  const startFadeOut = () => {
    setFadeOut(true);
    
    // Hide the glasspane completely after the CSS transition completes
    setTimeout(() => {
      hideGlasspane();
    }, 1000); // Match this with the CSS transition duration
  };
  
  // Function to hide the glasspane
  const hideGlasspane = () => {
    debugLog('Hiding glasspane');
    setShowPane(false);
    setFadeOut(false);
    setDisplayedText('');
    setCurrentIndex(0);
  };
  
  // Handle text from parent component
  useEffect(() => {
    if (text && isVisible) {
      debugLog('Showing text from parent:', text);
      fullTextRef.current = text;
      setDisplayedText('');
      setCurrentIndex(0);
      setFadeOut(false);
      setShowPane(true);
      
      // Start the character-by-character animation
      startTextAnimation();
    } else if (!isVisible && !showPane) {
      // If parent explicitly hides it and we're not showing it due to MQTT
      hideGlasspane();
    }
  }, [text, isVisible]);
  
  // Subscribe to the reasoning topic from WebSocket only in debug mode
  useEffect(() => {
    // Check if we should subscribe based on debug mode
    if (!getDebugMode()) {
      // Skip subscription when not in debug mode
      return;
    }
    
    if (!webSocket?.subscribe) {
      console.warn('WebSocket subscribe method not available');
      return;
    }
    
    // Subscribe to the reasoning topic
    const unsubscribe = webSocket.subscribe('reasoning', (payload) => {
      // Log all incoming messages for debugging
      debugLog('TextGlasspane received message:', payload);
      
      // Try to extract text content from different message formats
      let textToDisplay = null;
      
      // Format 1: Standard glasspane format
      if (payload && payload.type === 'glasspane' && payload.consideration) {
        debugLog('Processing standard glasspane message');
        textToDisplay = payload.consideration;
      }
      // Format 2: Python test script format
      else if (payload && payload.message) {
        debugLog('Processing Python test message format');
        textToDisplay = payload.message;
      }
      // Format 3: Test reasoning message with consideration
      else if (payload && payload.consideration) {
        debugLog('Processing message with consideration field');
        textToDisplay = payload.consideration;
      }
      
      // Display the text if we found any
      if (textToDisplay) {
        debugLog('Displaying text:', textToDisplay);
        
        // Clear any existing timers
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        
        // Store the full text and reset animation state
        fullTextRef.current = textToDisplay;
        setFadeOut(false);
        setShowPane(true);
        
        // Start the character-by-character animation
        startTextAnimation();
      } else {
        debugLog('No displayable text found in message:', payload);
      }
    });
    
    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [webSocket]);

  // Don't render anything if we shouldn't show the pane
  if (!showPane && !isVisible) {
    return null;
  }

  return (
    <div className={`text-glasspane ${fadeOut ? 'fade-out' : ''}`}>
      <div className="text-glasspane-content">
        <p className="trickling-text">{displayedText}</p>
      </div>
    </div>
  );
};

export default TextGlasspane;
