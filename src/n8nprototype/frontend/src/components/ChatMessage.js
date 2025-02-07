import React from 'react';
import ReactMarkdown from 'react-markdown';
import './ChatMessage.css';

const ChatMessage = ({ message }) => {
    const isUser = message.role === 'user';
    const messageClass = isUser ? 'message user-message' : 'message system-message';

    return (
        <div className={messageClass}>
            <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
    );
};

export default ChatMessage;
