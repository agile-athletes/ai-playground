// src/App.js
import React, { useState } from 'react';
import ChatWindow from './components/ChatWindow';
import InputArea from './components/InputArea';
import NavigationLeft from './components/NavigationLeft';
import './App.css';

function App() {
    const [messages, setMessages] = useState([]);

    const sendMessage = async (userContent, file) => {
        const userMessage = { role: 'user', content: userContent };
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);

        try {
            const response = await fetch(
                'http://localhost:5678/webhook/5b58f7ff-2c87-4850-8cce-583ee8009f04',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedMessages),
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setMessages(data);
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages((prev) => [
                ...prev,
                { role: 'system', content: 'Error: Could not send message.' },
            ]);
        }
    };

    // Clear chat (flush messages)
    const clearChat = () => {
        setMessages([]);
    };

    return (
        <div className="app-wrapper">
            <NavigationLeft />
            <div className="main-content">
                <ChatWindow messages={messages} />
                <InputArea onSend={sendMessage} onNewChat={clearChat} />
            </div>
            <div className="right-sidebar"></div>
        </div>
    );
}

export default App;
