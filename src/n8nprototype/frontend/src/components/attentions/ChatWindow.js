import React, { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import './ChatWindow.css';
import { useWebSocket } from '../WebSocketContext'; // Path relative to ChatWindow.js in components/attentions

const ChatWindow = ({ messages, sessionId, setMessages }) => { // Assuming setMessages to update displayed messages
  // Simple debugMode flag - set to true to use base topics
  const debugMode = true;
  const { subscribe } = useWebSocket();
  const chatEndRef = useRef(null);

  // Scroll to the bottom whenever messages update.
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Subscribe to attentions topic
  useEffect(() => {
    if (!subscribe || !sessionId) {
      console.log('ChatWindow: WebSocket service not available or sessionId missing.');
      return;
    }

    // Simple topic determination
    const topicName = debugMode ? 'attentions' : `attentions/${sessionId}`;
    console.log(`ChatWindow: Subscribing to topic: ${topicName}`);

    const handleAttentionMessage = (payload) => {
      console.log('ChatWindow: Received attention message:', payload);
      // TODO: Process the attention payload. For example, add it to messages.
      // This is a simple example; you might need more sophisticated logic
      // to format the attention or handle different types of attentions.
      if (setMessages && payload.message) { // Assuming payload has a 'message' field
        setMessages(prevMessages => [...prevMessages, { text: payload.message, sender: 'attention' }]);
      }
    };

    const unsubscribeAttentions = subscribe(topicName, handleAttentionMessage);

    return () => {
      if (unsubscribeAttentions) {
        unsubscribeAttentions();
      }
    };
  }, [subscribe, sessionId, setMessages, debugMode]); // Include all dependencies

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
