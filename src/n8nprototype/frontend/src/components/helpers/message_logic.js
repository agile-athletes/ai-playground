import { getDebugMode } from '../WebSocketContext';

// Debug logging function
const debugEnabled = true; // Enable debug logging
function debugLog(...args) {
  if (debugEnabled) {
    console.log('[GlassPane Debug]', ...args);
  }
}

/**
 * Message Logic class to handle all the logic for the TextGlasspane component
 */
class MessageLogic {
  constructor() {
    this.typingTimer = null;
    this.displayTimer = null;
    this.hideTimer = null;
    this.masterHideTimer = null;
  }

  /**
   * Clear all timers
   */
  clearAllTimers() {
    if (this.typingTimer) {
      clearInterval(this.typingTimer);
      this.typingTimer = null;
    }
    if (this.displayTimer) {
      clearTimeout(this.displayTimer);
      this.displayTimer = null;
    }
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
    if (this.masterHideTimer) {
      clearTimeout(this.masterHideTimer);
      this.masterHideTimer = null;
    }
  }

  /**
   * Get the topic name for WebSocket subscription
   * @param {string} sessionId - The session ID
   * @returns {string} - The topic name
   */
  getTopicName(sessionId) {
    const isDebugMode = getDebugMode();
    const topicName = isDebugMode ? 'reasoning' : `reasoning/${sessionId}`;
    console.log(`Subscribing to ${topicName} topic (debug mode: ${isDebugMode ? 'enabled' : 'disabled'})`);
    return topicName;
  }

  /**
   * Check if a message is a test message
   * @param {string} text - The message text
   * @returns {boolean} - Whether the message is a test message
   */
  isTestMessage(text) {
    if (!text) {
      return false;
    }
    return (
      text.includes('Test reasoning message from') || 
      text.includes('test') || 
      text.includes('integration_test')
    );
  }

  /**
   * Calculate the reading time for a message
   * @param {string} text - The message text
   * @returns {number} - The reading time in milliseconds
   */
  calculateReadingTime(text) {
    const isTestMsg = this.isTestMessage(text);
    return isTestMsg ? 
      2000 : // 2 seconds for test messages - more consistent with other tests
      Math.max(750, text.length * 15); // Normal calculation for regular messages
  }

  /**
   * Extract considerations from different message formats
   * @param {Object} payload - The message payload
   * @returns {Array} - Array of extracted considerations
   */
  extractConsiderations(payload) {
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
    
    return extractedConsiderations;
  }

  /**
   * Check if a message has auto_close flag
   * @param {Object} payload - The message payload
   * @returns {boolean} - Whether the message has auto_close flag
   */
  hasAutoCloseFlag(payload) {
    if (!payload) {
      return false;
    }
    return payload.type === 'glasspane' && 
           payload.is_test === true && 
           payload.auto_close === true;
  }

  /**
   * Setup auto close for test messages
   * @param {Object} payload - The message payload
   * @param {Function} hideCallback - Callback to hide the glasspane
   */
  setupAutoClose(payload, hideCallback) {
    if (this.hasAutoCloseFlag(payload)) {
      console.log('Detected test message with auto_close flag - will close after standard display time');
      
      // Set a timeout to match the standard display time of other test messages
      setTimeout(() => {
        console.log('Auto-closing test message glasspane after standard display time');
        hideCallback();
      }, 3500); // Close after 3.5 seconds to match other test messages
    }
  }

  /**
   * Setup master timeout for the glasspane
   * @param {Array} considerations - The considerations to display
   * @param {Function} hideCallback - Callback to hide the glasspane
   * @param {boolean} showPane - Whether the pane is currently shown
   * @param {Function} setShowPane - Callback to set the showPane state
   * @param {Function} setFadeOut - Callback to set the fadeOut state
   * @param {Function} setDisplayedText - Callback to set the displayedText state
   * @param {Function} setConsiderationsQueue - Callback to set the considerationsQueue state
   * @param {Function} setCurrentConsiderationIndex - Callback to set the currentConsiderationIndex state
   */
  setupMasterTimeout(
    considerations, 
    hideCallback, 
    showPane, 
    setShowPane, 
    setFadeOut, 
    setDisplayedText, 
    setConsiderationsQueue, 
    setCurrentConsiderationIndex
  ) {
    // Clear any existing master timeout
    if (this.masterHideTimer) {
      clearTimeout(this.masterHideTimer);
      this.masterHideTimer = null;
    }
    
    const isTestMessage = considerations[0] && 
                          considerations[0].includes('Test reasoning message from');
    
    // For test messages, ensure they close properly but with more standard timing
    if (isTestMessage) {
      debugLog('Test message detected - setting standard close timeout');
      
      // Set a reliable master timeout
      // Use 2.5 seconds to match the reading time plus fade-out
      this.masterHideTimer = setTimeout(() => {
        debugLog('Test message timeout triggered - hiding glasspane');
        hideCallback();
      }, 2500);
      
      // Set a backup timer just in case
      setTimeout(() => {
        debugLog('Test message backup timeout triggered - checking if glasspane is still visible');
        if (showPane) {
          debugLog('Glasspane still visible - forcing hide');
          setShowPane(false);
          setFadeOut(false);
          setDisplayedText('');
          setConsiderationsQueue([]);
          setCurrentConsiderationIndex(0);
          this.clearAllTimers();
        }
      }, 3000);
    } else {
      // Normal timeout for regular messages
      const queueLength = considerations.length;
      const timeoutDuration = Math.max(5000, queueLength * 2000);
      debugLog(`Setting master timeout: ${timeoutDuration}ms for regular message`);
      
      this.masterHideTimer = setTimeout(() => {
        debugLog('Master timeout triggered - ensuring glasspane is hidden');
        hideCallback();
      }, timeoutDuration);
    }
  }

