// src/App.js
import React, {useState} from 'react';
import ChatWindow from './components/ChatWindow';
import InputArea from './components/InputArea';
import NavigationLeft from './components/NavigationLeft';
import {parseJsonStringWithOpenAiTics} from './components/helpers/json_helper'
import {JsonToMarkdownConverter} from './components/helpers/json_to_markdown'
import {
    filterByName, selectHighestWorkflow, selectNewWorkflow,
    workflowSelectionSample
} from './components/helpers/experiments'
import './App.css';

const WEBHOOK_URL = 'http://localhost:5678/webhook-test/62eb6dc8-452e-4b0f-a461-615c6eda1ebe';

function App() {

    const [messages, setMessages] = useState([]);
    const [webhookUrl, setWebhookUrl] = useState(WEBHOOK_URL); // SelectWorkflowExperiment
    const [workflows, setWorkflows] = useState([]);
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

            const workflows = filterByName(data_as_json, "workflows");
            const selectedWorkflow = selectHighestWorkflow(workflows);
            setWebhookUrl(selectedWorkflow ? selectedWorkflow.value.url : WEBHOOK_URL);
            setWorkflows(workflows);

            const attentions = filterByName(data_as_json, "attentions")
            const data_as_markdown = new JsonToMarkdownConverter(attentions).toMarkdown();
            const message_from_n8n = {role: 'system', content: data_as_markdown};
            addMessageToMessages(message_from_n8n);

        } catch (error) {
            console.error('Error sending message:', error);
            addMessageToMessages({role: 'system', content: 'Error: Could not send message.'});
        }
    };

    // Clear chat (flush messages)
    const clearChat = () => {
        setMessages([]);
    };

    const selectWorkflow = (selectedWorkflow) => {
        setWorkflows(selectNewWorkflow(workflows, selectedWorkflow.id));
        setWebhookUrl(selectedWorkflow.value.url);
    }

    return (
        <div className="app-wrapper">
            <NavigationLeft workflows={workflows} selectWorkflow={selectWorkflow}/>
            <div className="main-content">
                <ChatWindow messages={messages}/>
                <InputArea onSend={sendMessage} onNewChat={clearChat}/>
            </div>
            <div className="right-sidebar"></div>
        </div>
    );
}

export default App;
