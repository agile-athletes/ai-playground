import React from 'react';
import ChatWindow from './components/ChatWindow';
import InputArea from './components/InputArea';
import NavigationLeft from './components/NavigationLeft';
import './App.css';
import {useAppState} from "./components/UseAppState";
import {EmailForm} from "./components/EmailForm";
import {TokenForm} from "./components/TokenForm";

function App() {
    const { 
        messages,
        setMessages,
        sendMessage,
        workflows,
        handleSelectWorkflow,
        step,
        setStep,
        userEmail,
        setUserEmail,
        setJwtToken,
        loading,
        blockLoading,
        restartTokenFlow,
        glassText,
        showGlassText
    } = useAppState();

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

    const handleTokenVerified = (response) => {
        setStep('authenticated');
        setJwtToken(response[0].token);
    };

    return (
        <div>
            {step === 'email' && <EmailForm onSuccess={handleEmailSuccess} onRestart={restartTokenFlow} />}
            {step === 'token' && <TokenForm email={userEmail} onVerified={handleTokenVerified} onRestart={restartTokenFlow} />}
            {step === 'authenticated' && (
            <div className="app-wrapper">
                <NavigationLeft workflows={workflows} selectWorkflow={selectWorkflow}/>
                <div className="main-content">
                    <ChatWindow 
                        messages={messages} 
                        glassText={glassText} 
                        showGlassText={showGlassText}
                    />
                    <InputArea onSend={sendMessage} onNewChat={clearChat} loading={loading} blockLoading={blockLoading}/>
                </div>
                <div className="right-sidebar"></div>
            </div>)}
        </div>
    );
}

export default App;
