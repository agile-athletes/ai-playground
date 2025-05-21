import React, { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import './ChatWindow.css';
import { useWebSocket } from '../WebSocketContext'; // Path relative to ChatWindow.js in components/attentions

const ChatWindow = ({ messages, sessionId, setMessages }) => { // Assuming setMessages to update displayed messages
  // TODO: Make debugMode a prop or configurable if needed
  const debugMode = false;
  const { subscribe, connected: wsConnected, error: wsError } = useWebSocket();
  const chatEndRef = useRef(null);

    // Scroll to the bottom whenever messages update.
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

  // Subscribe to attentions topic
  useEffect(() => {
    // Log WebSocket connection status from context
    if (debugMode && (wsError || !wsConnected)) { // Log only if there's an issue or still connecting with debug on
        console.log(`ChatWindow: WebSocketContext connected: ${wsConnected}, error: ${wsError}, sessionId available: ${!!sessionId}`);
    }

    if (!subscribe || !sessionId) {
      if (debugMode || !sessionId) console.log('ChatWindow: WebSocket service not available or sessionId missing.');
      return;
    }

    const topicToSubscribe = debugMode ? 'attentions' : `attentions/${sessionId}`;
    if (debugMode) {
      console.log(`ChatWindow: DEBUG MODE ON - Subscribing to base topic: ${topicToSubscribe}`);
    } else {
      console.log(`ChatWindow: DEBUG MODE OFF - Subscribing to session-specific topic: ${topicToSubscribe}`);
    }

    const handleAttentionMessage = (payload) => {
      console.log('ChatWindow: Received attention message:', payload);
      // TODO: Process the attention payload. For example, add it to messages.
      // This is a simple example; you might need more sophisticated logic
      // to format the attention or handle different types of attentions.
      if (setMessages && payload.message) { // Assuming payload has a 'message' field
        setMessages(prevMessages => [...prevMessages, { text: payload.message, sender: 'attention' }]);
      }
    };

    const unsubscribeAttentions = subscribe(topicToSubscribe, handleAttentionMessage);

    return () => {
      if (unsubscribeAttentions) {
        unsubscribeAttentions();
      }
    };
  }, [subscribe, wsConnected, wsError, sessionId, debugMode, setMessages]);

    return (
        <div className="chat-window">
            {messages.map((message, index) => (
                <ChatMessage key={index} message={message} />
            ))}
            <div ref={chatEndRef} />
        </div>
    );
};

export default ChatWindow;
