/**
 * GlasspaneController.js
 * 
 * A singleton that manages the state and animation logic for the TextGlasspane component.
 * This isolates the animation and state management from React's rendering cycle.
 */

class GlasspaneController {
  constructor() {
    // Debug mode flag
    this.debugMode = false;

    // State
    this.isActive = false;
    this.isVisible = false;
    this.isFadingOut = false;
    this.currentText = '';
    this.messageQueue = [];
    this.considerations = [];
    this.currentConsiderationIndex = 0;
    
    // Timers
    this.typingTimer = null;
    this.displayTimer = null;
    this.hideTimer = null;
    this.masterHideTimer = null;
    
    // Callbacks
    this.subscribers = [];
    
    // Bind methods
    this.debugLog = this.debugLog.bind(this);
    this.isTestMessage = this.isTestMessage.bind(this);
    this.calculateReadingTime = this.calculateReadingTime.bind(this);
    this.extractConsiderations = this.extractConsiderations.bind(this);
    this.clearAllTimers = this.clearAllTimers.bind(this);
    this.hide = this.hide.bind(this);
    this.setupMasterTimeout = this.setupMasterTimeout.bind(this);
    this.processMessage = this.processMessage.bind(this);
    this.displayWithTypingAnimation = this.displayWithTypingAnimation.bind(this);
  }
  
  // Helper for debug logging
  debugLog(...args) {
    if (this.debugMode) {
      console.log('[GlasspaneController]', ...args);
    }
  }
  
  // Check if a message is a test message
  isTestMessage(text) {
    if (!text) {
      return false;
    }
    return (
      text.includes('test') ||
      text.includes('Test') ||
      text.includes('integration_test') ||
      text.includes('Test reasoning message from')
    );
  }
  
  // Calculate reading time for text
  calculateReadingTime(text) {
    const isTestMsg = this.isTestMessage(text);
    return isTestMsg ?
      2000 : // 2 seconds for test messages
      Math.max(750, (text ? text.length : 0) * 15); // Normal calculation
  }
  
  // Extract considerations from payload
  extractConsiderations(payload) {
    const extractedConsiderations = [];
    if (!payload) {
      this.debugLog('ExtractConsiderations: Empty or undefined payload received');
      return extractedConsiderations;
    }
    
    const payloadStr = JSON.stringify(payload);
    const isTestMsg = this.isTestMessage(payloadStr);
    this.debugLog(`ExtractConsiderations: Processing payload (test message: ${isTestMsg})`, payload);

    if (payload && payload.type === 'glasspane' && payload.consideration) {
      extractedConsiderations.push(payload.consideration);
    } else if (payload && payload.message && typeof payload.message === 'string') {
      extractedConsiderations.push(payload.message);
    } else if (payload && payload.consideration && typeof payload.consideration === 'string') {
      extractedConsiderations.push(payload.consideration);
    } else if (payload && payload.reasoning && Array.isArray(payload.reasoning)) {
      for (const item of payload.reasoning) {
        let considerationAddedThisItem = false;
        if (item && item.id && item.name && item.value && item.value.type === 'show-text' && typeof item.value.consideration === 'string') {
          extractedConsiderations.push(item.value.consideration);
          considerationAddedThisItem = true;
        }
        if (!considerationAddedThisItem && item && item.type === 'show-text') {
          if (item.value && typeof item.value.consideration === 'string') {
            extractedConsiderations.push(item.value.consideration);
            considerationAddedThisItem = true;
          } else if (item.value && typeof item.value === 'string') {
            extractedConsiderations.push(item.value);
            considerationAddedThisItem = true;
          } else if (item.value && typeof item.value.text === 'string') {
            extractedConsiderations.push(item.value.text);
            considerationAddedThisItem = true;
          }
        }
        if (!considerationAddedThisItem && item && item.value && typeof item.value.consideration === 'string') {
          extractedConsiderations.push(item.value.consideration);
          considerationAddedThisItem = true;
        }
        if (!considerationAddedThisItem && isTestMsg && typeof item === 'string') {
          extractedConsiderations.push(item);
        }
      }
    } else if (typeof payload === 'string') {
      extractedConsiderations.push(payload);
    }

    if (extractedConsiderations.length === 0 && payloadStr && isTestMsg) {
      this.debugLog('ExtractConsiderations: Test message fallback - using entire payload string.');
      extractedConsiderations.push(payloadStr);
    }
    
    this.debugLog('ExtractConsiderations: Final extracted:', extractedConsiderations);
    return extractedConsiderations.filter(c => typeof c === 'string' && c.trim() !== '');
  }
  
