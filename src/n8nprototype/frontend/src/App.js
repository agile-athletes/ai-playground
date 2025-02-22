// src/App.js
import React from 'react';
import ChatWindow from './components/ChatWindow';
import InputArea from './components/InputArea';
import NavigationLeft from './components/NavigationLeft';
import {selectNewWorkflow} from './components/helpers/experiments'
import './App.css';
import {useAppState} from "./components/UseAppState";

function App() {

    const { messages, setMessages, sendMessage, setWebhookUrl, workflows, setWorkflows } = useAppState();

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
