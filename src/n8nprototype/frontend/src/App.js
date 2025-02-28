
import React, {useState} from 'react';
import ChatWindow from './components/ChatWindow';
import InputArea from './components/InputArea';
import NavigationLeft from './components/NavigationLeft';
import './App.css';
import {useAppState} from "./components/UseAppState";
import {EmailForm} from "./components/EmailForm";
import {TokenForm} from "./components/TokenForm";

function App() {
    const [step, setStep] = useState('email'); // 'email', 'token', 'authenticated'
    const [userEmail, setUserEmail] = useState('');

    const { messages, setMessages, sendMessage, workflows, handleSelectWorkflow } = useAppState();

    // Clear chat (flush messages)
    const clearChat = () => {
        setMessages([]);
    };

    const selectWorkflow = (selectedWorkflow) => {
        handleSelectWorkflow(selectedWorkflow)
    };

    const handleEmailSuccess = (email) => {
        setUserEmail(email);
        setStep('token');
    };

    const handleTokenVerified = () => {
        setStep('authenticated');
        // Redirect to the main app, load user data, etc.
    };

    return (
        <div>
            {step === 'email' && <EmailForm onSuccess={handleEmailSuccess} />}
            {step === 'token' && <TokenForm email={userEmail} onVerified={handleTokenVerified} />}
            {step === 'authenticated' && (
            <div className="app-wrapper">
                <NavigationLeft workflows={workflows} selectWorkflow={selectWorkflow}/>
                <div className="main-content">
                    <ChatWindow messages={messages}/>
                    <InputArea onSend={sendMessage} onNewChat={clearChat}/>
                </div>
                <div className="right-sidebar"></div>
            </div>)}
        </div>
    );
}

export default App;
