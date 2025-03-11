import React, { useState } from 'react';
import './InputArea.css';
import SplashScreen from './SplashScreen';

const InputArea = ({ onSend, onNewChat,loading, blockLoading }) => {
    const [text, setText] = useState('');

    const handleSend = () => {
        if (text.trim() === '') return;
        onSend(text);
        setText('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="input-area">
            {loading && <SplashScreen loading={loading} blockLoading={blockLoading} />}
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                className="message-textarea"
                placeholder="Type your message..."
            />
            <button onClick={onNewChat} className="new-chat-button">
                New Chat
            </button>
            <button onClick={handleSend} className="send-button">
                Send
            </button>
        </div>
    );
};

export default InputArea;
