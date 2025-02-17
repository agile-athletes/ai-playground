// src/App.js
import React, { useState } from 'react';
import ChatWindow from './components/ChatWindow';
import InputArea from './components/InputArea';
import NavigationLeft from './components/NavigationLeft';
import { parseJsonStringWithOpenAiTics, testDataAsJson } from './components/helpers/json_helper'
import { JsonToMarkdownConverter } from './components/helpers/json_to_markdown'
import './App.css';

function App() {
    const [messages, setMessages] = useState([]);
    const [mock] = useState(false)

    function addMessageToMessages(newMessage) {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
    }

    const sendMessage = async (userContent) => {
        const userMessage = { role: 'user', content: userContent };
        addMessageToMessages(userMessage);

        try {
            var data_as_json;
            if (mock) {
                data_as_json = testDataAsJson()
            }
            else {
                const response = await fetch(
                    'http://localhost:5678/webhook/98772d9f-9897-4030-935b-3e5efeed970a',
                    // 'http://localhost:5678/webhook-test/98772d9f-9897-4030-935b-3e5efeed970a',
                    {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify(messages),
                    }
                );

                const data = await response.json();
                data_as_json = parseJsonStringWithOpenAiTics(data.text);
            }
            const data_as_markdown = new JsonToMarkdownConverter(data_as_json).toMarkdown();
            const message_from_n8n = { role: 'system', content: data_as_markdown };
            addMessageToMessages(message_from_n8n);
        } catch (error) {
            console.error('Error sending message:', error);
            addMessageToMessages({ role: 'system', content: 'Error: Could not send message.' });
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
