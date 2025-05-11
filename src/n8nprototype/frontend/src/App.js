import React, { useState, useEffect } from 'react';
import ChatWindow from './components/ChatWindow';
import InputArea from './components/InputArea';
import NavigationLeft from './components/NavigationLeft';
import './App.css';
import {useAppState} from "./components/UseAppState";
import {EmailForm} from "./components/EmailForm";
import {TokenForm} from "./components/TokenForm";
import { WebSocketProvider, useWebSocket } from './components/WebSocketContext';

// Component to update WebSocket connection status
function WebSocketStatusUpdater({ setWsConnected }) {
    const webSocketContext = useWebSocket();
    
    // Use the useEffect hook from React
    useEffect(() => {
        // Store the WebSocket context globally for components that can't access context directly
        window.webSocketInstance = webSocketContext;
        
        // Update both the state and a global variable for easier access
        setWsConnected(webSocketContext.connected);
        document.wsConnected = webSocketContext.connected;
    }, [webSocketContext, webSocketContext.connected, setWsConnected]);
    
    return null; // This is a utility component with no UI
}

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
        jwtToken,
        loading,
        blockLoading,
        restartTokenFlow,
        glassText,
        showGlassText,
        sessionId
    } = useAppState();
    
    // Track WebSocket connection status
    const [wsConnected, setWsConnected] = useState(false);
    
    // Monitor WebSocket connection status
    useEffect(() => {
        if (step === 'authenticated') {
            // Check connection status every 5 seconds
            const intervalId = setInterval(() => {
                // This will be updated by the WebSocketContext
                setWsConnected(document.wsConnected || false);
            }, 5000);
            return () => clearInterval(intervalId);
        } else {
            setWsConnected(false);
        }
    }, [step]);

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
            <WebSocketProvider authToken={jwtToken[0].token} sessionId={sessionId}>
                <WebSocketStatusUpdater setWsConnected={setWsConnected} />
                <div className="app-wrapper">
                    <NavigationLeft workflows={workflows} selectWorkflow={selectWorkflow}/>
                    <div className="main-content">
                        <div className="connection-status">
                            <span className={`status-indicator ${wsConnected ? 'connected' : 'disconnected'}`}></span>
                            <span className="status-text">{wsConnected ? 'WebSocket Connected' : 'WebSocket Disconnected'}</span>
                            <span className="session-id">Session ID: {sessionId}</span>
                        </div>
                        <ChatWindow 
                            messages={messages} 
                            glassText={glassText} 
                            showGlassText={showGlassText}
                        />
                        <InputArea onSend={sendMessage} onNewChat={clearChat} loading={loading} blockLoading={blockLoading}/>
                    </div>
                    <div className="right-sidebar"></div>
                </div>
            </WebSocketProvider>
            )}
        </div>
    );
}

export default App;
