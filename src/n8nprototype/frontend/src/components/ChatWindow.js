import React, { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import TextGlasspane from './TextGlasspane';
import './ChatWindow.css';

const ChatWindow = ({ messages, glassText, showGlassText }) => {
    const chatEndRef = useRef(null);

    // Scroll to the bottom whenever messages update.
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="chat-window">
            {messages.map((message, index) => (
                <ChatMessage key={index} message={message} />
            ))}
            <div ref={chatEndRef} />
            <TextGlasspane text={glassText} isVisible={showGlassText} />
        </div>
    );
};

export default ChatWindow;
