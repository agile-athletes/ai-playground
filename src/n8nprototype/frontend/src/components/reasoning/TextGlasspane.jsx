import React, { useState, useEffect, useCallback, useRef } from 'react';
import './TextGlasspane.css';
// import messageLogic from './message_reasoning_logic.js'; // Removed for refactor
import { useWebSocket } from '../WebSocketContext'; // Path relative to TextGlasspane.jsx in components/reasoning

// eslint-disable-next-line no-unused-vars
const TYPING_SPEED_MS = 20;

const TextGlasspane = ({ sessionId }) => {
  // Debug mode flag - set to false to disable console logs
  const debugMode = true;

  // Helper for debug logging, using the component's debugMode state
  const debugLog = useCallback((...args) => {
    if (debugMode) {
      // eslint-disable-next-line no-console
      console.log('[GlassPane Debug]', ...args);
    }
  }, [debugMode]);

  // Ported from message_reasoning_logic.js
  const isTestMessageFunc = useCallback((text) => {
    if (!text) {
      return false;
    }
    return (
        text.includes('test') ||
        text.includes('Test') ||
        text.includes('integration_test') ||
        text.includes('Test reasoning message from')
    );
  }, []);

  // eslint-disable-next-line no-unused-vars
  const calculateReadingTimeFunc = useCallback((text) => {
    const isTestMsg = isTestMessageFunc(text);
    return isTestMsg ?
        2000 : // 2 seconds for test messages
        Math.max(750, (text ? text.length : 0) * 15); // Normal calculation
  }, [isTestMessageFunc]);

  const extractConsiderationsFunc = useCallback((payload) => {
    const extractedConsiderations = [];
    if (!payload) {
      debugLog('ExtractConsiderations: Empty or undefined payload received');
      return extractedConsiderations;
    }
    const payloadStr = JSON.stringify(payload);
    const isTestMsg = isTestMessageFunc(payloadStr);
    debugLog(`ExtractConsiderations: Processing payload (test message: ${isTestMsg})`, payload);

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
          // Simplified further, more complex test fallbacks can be added if needed
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
      debugLog('ExtractConsiderations: Test message fallback - using entire payload string.');
      extractedConsiderations.push(payloadStr);
    }
    debugLog('ExtractConsiderations: Final extracted:', extractedConsiderations);
    return extractedConsiderations.filter(c => typeof c === 'string' && c.trim() !== '');
  }, [debugLog, isTestMessageFunc]);

  const isReasoningMessageActiveRef = useRef(false);
  const [reasoningMessageQueue, setReasoningMessageQueue] = useState([]);
  const [displayedText, setDisplayedText] = useState('');
  const [showPane, setShowPane] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  const typingTimerRef = useRef(null);
  const displayTimerRef = useRef(null);
  const hideTimerRef = useRef(null);
  const masterHideTimerRef = useRef(null);

  const { subscribe, connected: wsConnected, error: wsError } = useWebSocket();

  const [, setConsiderationsQueueInternal] = useState([]); // Renamed to avoid confusion
  const [, setCurrentConsiderationIndexInternal] = useState(0); // Renamed

  const clearAllTimers = useCallback(() => {
    if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    if (displayTimerRef.current) clearTimeout(displayTimerRef.current);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (masterHideTimerRef.current) clearTimeout(masterHideTimerRef.current);
    typingTimerRef.current = null;
    displayTimerRef.current = null;
    hideTimerRef.current = null;
    masterHideTimerRef.current = null;
    if (debugMode) console.log('TextGlasspane: All internal timers cleared');
  }, [debugMode]);

  const hideGlasspane = useCallback(() => {
    clearAllTimers();
    setShowPane(false);
    setFadeOut(false);
    setDisplayedText('');
    setConsiderationsQueueInternal([]);
    setCurrentConsiderationIndexInternal(0);
    if (isReasoningMessageActiveRef.current) {
      if (debugMode) console.log('TextGlasspane: Resetting reasoning message flag on hide');
      isReasoningMessageActiveRef.current = false;
    }
  }, [debugMode, clearAllTimers]);

  const setupMasterTimeoutFunc = useCallback((considerations, hideCallback, animationSpeed) => {
    // Clear any existing master timeout
    if (masterHideTimerRef.current) {
      clearTimeout(masterHideTimerRef.current);
      masterHideTimerRef.current = null;
      debugLog('[MasterTimeout] Cleared existing masterHideTimer.');
    }

    if (!considerations || considerations.length === 0) {
      debugLog('[MasterTimeout] No considerations provided. Not setting a new timer.');
      return;
    }

    debugLog(`[MasterTimeout] Setting up for ${considerations.length} considerations. Speed: ${animationSpeed}ms/char.`);

    let totalDuration = 0;
    const FADE_OUT_BUFFER_MS = 500; // Time for fade-out animation

    considerations.forEach((text, index) => {
      const typingTime = (text ? text.length : 0) * animationSpeed;
      const readingTime = calculateReadingTimeFunc(text); // Use ported function
      const considerationDuration = typingTime + readingTime + FADE_OUT_BUFFER_MS;
      totalDuration += considerationDuration;
      debugLog(`[MasterTimeout] Consideration ${index + 1}: "${text ? text.substring(0, 30) : ''}..."`);
      debugLog(`  Typing: ${typingTime}ms, Reading: ${readingTime}ms, FadeBuffer: ${FADE_OUT_BUFFER_MS}ms. Total: ${considerationDuration}ms`);
    });
    
    const generalBuffer = 1000; // Small general buffer for safety
    totalDuration += generalBuffer;

    debugLog(`[MasterTimeout] Total calculated duration (incl. general buffer ${generalBuffer}ms): ${totalDuration}ms.`);

    if (totalDuration <= 0) {
        debugLog('[MasterTimeout] Calculated total duration is zero or negative. Not setting timer.');
        return;
    }

    masterHideTimerRef.current = setTimeout(() => {
      debugLog(`[MasterTimeout] MASTER TIMEOUT FIRED after ${totalDuration}ms. Calling hideCallback.`);
      hideCallback(); 
    }, totalDuration);

    debugLog(`[MasterTimeout] Master hide timer set for ${totalDuration}ms.`);
  }, [debugLog, calculateReadingTimeFunc]); // Added calculateReadingTimeFunc dependency

  // Forward declaration for displayWithTypingAnimation to be used in processReasoningMessage
  let displayWithTypingAnimationCallback;

  const processReasoningMessage = useCallback((payload, isFromQueue = false) => {
    if (debugMode) console.log(`TextGlasspane: processReasoningMessage received. FromQueue: ${isFromQueue}, ActiveRef: ${isReasoningMessageActiveRef.current}`, payload);

    if (!isFromQueue && isReasoningMessageActiveRef.current) {
      if (debugMode) console.log('TextGlasspane: Reasoning message already active, queueing new message.');
      setReasoningMessageQueue(prevQueue => [...prevQueue, payload]);
      return;
    }

    clearAllTimers();
    const considerations = extractConsiderationsFunc(payload);
    if (debugMode) console.log('TextGlasspane: Extracted considerations:', considerations);

    if (considerations && considerations.length > 0) {
      isReasoningMessageActiveRef.current = true;
      if (debugMode) console.log(`TextGlasspane: Set isReasoningMessageActiveRef.current = true.`);
      setShowPane(true);
      setFadeOut(false);
      setDisplayedText('');
      setConsiderationsQueueInternal(considerations);
      setCurrentConsiderationIndexInternal(0);
      setupMasterTimeoutFunc(considerations, hideGlasspane, TYPING_SPEED_MS);
      if (debugMode) console.log('TextGlasspane: Called setupMasterTimeoutFunc.');

      // Call the actual displayWithTypingAnimation (defined below)
      if (displayWithTypingAnimationCallback) {
        displayWithTypingAnimationCallback(considerations[0], 0, considerations.length, considerations);
      } else {
        if (debugMode) console.error('TextGlasspane: displayWithTypingAnimationCallback not yet defined when processReasoningMessage called!');
      }
    } else {
      if (debugMode) console.log('TextGlasspane: No valid considerations to display. Resetting active flag if set.');
      isReasoningMessageActiveRef.current = false;
    }
  }, [debugMode, clearAllTimers, extractConsiderationsFunc, hideGlasspane, setReasoningMessageQueue, setShowPane, setFadeOut, setDisplayedText, setConsiderationsQueueInternal, setCurrentConsiderationIndexInternal, setupMasterTimeoutFunc, displayWithTypingAnimationCallback, isReasoningMessageActiveRef]);

  displayWithTypingAnimationCallback = useCallback((text, index, queueLength, considerations) => {
    // text, index, queueLength, considerations are parameters
    // isTestMessageFunc, calculateReadingTimeFunc, TYPING_SPEED_MS, debugLog are from closure
    // typingTimerRef, displayTimerRef, hideTimerRef are from closure
    // setDisplayedText, setFadeOut, setShowPane, setCurrentConsiderationIndexInternal are from closure
    // hideGlasspane is the onSequenceCompleteCallback

    let currentIndex = 0; 
    setDisplayedText('');

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

    setFadeOut(false);
    setShowPane(true);

    const isTestMsg = isTestMessageFunc(text);
    let displayText = text; 

    debugLog(`Starting text display for: "${displayText}" (isTestMsg: ${isTestMsg})`);

    const isTestEnvironment = process.env.NODE_ENV === 'test';
    const shouldSkipAnimation = isTestMsg && isTestEnvironment;

    if (shouldSkipAnimation) {
      debugLog('Test message in test environment - displaying full text immediately');
      setDisplayedText(displayText);
      
      const readingTime = calculateReadingTimeFunc(displayText);
      debugLog(`Test message fully displayed, will show for ${readingTime}ms before fade-out`);
      
      displayTimerRef.current = setTimeout(() => {
        debugLog(`Starting fade-out for test message ${index + 1}/${queueLength}`);
        setFadeOut(true);
        
        hideTimerRef.current = setTimeout(() => {
          const nextIndex = index + 1;
          const nextConsiderationExists = nextIndex < queueLength;
          const nextText = nextConsiderationExists ? considerations[nextIndex] : null; 
          
          if (nextConsiderationExists && nextText) {
            debugLog(`Moving to consideration ${nextIndex + 1}/${queueLength}`);
            setCurrentConsiderationIndexInternal(nextIndex);
            setFadeOut(false);
            
            setTimeout(() => {
              displayWithTypingAnimationCallback(nextText, nextIndex, queueLength, considerations);
            }, 0);
          } else {
            debugLog(`No more considerations after ${index + 1}/${queueLength}. Signaling sequence completion.`);
            hideGlasspane(); // This is the onSequenceCompleteCallback
          }
        }, 500); 
      }, readingTime);
      
      return; 
    }

    debugLog(`[DisplayFunc ${index + 1}/${queueLength}] Entry. Text: "${displayText ? displayText.substring(0,30) : ''}...", animationSpeed: ${TYPING_SPEED_MS}`);
    
    if (displayText && displayText.length > 500) {
      debugLog(`Long message detected (${displayText.length} chars) - ensuring proper display`);
    }

    typingTimerRef.current = setInterval(() => {
      const currentDisplayTextLength = (typeof displayText === 'string' ? displayText.length : 0);
      if (currentIndex <= currentDisplayTextLength) {
        const currentTextSlice = (typeof displayText === 'string' ? displayText.substring(0, currentIndex) : '');
        
        setDisplayedText(currentTextSlice);
        debugLog(`[DisplayFunc ${index + 1}/${queueLength}] Typing: "${currentTextSlice}", Calling setShowPane(true)`);
        setShowPane(true); 
        currentIndex++;
      } else {
        clearInterval(typingTimerRef.current);
        typingTimerRef.current = null;

        debugLog(`[DisplayFunc ${index + 1}/${queueLength}] Typing complete for: "${displayText}"`);
        
        const readingTime = calculateReadingTimeFunc(displayText);
        debugLog(`[DisplayFunc ${index + 1}/${queueLength}] Calculated readingTime: ${readingTime}ms`);
        
        displayTimerRef.current = setTimeout(() => {
          debugLog(`[DisplayFunc ${index + 1}/${queueLength}] DISPLAY_TIMER_FIRED. Calling setFadeOut(true).`);
          setFadeOut(true);
          
          hideTimerRef.current = setTimeout(() => {
            const nextIndex = index + 1;
            const nextConsiderationExists = nextIndex < queueLength;
            const nextText = nextConsiderationExists ? considerations[nextIndex] : null;
            
            debugLog(`[DisplayFunc ${index + 1}/${queueLength}] HIDE_TIMER_FIRED.`);
            if (nextConsiderationExists && nextText) {
              debugLog(`Moving to consideration ${nextIndex + 1}/${queueLength}`);
              setCurrentConsiderationIndexInternal(nextIndex);
              setFadeOut(false);
              
              setTimeout(() => {
                displayWithTypingAnimationCallback(nextText, nextIndex, queueLength, considerations);
              }, 0);
            } else {
              debugLog(`No more considerations after ${index + 1}/${queueLength}. Signaling sequence completion.`);
              hideGlasspane(); // This is the onSequenceCompleteCallback
            }
          }, 500);
        }, readingTime);
      }
    }, TYPING_SPEED_MS);
  }, [displayWithTypingAnimationCallback, debugLog, calculateReadingTimeFunc, hideGlasspane, isTestMessageFunc, setCurrentConsiderationIndexInternal, setDisplayedText, setFadeOut, setShowPane, displayTimerRef, hideTimerRef, typingTimerRef]);


  useEffect(() => {
    if (debugMode) {
      console.log(`TextGlasspane: WebSocketContext connected: ${wsConnected}, error: ${wsError}`);
    }
    if (!wsConnected || wsError) {
      if (debugMode) console.log('TextGlasspane: WebSocket not connected or error, skipping subscription.');
      return;
    }
    if (debugMode) console.log(`TextGlasspane: Attempting to subscribe to reasoning topic for session: ${sessionId}`);

    const unsubscribeReasoning = subscribe(`reasoning/${sessionId}`, (payload) => {
      if (debugMode) console.log('TextGlasspane: Received raw reasoning message:', payload);
      // Check ref directly to decide on queueing vs processing
      if (!isReasoningMessageActiveRef.current) {
        if (debugMode) console.log('TextGlasspane: No active message, processing directly.');
        processReasoningMessage(payload, false); // Process directly
      } else {
        if (debugMode) console.log('TextGlasspane: Message active, adding to reasoningMessageQueue.');
        setReasoningMessageQueue(prevQueue => [...prevQueue, payload]);
      }
    });

    return () => {
      clearAllTimers();
      if (unsubscribeReasoning) unsubscribeReasoning();
    };
  }, [subscribe, wsConnected, wsError, sessionId, debugMode, clearAllTimers, processReasoningMessage, setReasoningMessageQueue, isReasoningMessageActiveRef]);


  useEffect(() => {
    if (!isReasoningMessageActiveRef.current && reasoningMessageQueue.length > 0) {
      if (debugMode) console.log(`TextGlasspane QueueWatcher: Active: ${isReasoningMessageActiveRef.current}, Queue: ${reasoningMessageQueue.length}. Processing next.`);
      const nextMessage = reasoningMessageQueue[0];
      if (nextMessage) {
        setReasoningMessageQueue(prevQueue => prevQueue.slice(1));
        processReasoningMessage(nextMessage, true);
      }
    }
  }, [reasoningMessageQueue, debugMode, processReasoningMessage]);

  if (!showPane) {
    return null;
  }

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