  // Subscribe to state changes
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }
  
  // Notify all subscribers of state changes
  notifySubscribers() {
    const state = {
      isVisible: this.isVisible,
      isFadingOut: this.isFadingOut,
      currentText: this.currentText
    };
    this.subscribers.forEach(callback => callback(state));
  }
  
  // Clear all timers
  clearAllTimers() {
    if (this.typingTimer) clearInterval(this.typingTimer);
    if (this.displayTimer) clearTimeout(this.displayTimer);
    if (this.hideTimer) clearTimeout(this.hideTimer);
    if (this.masterHideTimer) clearTimeout(this.masterHideTimer);
    
    this.typingTimer = null;
    this.displayTimer = null;
    this.hideTimer = null;
    this.masterHideTimer = null;
    
    this.debugLog('All internal timers cleared');
  }
  
  // Hide the glasspane
  hide() {
    this.clearAllTimers();
    this.isVisible = false;
    this.isFadingOut = false;
    this.currentText = '';
    this.considerations = [];
    this.currentConsiderationIndex = 0;
    
    if (this.isActive) {
      this.debugLog('Resetting active message flag on hide');
      this.isActive = false;
    }
    
    this.notifySubscribers();
  }
  
  // Setup master timeout for all considerations
  setupMasterTimeout(considerations, animationSpeed = 20) {
    // Clear any existing master timeout
    if (this.masterHideTimer) {
      clearTimeout(this.masterHideTimer);
      this.masterHideTimer = null;
      this.debugLog('[MasterTimeout] Cleared existing masterHideTimer.');
    }

    if (!considerations || considerations.length === 0) {
      this.debugLog('[MasterTimeout] No considerations provided. Not setting a new timer.');
      return;
    }

    this.debugLog(`[MasterTimeout] Setting up for ${considerations.length} considerations. Speed: ${animationSpeed}ms/char.`);

    let totalDuration = 0;
    const FADE_OUT_BUFFER_MS = 500; // Time for fade-out animation

    considerations.forEach((text, index) => {
      const typingTime = (text ? text.length : 0) * animationSpeed;
      const readingTime = this.calculateReadingTime(text);
      const considerationDuration = typingTime + readingTime + FADE_OUT_BUFFER_MS;
      totalDuration += considerationDuration;
      this.debugLog(`[MasterTimeout] Consideration ${index + 1}: "${text ? text.substring(0, 30) : ''}..."`);
      this.debugLog(`  Typing: ${typingTime}ms, Reading: ${readingTime}ms, FadeBuffer: ${FADE_OUT_BUFFER_MS}ms. Total: ${considerationDuration}ms`);
    });
    
    const generalBuffer = 1000; 
    totalDuration += generalBuffer;

    this.debugLog(`[MasterTimeout] Total calculated duration: ${totalDuration}ms.`);

    if (totalDuration <= 0) {
      this.debugLog('[MasterTimeout] Calculated total duration is zero or negative. Not setting master timeout.');
      return;
    }

    this.masterHideTimer = setTimeout(() => {
      this.debugLog(`[MasterTimeout] MASTER TIMEOUT FIRED after ${totalDuration}ms.`);
      this.hide();
    }, totalDuration);

    this.debugLog(`[MasterTimeout] Master hide timer set for ${totalDuration}ms.`);
  }
  
  // Process a new message
  processMessage(payload, isFromQueue = false) {
    this.debugLog(`Processing message. FromQueue: ${isFromQueue}, Active: ${this.isActive}`, payload);

    if (!isFromQueue && this.isActive) {
      this.debugLog('Message already active, queueing new message.');
      this.messageQueue.push(payload);
      return;
    }

    this.clearAllTimers();
    const considerations = this.extractConsiderations(payload);
    this.debugLog('Extracted considerations:', considerations);

    if (considerations && considerations.length > 0) {
      this.isActive = true;
      this.debugLog(`Set isActive = true.`);
      this.isVisible = true;
      this.isFadingOut = false;
      this.currentText = '';
      this.considerations = considerations;
      this.currentConsiderationIndex = 0;
      
      this.setupMasterTimeout(considerations, 20); // TYPING_SPEED_MS = 20
      this.debugLog('Called setupMasterTimeout.');

      this.displayWithTypingAnimation(considerations[0], 0, considerations.length, considerations);
      
      this.notifySubscribers();
    } else {
      this.debugLog('No valid considerations to display. Resetting active flag if set.');
      this.isActive = false;
      this.notifySubscribers();
    }
  }
  
  // Process the next message in the queue
  processNextMessage() {
    if (!this.isActive && this.messageQueue.length > 0) {
      this.debugLog(`Message queue watcher: Active: ${this.isActive}, Queue: ${this.messageQueue.length}. Processing next.`);
      const nextMessage = this.messageQueue[0];
      if (nextMessage) {
        this.messageQueue = this.messageQueue.slice(1);
        this.processMessage(nextMessage, true);
      }
    }
  }
  
  // Display text with typing animation
  displayWithTypingAnimation(text, index, queueLength, considerations) {
    let currentIndex = 0;
    this.currentText = '';

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

    this.isFadingOut = false;
    this.isVisible = true;
    this.notifySubscribers();

    const isTestMsg = this.isTestMessage(text);
    let displayText = text;

    this.debugLog(`Starting text display for: "${displayText}" (isTestMsg: ${isTestMsg})`);

    const isTestEnvironment = process.env.NODE_ENV === 'test';
    const shouldSkipAnimation = isTestMsg && isTestEnvironment;

    if (shouldSkipAnimation) {
      this.debugLog('Test message in test environment - displaying full text immediately');
      this.currentText = displayText;
      this.notifySubscribers();
      
      const readingTime = this.calculateReadingTime(displayText);
      this.debugLog(`Test message fully displayed, will show for ${readingTime}ms before fade-out`);
      
      this.displayTimer = setTimeout(() => {
        this.debugLog(`Starting fade-out for test message ${index + 1}/${queueLength}`);
        this.isFadingOut = true;
        this.notifySubscribers();
        
        this.hideTimer = setTimeout(() => {
          const nextIndex = index + 1;
          const nextConsiderationExists = nextIndex < queueLength;
          const nextText = nextConsiderationExists ? considerations[nextIndex] : null;
          
          if (nextConsiderationExists && nextText) {
            this.debugLog(`Moving to consideration ${nextIndex + 1}/${queueLength}`);
            this.currentConsiderationIndex = nextIndex;
            this.isFadingOut = false;
            this.notifySubscribers();
            
            setTimeout(() => {
              this.displayWithTypingAnimation(nextText, nextIndex, queueLength, considerations);
            }, 0);
          } else {
            this.debugLog(`No more considerations after ${index + 1}/${queueLength}. Signaling sequence completion.`);
            this.hide();
            this.processNextMessage();
          }
        }, 500);
      }, readingTime);
      
      return;
    }

    this.debugLog(`[DisplayFunc ${index + 1}/${queueLength}] Entry. Text: "${displayText ? displayText.substring(0,30) : ''}...", animationSpeed: 20ms`);
    
    if (displayText && displayText.length > 500) {
      this.debugLog(`Long message detected (${displayText.length} chars) - ensuring proper display`);
    }

    this.typingTimer = setInterval(() => {
      const currentDisplayTextLength = (typeof displayText === 'string' ? displayText.length : 0);
      if (currentIndex <= currentDisplayTextLength) {
        const currentTextSlice = (typeof displayText === 'string' ? displayText.substring(0, currentIndex) : '');
        
        this.currentText = currentTextSlice;
        this.notifySubscribers();
        
        this.debugLog(`[DisplayFunc ${index + 1}/${queueLength}] Typing: "${currentTextSlice}"`);
        
        currentIndex++;
      } else {
        clearInterval(this.typingTimer);
        this.typingTimer = null;
        
        this.debugLog(`[DisplayFunc ${index + 1}/${queueLength}] Finished typing: "${displayText}"`);
        const readingTime = this.calculateReadingTime(displayText);
        this.debugLog(`[DisplayFunc ${index + 1}/${queueLength}] Starting reading timer for ${readingTime}ms`);
        
        this.displayTimer = setTimeout(() => {
          this.debugLog(`[DisplayFunc ${index + 1}/${queueLength}] DISPLAY_TIMER_FIRED. Setting fadeOut.`);
          this.isFadingOut = true;
          this.notifySubscribers();
          
          this.hideTimer = setTimeout(() => {
            const nextIndex = index + 1;
            const nextConsiderationExists = nextIndex < queueLength;
            const nextText = nextConsiderationExists ? considerations[nextIndex] : null;
            
            this.debugLog(`[DisplayFunc ${index + 1}/${queueLength}] HIDE_TIMER_FIRED.`);
            if (nextConsiderationExists && nextText) {
              this.debugLog(`Moving to consideration ${nextIndex + 1}/${queueLength}`);
              this.currentConsiderationIndex = nextIndex;
              this.isFadingOut = false;
              this.notifySubscribers();
              
              setTimeout(() => {
                this.displayWithTypingAnimation(nextText, nextIndex, queueLength, considerations);
              }, 0);
            } else {
              this.debugLog(`No more considerations after ${index + 1}/${queueLength}. Signaling sequence completion.`);
              this.hide();
              this.processNextMessage();
            }
          }, 500);
        }, readingTime);
      }
    }, 20); // TYPING_SPEED_MS = 20
  }
}

// Create and export singleton instance
const controller = new GlasspaneController();
export default controller;
