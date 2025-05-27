import React, { useState, useEffect } from 'react';
import ChatWindow from './components/attentions/ChatWindow';
import InputArea from './components/InputArea';
import NavigationLeft from './components/workflows/NavigationLeft';
import TextGlasspane from './components/reasoning/TextGlasspane';
import './App.css';
import {useAppState} from "./components/UseAppState";
import {EmailForm} from "./components/EmailForm";
import {TokenForm} from "./components/TokenForm";
import { WebSocketProvider, useWebSocket } from './components/WebSocketContext';
import websocketService from './utils/websocketService';

import { DebugModeProvider } from './components/DebugModeContext';
import Settings from './components/Settings';

// Make websocketService globally available
window.websocketService = websocketService;

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
        sessionId
    } = useAppState();
    
    // Track WebSocket connection status
    const [wsConnected, setWsConnected] = useState(false);
    
    // State to control settings panel visibility
    const [showSettings, setShowSettings] = useState(false);
    
    // Make restartTokenFlow globally available for the websocketService
    useEffect(() => {
        if (restartTokenFlow) {
            window.restartTokenFlow = restartTokenFlow;
        }
    }, [restartTokenFlow]);
    
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
        console.log('Token verified, response:', response);
        setStep('authenticated');
        setJwtToken(response); // The response is already in the correct format [{ token: '...' }]
        console.log('Authentication state set to authenticated');
        
        // Check the user's session persistence preference
        const persistSession = localStorage.getItem('persistJwtSession') === 'true';
        const storageType = persistSession ? localStorage : sessionStorage;
        
        // Store auth data in the appropriate storage for the websocketService to use
        storageType.setItem('authData', JSON.stringify(response));
        console.log(`Stored auth data in ${persistSession ? 'localStorage (persistent)' : 'sessionStorage (session only)'}`);
        
        // Initialize the WebSocket connection now that we have a valid token
        setTimeout(() => {
            const initialized = websocketService.initialize();
            console.log('WebSocket initialization result:', initialized);
        }, 500); // Small delay to ensure token is saved
    };

    return (
        <div>
            {step === 'email' && <EmailForm onSuccess={handleEmailSuccess} onRestart={restartTokenFlow} />}
            {step === 'token' && <TokenForm email={userEmail} onVerified={handleTokenVerified} onRestart={restartTokenFlow} />}
            {step === 'authenticated' && (
            <>
            {jwtToken && jwtToken[0] && jwtToken[0].token ? (
              <DebugModeProvider>
                <WebSocketProvider authToken={jwtToken[0].token} sessionId={sessionId}>
                  <WebSocketStatusUpdater setWsConnected={setWsConnected} />
                  <div className="app-wrapper">
                      <NavigationLeft workflows={workflows} selectWorkflow={selectWorkflow} sessionId={sessionId}/>
                      <div className="main-content">
                          <div className="connection-status">
                              <span className={`status-dot ${wsConnected ? 'connected' : 'disconnected'}`} title={wsConnected ? 'WebSocket Connected' : 'WebSocket Disconnected'}></span>
                              <div 
                                  className="hamburger-menu" 
                                  title="Settings"
                                  onClick={() => setShowSettings(!showSettings)}
                              >
                                  <div className="hamburger-icon">
                                      <span></span>
                                      <span></span>
                                      <span></span>
                                  </div>
                              </div>
                              {showSettings && <Settings onClose={() => setShowSettings(false)} />}
                          </div>
                          <ChatWindow 
                              messages={messages}
                              sessionId={sessionId}
                          />
                          {/* Mount TextGlasspane at the App level to cover the entire application */}
                          <TextGlasspane sessionId={sessionId} />
                          <InputArea onSend={sendMessage} onNewChat={clearChat} loading={loading} blockLoading={blockLoading}/>
                      </div>
                      <div className="right-sidebar"></div>
                  </div>
                </WebSocketProvider>
              </DebugModeProvider>
            ) : (
              <div>Authentication token not available. Please try logging in again.</div>
            )}
            </>
            )}
        </div>
    );
}

export default App;
