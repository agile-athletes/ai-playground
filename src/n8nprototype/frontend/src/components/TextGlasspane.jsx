import React, { useState, useEffect, useRef } from 'react';
import './TextGlasspane.css';
import { useWebSocket, getDebugMode } from './WebSocketContext';

// Debug logging function
const debugEnabled = true; // Enable debug logging temporarily
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
  
  // Refs for timers and content
  const typingTimerRef = useRef(null);
  const displayTimerRef = useRef(null);
  const hideTimerRef = useRef(null);
  const masterHideTimerRef = useRef(null);
  
  // Get WebSocket context for subscribing to the reasoning topic
  const webSocket = useWebSocket();

  // State to track the queue of considerations to display
  const [considerationsQueue, setConsiderationsQueue] = useState([]);
  const [currentConsiderationIndex, setCurrentConsiderationIndex] = useState(0);
  
  // Function to display text with a typing animation
  const displayWithTypingAnimation = (text, index, queueLength, considerations) => {
    // Get the current consideration index (or use the provided index)
    const considerationIndex = index !== undefined ? index : currentConsiderationIndex;
    // Get the queue length (or use the current queue length)
    const totalConsiderations = queueLength || considerationsQueue.length;
    // Use the provided considerations array or fall back to the state
    const considerationsArray = considerations || considerationsQueue;
    
    debugLog(`Starting to display consideration ${considerationIndex + 1}/${totalConsiderations}: ${text.substring(0, 30)}...`);
    
    let currentIndex = 0;
    setDisplayedText('');
    
    // Clear typing and display timers (but keep the master timer)
    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    if (displayTimerRef.current) {
      clearTimeout(displayTimerRef.current);
      displayTimerRef.current = null;
    }
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    
    // Show the glasspane
    setFadeOut(false);
    setShowPane(true);
    
    // Create a typing animation
    typingTimerRef.current = setInterval(() => {
      if (currentIndex <= text.length) {
        setDisplayedText(text.substring(0, currentIndex));
        currentIndex++;
      } else {
        // End of text reached, clear the interval
        clearInterval(typingTimerRef.current);
        typingTimerRef.current = null;
        
        // Calculate reading time based on text length (reduced by half for quicker hiding)
        const readingTime = Math.max(750, text.length * 15);
        debugLog(`Text fully displayed, will show for ${readingTime}ms before fade-out`);
        
        // Set timer to start fade-out after reading time
        displayTimerRef.current = setTimeout(() => {
          debugLog(`Starting fade-out for consideration ${considerationIndex + 1}/${totalConsiderations}`);
          debugLog(`Using considerations array: ${JSON.stringify(considerationsArray)}`);
          setFadeOut(true);
          
          // Set timer to move to next consideration or hide
          hideTimerRef.current = setTimeout(() => {
            // Check if there are more considerations to display and if the next text exists
            const nextIndex = considerationIndex + 1;
            const nextConsiderationExists = nextIndex < totalConsiderations;
            const nextText = nextConsiderationExists ? considerationsArray[nextIndex] : null;
            
            if (nextConsiderationExists && nextText) {
              // Move to next consideration
              debugLog(`Moving to consideration ${nextIndex + 1}/${totalConsiderations}`);
              setCurrentConsiderationIndex(nextIndex);
              setFadeOut(false);
              
              // Display the next consideration
              displayWithTypingAnimation(nextText, nextIndex, totalConsiderations, considerationsArray);
            } else {
              // No more considerations or next text is missing, hide the glasspane
              debugLog(`No more considerations after ${considerationIndex + 1}/${totalConsiderations}, hiding glasspane`);
              setShowPane(false);
              setFadeOut(false);
              setDisplayedText('');
              setConsiderationsQueue([]);
              setCurrentConsiderationIndex(0);
            }
          }, 500); // Transition time for fade-out (reduced by half)
        }, readingTime);
      }
    }, 30); // Speed of character appearance
  };
  
  // Function to clear all timers
  const clearAllTimers = () => {
    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    if (displayTimerRef.current) {
      clearTimeout(displayTimerRef.current);
      displayTimerRef.current = null;
    }
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (masterHideTimerRef.current) {
      clearTimeout(masterHideTimerRef.current);
      masterHideTimerRef.current = null;
    }
  };
  
  // Function to hide the glasspane
  const hideGlasspane = () => {
    debugLog('Hiding glasspane');
    clearAllTimers();
    setShowPane(false);
    setFadeOut(false);
    setDisplayedText('');
    setConsiderationsQueue([]);
    setCurrentConsiderationIndex(0);
  };
  
  // Handle text from parent component
  useEffect(() => {
    if (text && isVisible) {
      debugLog('Showing text from parent:', text);
      
      // Set up a single consideration from the parent
      setConsiderationsQueue([text]);
      setCurrentConsiderationIndex(0);
      
      // Display the text with animation
      displayWithTypingAnimation(text);
      
      // Set a master timeout to ensure the glasspane always hides
      masterHideTimerRef.current = setTimeout(() => {
        debugLog('Master timeout triggered - ensuring glasspane is hidden');
        hideGlasspane();
      }, 30000); // 30 seconds max display time as a safety measure
    } else if (!isVisible) {
      // If parent explicitly hides it
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
      
      // Clear any existing timers and reset state
      clearAllTimers();
      
      // Extract considerations from different message formats
      let extractedConsiderations = [];
      
      // Format 1: Standard glasspane format
      if (payload && payload.type === 'glasspane' && payload.consideration) {
        debugLog('Processing standard glasspane message');
        extractedConsiderations.push(payload.consideration);
      }
      // Format 2: Python test script format
      else if (payload && payload.message) {
        debugLog('Processing Python test message format');
        extractedConsiderations.push(payload.message);
      }
      // Format 3: Test reasoning message with consideration
      else if (payload && payload.consideration) {
        debugLog('Processing message with consideration field');
        extractedConsiderations.push(payload.consideration);
      }
      // Format 4: Sample-response format with reasoning array
      else if (payload && payload.reasoning && Array.isArray(payload.reasoning)) {
        debugLog(`Processing sample-response format with reasoning array of length ${payload.reasoning.length}`);
        // Extract all considerations from the reasoning array
        for (const item of payload.reasoning) {
          debugLog('Processing reasoning item:', JSON.stringify(item));
          if (item && item.value && item.value.consideration) {
            extractedConsiderations.push(item.value.consideration);
            debugLog(`Found consideration in reasoning array (${extractedConsiderations.length}):`, item.value.consideration);
          } else {
            debugLog('No consideration found in reasoning item');
          }
        }
      }
      
      // Display the considerations if we found any
      if (extractedConsiderations.length > 0) {
        debugLog(`Found ${extractedConsiderations.length} considerations to display sequentially`);
        
        // Log all extracted considerations for debugging
        extractedConsiderations.forEach((text, i) => {
          debugLog(`Consideration ${i+1}: ${text.substring(0, 50)}...`);
        });
        
        // Clear any existing master timeout
        if (masterHideTimerRef.current) {
          clearTimeout(masterHideTimerRef.current);
          masterHideTimerRef.current = null;
        }
        
        // Create a local copy of the considerations to avoid state timing issues
        const considerationsToDisplay = [...extractedConsiderations];
        const queueLength = considerationsToDisplay.length;
        
        // Update the state first
        setConsiderationsQueue(considerationsToDisplay);
        setCurrentConsiderationIndex(0);
        
        // Make sure we have at least one consideration to display
        if (queueLength > 0 && considerationsToDisplay[0]) {
          debugLog(`Starting animation sequence with ${queueLength} considerations`);
          
          // Use setTimeout to ensure state updates have completed
          setTimeout(() => {
            // Log the considerations array for debugging
            debugLog('Considerations array:', JSON.stringify(considerationsToDisplay));
            
            // Use the local copy to avoid state timing issues
            displayWithTypingAnimation(
              considerationsToDisplay[0], 
              0, 
              queueLength, 
              considerationsToDisplay
            );
            
            // Set a master timeout to ensure the glasspane always hides
            masterHideTimerRef.current = setTimeout(() => {
              debugLog('Master timeout triggered - ensuring glasspane is hidden');
              hideGlasspane();
            }, Math.max(30000, queueLength * 10000)); // Adjust timeout based on number of considerations
          }, 100); // Longer timeout to ensure state updates
        } else {
          debugLog('No valid considerations to display');
        }
      } else {
        debugLog('No displayable text found in message:', payload);
      }
    });
    
    // Cleanup function
    return () => {
      clearAllTimers();
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
