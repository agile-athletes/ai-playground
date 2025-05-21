import React, { useState, useEffect, useCallback, useRef } from 'react';
import './TextGlasspane.css';
import messageLogic from './message_reasoning_logic';

// Import websocketService directly to avoid importing from upper directories
import websocketService from '../../utils/websocketService';

// Simple flag to track if a reasoning message is currently being displayed
// This prevents attention messages from interrupting reasoning messages
let isReasoningMessageActive = false;

// Simple array to queue reasoning messages
let reasoningQueue = [];

const TextGlasspane = ({ sessionId }) => {
  // States for animation and display
  const [displayedText, setDisplayedText] = useState('');
  const [showPane, setShowPane] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  
  // Use websocketService directly instead of context from upper directory
  const webSocket = websocketService;

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
    
    // Reset the reasoning message flag when the glasspane is hidden
    if (isReasoningMessageActive) {
      console.log('TextGlasspane: Resetting reasoning message flag on hide');
      isReasoningMessageActive = false;
    }
  }, []);
  
  // Function to display text with a typing animation
  const displayWithTypingAnimation = useCallback((text, index, queueLength, considerations) => {
    // Get the current consideration index (or use the provided index)
    const considerationIndex = index !== undefined ? index : currentConsiderationIndex;
    // Get the queue length (or use the current queue length)
    const totalConsiderations = queueLength || considerationsQueue.length;
    // Use the provided considerations array or fall back to the state
    const considerationsArray = considerations || considerationsQueue;
    
    // Log the full text to help with debugging
    console.log(`TextGlasspane: Displaying text (${text ? text.length : 0} chars): "${text}"`);
    
    // Check if this is a test message
    const isTestMessage = text && (
      text.includes('test') || 
      text.includes('Test') || 
      text.includes('integration_test')
    );
    
    // For test messages, ensure the glasspane is visible immediately
    if (isTestMessage) {
      console.log('TextGlasspane: Processing test message, ensuring visibility');
      // Force the glasspane to be visible immediately
      setShowPane(true);
      setFadeOut(false);
    }
    
    // Ensure we have valid text to display
    const displayText = text || '';
    
    // Setup the typing animation for all messages
    // The message_reasoning_logic.js will handle special cases for test messages in test environments
    messageLogic.setupTypingAnimation(
      displayText,
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
  
  
  // Function to process reasoning messages
  const processReasoningMessage = useCallback((payload) => {
    // Clear any existing timers
    clearAllTimers();
    
    // Extract considerations from the payload
    const extractedConsiderations = messageLogic.extractConsiderations(payload);
    
    // Setup auto close for test messages
    messageLogic.setupAutoClose(payload, hideGlasspane);
    
    // Display the considerations if we found any
    if (extractedConsiderations.length > 0) {
      // Create a local copy of the considerations to avoid state timing issues
      const considerationsToDisplay = [...extractedConsiderations];
      const queueLength = considerationsToDisplay.length;
      
      // Update the state
      setConsiderationsQueue(considerationsToDisplay);
      setCurrentConsiderationIndex(0);
      
      // Make sure we have at least one consideration to display
      if (queueLength > 0 && considerationsToDisplay[0]) {
        // Force show the pane immediately
        setShowPane(true);
        console.log(`TextGlasspane: Displaying reasoning message: ${considerationsToDisplay[0]}`);
        
        // Use setTimeout to ensure state updates have completed
        setTimeout(() => {
          // Start the typing animation
          displayWithTypingAnimation(
            considerationsToDisplay[0],
            0,
            queueLength,
            considerationsToDisplay
          );
          
          // Setup master timeout
          messageLogic.setupMasterTimeout(
            considerationsToDisplay,
            () => {
              hideGlasspane();
              // Hide the glasspane when done
            },
            showPane,
            setShowPane,
            setFadeOut,
            setDisplayedText,
            setConsiderationsQueue,
            setCurrentConsiderationIndex
          );
          
          // Set a backup timer for test messages
          if (considerationsToDisplay[0].includes('test') || considerationsToDisplay[0].includes('Test')) {
            console.log('TextGlasspane: Setting backup timer for test message');
            setTimeout(() => {
              console.log('TextGlasspane: Backup timer triggered - checking if glasspane is still visible');
              if (showPane) {
                console.log('TextGlasspane: Glasspane still visible - forcing hide');
                hideGlasspane();
                // Hide the glasspane when done
              }
            }, 8000);
          }
        }, 100);
      } else {
        // No considerations to display, nothing to do
      }
    } else {
      // No considerations extracted, nothing to do
    }
  }, [clearAllTimers, hideGlasspane, showPane, displayWithTypingAnimation]);
  
  // Function to process attention messages
  const processAttentionMessage = useCallback((payload) => {
    // Clear any existing timers
    clearAllTimers();
    
    // Extract considerations from the payload
    const extractedConsiderations = messageLogic.extractConsiderations(payload);
    
    // Display the considerations if we found any
    if (extractedConsiderations.length > 0) {
      // Create a local copy of the considerations
      const considerationsToDisplay = [...extractedConsiderations];
      const queueLength = considerationsToDisplay.length;
      
      // Update the state
      setConsiderationsQueue(considerationsToDisplay);
      setCurrentConsiderationIndex(0);
      
      // Make sure we have at least one consideration to display
      if (queueLength > 0 && considerationsToDisplay[0]) {
        // Force show the pane immediately
        setShowPane(true);
        console.log(`TextGlasspane: Displaying attention message: ${considerationsToDisplay[0]}`);
        
        // Use setTimeout to ensure state updates have completed
        setTimeout(() => {
          // Display the text with typing animation
          displayWithTypingAnimation(
            considerationsToDisplay[0],
            0,
            queueLength,
            considerationsToDisplay
          );
          
          // Set a shorter timeout for attention messages
          setTimeout(() => {
            hideGlasspane();
          }, 3000);
        }, 100);
      } else {
        // No considerations to display, nothing to do
      }
    } else {
      // No considerations extracted, nothing to do
    }
  }, [clearAllTimers, hideGlasspane, displayWithTypingAnimation]);
  
  // Function to process the next message in the queue
  const processNextMessage = useCallback(() => {
    // If no messages in queue or already displaying a message, do nothing
    if (reasoningQueue.length === 0 || isReasoningMessageActive) {
      return;
    }
    
    // Get the next message from the queue
    const payload = reasoningQueue.shift();
    console.log(`TextGlasspane: Processing next reasoning message (${reasoningQueue.length} remaining)`);
    
    // Set the flag to indicate a reasoning message is active
    isReasoningMessageActive = true;
    
    // Clear any existing timers
    clearAllTimers();
    
    // Extract considerations from the payload
    const extractedConsiderations = messageLogic.extractConsiderations(payload);
    
    // Setup auto close for test messages
    messageLogic.setupAutoClose(payload, hideGlasspane);
    
    // Display the considerations if we found any
    if (extractedConsiderations.length > 0) {
      // Create a local copy of the considerations
      const considerationsToDisplay = [...extractedConsiderations];
      const queueLength = considerationsToDisplay.length;
      
      // Update the state
      setConsiderationsQueue(considerationsToDisplay);
      setCurrentConsiderationIndex(0);
      
      // Make sure we have at least one consideration to display
      if (queueLength > 0 && considerationsToDisplay[0]) {
        // Force show the pane immediately
        setShowPane(true);
        console.log(`TextGlasspane: Displaying message: ${considerationsToDisplay[0]}`);
        
        // Use setTimeout to ensure state updates have completed
        setTimeout(() => {
          // Start the typing animation
          displayWithTypingAnimation(
            considerationsToDisplay[0],
            0,
            queueLength,
            considerationsToDisplay
          );
          
          // Use the master timeout for reasoning messages
          messageLogic.setupMasterTimeout(
            considerationsToDisplay,
            () => {
              // When the timeout completes, hide the glasspane and reset the flag
              hideGlasspane();
              isReasoningMessageActive = false;
              console.log('TextGlasspane: Reasoning message complete, resetting flag');
              
              // Process the next message in the queue after a short delay
              setTimeout(processNextMessage, 500);
            },
            showPane,
            setShowPane,
            setFadeOut,
            setDisplayedText,
            setConsiderationsQueue,
            setCurrentConsiderationIndex
          );
          
          // Set a backup timer for test messages
          if (considerationsToDisplay[0].includes('test') || considerationsToDisplay[0].includes('Test')) {
            console.log('TextGlasspane: Setting backup timer for test message');
            setTimeout(() => {
              console.log('TextGlasspane: Backup timer triggered - checking if glasspane is still visible');
              if (showPane) {
                console.log('TextGlasspane: Glasspane still visible - forcing hide');
                hideGlasspane();
                isReasoningMessageActive = false;
                
                // Process the next message in the queue after a short delay
                setTimeout(processNextMessage, 500);
              }
            }, 8000);
          }
        }, 100);
      } else {
        // No considerations to display, reset flag and process next message
        isReasoningMessageActive = false;
        setTimeout(processNextMessage, 100);
      }
    } else {
      // No considerations extracted, reset flag and process next message
      isReasoningMessageActive = false;
      setTimeout(processNextMessage, 100);
    }
  }, [clearAllTimers, hideGlasspane, showPane, displayWithTypingAnimation]);

  // Subscribe to the reasoning topic from WebSocket
  useEffect(() => {
    if (!webSocket?.subscribe) {
      console.warn('WebSocket subscribe method not available');
      return;
    }
    
    // Get the topic name for WebSocket subscription
    const topicName = messageLogic.getTopicName(sessionId);
    
    // Subscribe ONLY to the reasoning topic
    const unsubscribeReasoning = webSocket.subscribe(topicName, (payload) => {
      console.log('TextGlasspane: Received reasoning message');
      
      // Add the message to the reasoning queue
      reasoningQueue.push(payload);
      
      // Try to process the message (will only process if not already displaying a message)
      processNextMessage();
    });
    
    // Cleanup function
    return () => {
      clearAllTimers();
      if (unsubscribeReasoning) {
        unsubscribeReasoning();
      }
    };
  }, [webSocket, displayWithTypingAnimation, hideGlasspane, sessionId, showPane, clearAllTimers, processNextMessage]);

  // Don't render anything if we shouldn't show the pane
  if (!showPane) {
    return null;
  }

  // Ensure the text is properly displayed without being cut off
  const textToDisplay = displayedText || '';
  
  return (
    <div 
      className={`text-glasspane ${fadeOut ? 'fade-out' : ''}`}
      onClick={hideGlasspane}
      onTouchEnd={hideGlasspane}
    >
      <div className="text-glasspane-content">
        <p className="trickling-text">
          {textToDisplay}
        </p>
      </div>
    </div>
  );
};

export default TextGlasspane;
