// src/components/InputArea.js
import React, { useState } from 'react';
import {FaArrowUp, FaPencil} from 'react-icons/fa';
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

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
            setSelectedFile(file);
        } else {
            alert('Please select a PDF file.');
        }
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
            <input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="file-picker"
            />
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type your message here..."
                onKeyDown={handleKeyDown}
                className="message-textarea"
            />
            {/* New Chat Button using react-icons */}
            <button onClick={handleNewChat} className="new-chat-button" title="New Chat">
                <FaPencil size={16} />
            </button>
            <button onClick={handleSend} className="send-button" title="Send">
                <FaArrowUp size={16} />
            </button>
        </div>
    );
};

export default InputArea;
