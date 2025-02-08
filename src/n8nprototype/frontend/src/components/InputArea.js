// src/components/InputArea.js
import React, { useState } from 'react';
import {AiOutlineEnter } from 'react-icons/ai';
import {BsPencilSquare } from 'react-icons/bs';
import './InputArea.css';

const InputArea = ({ onSend, onNewChat }) => {
    const [text, setText] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);

    const handleSend = () => {
        if (text.trim() === '') return; // do not send empty messages
        onSend(text, selectedFile);
        setText('');
        setSelectedFile(null);
    };

    // Prevent sending on pressing Enter in the textarea.
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
        }
    };

    // Handle "New Chat" button click.
    const handleNewChat = () => {
        if (onNewChat) {
            onNewChat();
        }
    };

    return (
        <div className="input-area">
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type your message here..."
                onKeyDown={handleKeyDown}
                className="message-textarea"
            />
            <button onClick={handleNewChat} className="new-chat-button" title="New Chat">
                <BsPencilSquare  size={16} />
            </button>
            <button onClick={handleSend} className="send-button" title="Send">
                <AiOutlineEnter size={16} />
            </button>
        </div>
    );
};

export default InputArea;
