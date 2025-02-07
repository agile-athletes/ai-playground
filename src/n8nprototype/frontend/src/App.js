import React, { useState } from 'react';
import ChatWindow from './components/ChatWindow';
import InputArea from './components/InputArea';
import './App.css';

function App() {
    const [messages, setMessages] = useState([]);

    /**
     * sendMessage:
     *  - Adds the user's message to the conversation.
     *  - Posts the message to the backend webhook.
     *  - Updates the conversation with the returned messages.
     */
    const sendMessage = async (userContent, file) => {
        // Create a user message object.
        const userMessage = { role: 'user', content: userContent };

        // Optimistically add the user message.
        setMessages(prev => [...prev, userMessage]);

        // Prepare payload for the backend (an array of messages).
        const payload = messages;

        try {
            const response = await fetch(
                'http://localhost:5678/webhook/5b58f7ff-2c87-4850-8cce-583ee8009f04',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(messages),
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // The backend returns the conversation with the system response.
            const data = await response.json();
            setMessages(data);
        } catch (error) {
            console.error('Error sending message:', error);
            // Optionally, add an error message to the chat.
            setMessages(prev => [
                ...prev,
                { role: 'system', content: 'Error: Could not send message.' },
            ]);
        }
    };

    return (
        <div className="app-container">
            <ChatWindow messages={messages} />
            <InputArea onSend={sendMessage} />
        </div>
    );
}

export default App;
