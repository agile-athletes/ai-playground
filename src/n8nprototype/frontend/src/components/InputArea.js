import React, { useState } from 'react';
import './InputArea.css';

const InputArea = ({ onSend }) => {
    const [text, setText] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);

    // Handle sending the message.
    const handleSend = () => {
        if (text.trim() === '') return; // do not send empty messages
        onSend(text, selectedFile);
        setText('');
        setSelectedFile(null);
    };

    // Handle file selection and only accept PDF files.
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
            <button onClick={handleSend} className="send-button" title="Send">
                ↑
            </button>
        </div>
    );
};

export default InputArea;
