import React, { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import './ChatWindow.css';
// No longer need WebSocketContext as UseAppState handles subscriptions

const ChatWindow = ({ messages }) => { // Simple presentational component that displays messages
  const chatEndRef = useRef(null);

  // Scroll to the bottom whenever messages update.
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // NOTE: Attentions are now handled by UseAppState.jsx
  // This component just renders the messages that are passed as props

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