  /**
   * Setup typing animation for displaying text
   * @param {string} text - The text to display
   * @param {number} index - The current consideration index
   * @param {number} queueLength - The total number of considerations
   * @param {Array} considerations - The considerations array
   * @param {Function} setDisplayedText - Callback to set the displayedText state
   * @param {Function} setFadeOut - Callback to set the fadeOut state
   * @param {Function} setShowPane - Callback to set the showPane state
   * @param {Function} setCurrentConsiderationIndex - Callback to set the currentConsiderationIndex state
   * @param {Function} displayWithTypingAnimation - Callback to display with typing animation
   */
  setupTypingAnimation(
    text, 
    index, 
    queueLength, 
    considerations, 
    setDisplayedText, 
    setFadeOut, 
    setShowPane, 
    setCurrentConsiderationIndex, 
    displayWithTypingAnimation
  ) {
    let currentIndex = 0;
    setDisplayedText('');
    
    // Clear typing and display timers (but keep the master timer)
    if (this.typingTimer) {
      clearInterval(this.typingTimer);
      this.typingTimer = null;
    }
    if (this.displayTimer) {
      clearTimeout(this.displayTimer);
      this.displayTimer = null;
    }
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
    
    // Show the glasspane
    setFadeOut(false);
    setShowPane(true);
    
    // Create a typing animation - use consistent speed for all messages
    const animationSpeed = 20; // Standard speed for all messages
    debugLog(`Using animation speed: ${animationSpeed}ms per character`);
    
    this.typingTimer = setInterval(() => {
      if (currentIndex <= text.length) {
        // Consistent animation for all messages
        setDisplayedText(text.substring(0, currentIndex));
        currentIndex++;
      } else {
        // End of text reached, clear the interval
        clearInterval(this.typingTimer);
        this.typingTimer = null;
        
        // Calculate reading time based on text length
        const readingTime = this.calculateReadingTime(text);
        
        debugLog(`Text fully displayed, will show for ${readingTime}ms before fade-out (isTestMessage: ${this.isTestMessage(text)})`);
        
        // Set timer to start fade-out after reading time
        this.displayTimer = setTimeout(() => {
          debugLog(`Starting fade-out for consideration ${index + 1}/${queueLength}`);
          debugLog(`Using considerations array: ${JSON.stringify(considerations)}`);
          setFadeOut(true);
          
          // Set timer to move to next consideration or hide
          this.hideTimer = setTimeout(() => {
            // Check if there are more considerations to display and if the next text exists
            const nextIndex = index + 1;
            const nextConsiderationExists = nextIndex < queueLength;
            const nextText = nextConsiderationExists ? considerations[nextIndex] : null;
            
            if (nextConsiderationExists && nextText) {
              // Move to next consideration
              debugLog(`Moving to consideration ${nextIndex + 1}/${queueLength}`);
              setCurrentConsiderationIndex(nextIndex);
              setFadeOut(false);
              
              // Display the next consideration - use a setTimeout to break the synchronous call chain
              // This ensures state updates have time to propagate
              setTimeout(() => {
                displayWithTypingAnimation(nextText, nextIndex, queueLength, considerations);
              }, 0);
            } else {
              // No more considerations or next text is missing, hide the glasspane
              debugLog(`No more considerations after ${index + 1}/${queueLength}, hiding glasspane`);
              setShowPane(false);
              setFadeOut(false);
              setDisplayedText('');
              setCurrentConsiderationIndex(0);
            }
          }, 500); // Transition time for fade-out (reduced by half)
        }, readingTime);
      }
    }, animationSpeed); // Speed of character appearance
  }
}

export default new MessageLogic();
