// src/components/ChatMessage.js
import React from 'react';
import ReactMarkdown from 'react-markdown';
import './ChatMessage.css';

const ChatMessage = ({ message }) => {
    const isUser = message.role === 'user';
    const containerClass = isUser ? 'message-container user' : 'message-container system';

    return (
        <div className={containerClass}>
            <div className="message-bubble">
                <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
        </div>
    );
};

export default ChatMessage;
