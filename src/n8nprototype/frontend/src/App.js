// src/App.js
import React, {useState} from 'react';
import ChatWindow from './components/ChatWindow';
import InputArea from './components/InputArea';
import NavigationLeft from './components/NavigationLeft';
import {parseJsonStringWithOpenAiTics} from './components/helpers/json_helper'
import {JsonToMarkdownConverter} from './components/helpers/json_to_markdown'
import {
    hasWorkflowSelectionParent, selectHighestWorkflowAttention,
    workflowSelectionSample
} from './components/helpers/experiments'
import './App.css';

function App() {
    // const [messages, setMessages] = useState([]);
    const [messages, setMessages] = useState([]);
    const [webhookUrl, setWebhookUrl] = useState('http://localhost:5678/webhook-test/62eb6dc8-452e-4b0f-a461-615c6eda1ebe'); // SelectWorkflowExperiment
    const [workflows, setWorkflows] = useState({});
    const [mock] = useState(true);

    function addMessageToMessages(newMessage) {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
    }

    const sendMessage = async (userContent) => {
        const userMessage = {role: 'user', content: userContent};
        addMessageToMessages(userMessage);

        try {
            let data_as_json;
            if (mock) {
                data_as_json = workflowSelectionSample();
                // data_as_json = testDataAsJson();
            }
            else {
                const response = await fetch(
                    webhookUrl,
                    {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify(messages),
                    }
                );
                const data = await response.json();
                data_as_json = parseJsonStringWithOpenAiTics(data.text);
            }

            if (hasWorkflowSelectionParent(data_as_json)) {
                selectHighestWorkflowAttention(data_as_json.attentions)
                setWorkflows(data_as_json); // navigation changed
            }
            else {
                const data_as_markdown = new JsonToMarkdownConverter(data_as_json).toMarkdown();
                const message_from_n8n = {role: 'system', content: data_as_markdown};
                addMessageToMessages(message_from_n8n);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            addMessageToMessages({role: 'system', content: 'Error: Could not send message.'});
        }
    };

    // Clear chat (flush messages)
    const clearChat = () => {
        setMessages([]);
    };

    return (
        <div className="app-wrapper">
            <NavigationLeft jsonWithAttentions={workflows}  setWebhookUrl={setWebhookUrl}/>
            <div className="main-content">
                <ChatWindow messages={messages}/>
                <InputArea onSend={sendMessage} onNewChat={clearChat}/>
            </div>
            <div className="right-sidebar"></div>
        </div>
    );
}

export default App;
