import {useRef, useState, useEffect} from 'react';
import {
    workflowSelectionStart,
    mergeWorkflows
} from "./helpers/experiments";
import {JsonToMarkdownConverter} from "./helpers/json_to_markdown";
import { getWebhookUrl } from "../utils/baseUrl";
import attentionLogic from './attentions/message_attention_logic';

// Remove 'webhook/' from these constants as getWebhookUrl already adds that prefix
const EXPLAINER_URL = 'explainer'; // Select explainer when the user hits the first workflow

// Debug mode is now managed by DebugModeContext

export function useAppState() {
    // We'll use a ref to store the WebSocket context once it's available
    const webSocketContext = useRef(null);
    const messagesRef = useRef([]);
    // Add a state to trigger re-renders when messages change
    const [messagesVersion, setMessagesVersion] = useState(0);
    // Replace useState with useRef for workflows
    const workflowsRef = useRef(workflowSelectionStart(EXPLAINER_URL));
    // Add a state to trigger re-renders when workflows change
    const [ workflowVersion, setWorkflowsVersion] = useState(0);
    // Use local debug mode variable until components can sync with context
    const debugMode = true; // Set to true to use base topics

    // Start in email step by default, but check for stored tokens first
    const [step, setStep] = useState('email'); 
    // Use test token for MQTT connection
    const [jwtToken, setJwtToken] = useState([{"token":""}])
    
    // Check for existing token on initial load
    useEffect(() => {
        // Only check if we're in the email step (initial state)
        if (step !== 'email') return;
        
        // Check for previous failed authentication attempt marker
        const failedAuthAttempt = sessionStorage.getItem('failedAuthAttempt');
        if (failedAuthAttempt) {
            console.log('Previous authentication attempt failed, not attempting auto-login');
            // Clear the failed attempt marker
            sessionStorage.removeItem('failedAuthAttempt');
            return;
        }
        
        // Check if session persistence is enabled
        const persistSession = localStorage.getItem('persistJwtSession') === 'true';
        
        try {
            // Try to load from the appropriate storage
            const storageType = persistSession ? localStorage : sessionStorage;
            const authData = storageType.getItem('authData');
            
            if (authData) {
                const parsedData = JSON.parse(authData);
                if (parsedData && parsedData.length > 0 && parsedData[0].token) {
                    console.log('Found existing token, attempting to verify before skipping login');
                    
                    // Set a flag to track connection success
                    window.pendingAuthVerification = true;
                    
                    // Set a timeout to check connection status after a reasonable time
                    const verificationTimeout = setTimeout(() => {
                        if (window.pendingAuthVerification) {
                            console.log('WebSocket connection verification timed out');
                            // Mark as failed so we don't attempt again on page refresh
                            sessionStorage.setItem('failedAuthAttempt', 'true');
                            // Clear token and reset state
                            restartTokenFlow();
                            window.pendingAuthVerification = false;
                        }
                    }, 5000); // 5 seconds should be enough for connection
                    
                    // Continue with login process
                    setJwtToken(parsedData);
                    setStep('authenticated');
                    
                    // Initialize the WebSocket connection with the token
                    setTimeout(() => {
                        const initialized = window.websocketService?.initialize?.();
                        console.log('WebSocket initialization result from auto-login:', initialized);
                        
                        // Set up another check to verify actual connection success
                        setTimeout(() => {
                            // If we're not connected by now, restart the token flow
                            if (!window.document.wsConnected && window.pendingAuthVerification) {
                                console.log('WebSocket failed to connect, restarting token flow');
                                // Mark as failed so we don't attempt again on page refresh
                                sessionStorage.setItem('failedAuthAttempt', 'true');
                                restartTokenFlow();
                                window.pendingAuthVerification = false;
                                clearTimeout(verificationTimeout);
                            } else if (window.document.wsConnected) {
                                console.log('WebSocket connection verified, auto-login successful');
                                window.pendingAuthVerification = false;
                                clearTimeout(verificationTimeout);
                            }
                        }, 2000); // Check connection after 2 seconds
                    }, 500);
                }
            }
        } catch (error) {
            console.error('Error checking for existing token:', error);
        }
    }, [step]);

    const [userEmail, setUserEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const loadingBlocked = useRef(false);
    const [useExplainerUrl, setUseExplainerUrl] = useState(false);
    const sessionIdRef = useRef(`session-${Date.now()}`);

    // Create a getter for messages to make the code cleaner
    const getMessages = () => messagesRef.current;

    // Create a setter for messages
    const setMessages = (newMessages) => {
        messagesRef.current = newMessages;
        setMessagesVersion(prev => prev + 1);
    };

    // Create a getter for workflows to make the code cleaner
    const getWorkflows = () => workflowsRef.current;

    const getWorkflowUrl = () => {
        if (useExplainerUrl) {
            setUseExplainerUrl(false); // Reset after use
            return getWebhookUrl(EXPLAINER_URL);
        }
        
        const workflows = getWorkflows();
        const index = workflows.length - 1;
        let result = null;
        if (index >= 0) { result = workflows[index].value.url; }
        return getWebhookUrl(result);
    }

    const blockLoading = () => {
        loadingBlocked.current = true;
    };

    const appendWorkflowsToWorkflows = (newWorkflows) => {
        // Directly modify the ref instead of using setState
        workflowsRef.current = mergeWorkflows(workflowsRef.current, newWorkflows);
        // Increment version to trigger re-render
        setWorkflowsVersion(prev => prev + 1);
    };

    const handleSelectWorkflow = (selectedWorkflow) => {
        const workflows = getWorkflows();
        const index = workflows.findIndex(workflow => workflow.id === selectedWorkflow.id);
        if (index !== -1) {
            // Remove all workflows after the selected one (including itself keeps it)
            workflowsRef.current = workflows.slice(0, index + 1);
            // Trigger re-render
            setWorkflowsVersion(prev => prev + 1);
            
            // Special case for first workflow - just set the flag but don't trigger message
            if (index === 0) {
                setUseExplainerUrl(true);
            }
        }
    };

    const addMessageToMessages = (newMessage) => {
        messagesRef.current = [...messagesRef.current, newMessage];
        setMessagesVersion(prev => prev + 1);
    }

    const restartTokenFlow = () => {
        console.log('Restarting token flow - clearing all auth state');
        
        // Clear token from state
        setJwtToken([{"token":""}]);
        
        // Clear stored auth data from both storage locations
        try {
            localStorage.removeItem('authData');
            sessionStorage.removeItem('authData');
            console.log('Cleared auth data from storage');
        } catch (error) {
            console.error('Error clearing auth data:', error);
        }
        
        // Disconnect WebSocket if it exists
        if (window.websocketService) {
            try {
                window.websocketService.disconnect();
                console.log('Disconnected WebSocket connection');
            } catch (error) {
                console.error('Error disconnecting WebSocket:', error);
            }
        }
        
        // Reset app state
        setStep('email');
        setUserEmail('');
    };

    const makeJwtToken = () => {
        if (!jwtToken || !jwtToken[0] || !jwtToken[0].token) {
            console.error('JWT token is not properly set:', jwtToken);
            return 'Bearer ';
        }
        return `Bearer ${jwtToken[0].token}`;
    }
    
    // Debug mode is now managed by DebugModeContext
    
    // Initialize WebSocket connections when authenticated
    useEffect(() => {
        if (step === 'authenticated') {
            // Check for WebSocket context periodically
            const checkInterval = setInterval(() => {
                if (window.webSocketInstance && !webSocketContext.current) {
                    webSocketContext.current = window.webSocketInstance;
                    clearInterval(checkInterval);
                    
                    // Once we have the WebSocket context, set up the subscriptions
                    setupAttentionsSubscription();
                    setupWorkflowsSubscription();
                }
            }, 1000);
            
            // Clean up interval on unmount
            return () => clearInterval(checkInterval);
        }
        // eslint-disable-next-line
    }, [step]);
    
    // Function to set up subscription to attentions topic
    const setupAttentionsSubscription = () => {
        // Check if WebSocket is actually connected before trying to subscribe
        // This prevents the app from continuing when authentication has failed
        if (!window.document.wsConnected) {
            console.log('WebSocket not connected. Cannot subscribe to attentions topic.');
            
            // Check if we're in authenticated state but WebSocket isn't connected
            // This indicates an authentication problem
            if (step === 'authenticated') {
                console.log('In authenticated state but WebSocket is not connected. Likely an authentication failure.');
                // Trigger token flow restart after a brief delay
                setTimeout(() => {
                    restartTokenFlow();
                }, 1000);
            }
            
            return false;
        }
        
        const { subscribe } = webSocketContext.current;
        if (!subscribe) return false;
        
        // In debug mode, use base topic. Otherwise use session-specific topic
        const topicName = debugMode ? 'attentions' : `attentions/${sessionIdRef.current}`;
        console.log(`UseAppState: Subscribing to attentions topic: ${topicName}`);
        
        // Subscribe to attentions topic
        subscribe(topicName, (payload) => {
            console.log('Received attentions via WebSocket:', payload);
            
            // Extract attentions using the attention logic module
            const attentions = attentionLogic.extractAttentions(payload);
            
            // Process attentions if we found any
            if (attentions.length > 0) {
                // Convert to markdown and add to messages
                const data_as_markdown = new JsonToMarkdownConverter(attentions).toMarkdown();
                const message_from_n8n = { role: 'system', content: data_as_markdown };
                addMessageToMessages(message_from_n8n);
            }
        });
    };
    
    // Function to set up subscription to workflows topic
    const setupWorkflowsSubscription = () => {
        // Check if WebSocket is actually connected before trying to subscribe
        // This prevents the app from continuing when authentication has failed
        if (!window.document.wsConnected) {
            console.log('WebSocket not connected. Cannot subscribe to workflows topic.');
            
            // Check if we're in authenticated state but WebSocket isn't connected
            // This indicates an authentication problem
            if (step === 'authenticated') {
                console.log('In authenticated state but WebSocket is not connected. Likely an authentication failure.');
                // Trigger token flow restart after a brief delay
                setTimeout(() => {
                    restartTokenFlow();
                }, 1000);
            }
            
            return false;
        }
        
        if (!webSocketContext.current?.subscribe) {
            console.warn('WebSocket subscribe method not available for workflows');
            return;
        }
        
        // In debug mode, use base topic. Otherwise use session-specific topic
        const topicName = debugMode ? 'workflows' : `workflows/${sessionIdRef.current}`;
        console.log(`UseAppState: Subscribing to workflows topic: ${topicName}`);
        
        // Subscribe to the appropriate workflows topic
        return webSocketContext.current.subscribe(topicName, (payload) => {
            console.log('Received workflows via WebSocket:', payload);
            
            // Process workflows from different message formats
            let workflowsToAppend = [];
            
            // Format 1: Direct workflows array
            if (Array.isArray(payload)) {
                workflowsToAppend = payload;
            }
            // Format 2: Workflows in a property
            else if (payload && Array.isArray(payload.workflows)) {
                workflowsToAppend = payload.workflows;
            }
            
            // Process workflows if we found any
            if (workflowsToAppend.length > 0) {
                // Update local state
                appendWorkflowsToWorkflows(workflowsToAppend);
            }
        });
    };
    
    // We don't need separate useEffects for subscriptions anymore
    // as we're setting them up in the WebSocket initialization effect

    const sendMessage = (userContent) => {
        if (loadingBlocked.current) {
            return;
        }
        
        // Add user message to the chat immediately if provided
        if (userContent) {
            addMessageToMessages({ role: 'user', content: userContent });
        }
        
        // Set loading state
        setLoading(true);
        loadingBlocked.current = false;

        // Prepare the messages to send to the backend
        const toUpdateMessages = {
            messages: getMessages(),
                session_id: sessionIdRef.current, // Include session ID in the payload
        };

        // Get the correct webhook URL based on the current workflow
        const webhookUrl = getWorkflowUrl();
        
        // Create authorization header
        makeJwtToken();

        // Process the API request in the background
        // Note: We're not using await here to avoid blocking the UI
        fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': makeJwtToken(),
            },
            body: JSON.stringify(toUpdateMessages),
        })
        .then(response => {
            // Check status before attempting to parse JSON
            if (response.status === 401 || response.status === 403) {
                // If backend signals a token-related issue, restart the flow.
                restartTokenFlow();
                throw new Error('Authentication error');
            }
            return response.json();
        })
        .then(data_as_json => {
            // Note: We no longer process workflows or attentions here as they are handled by WebSocket subscriptions

            // Note: We no longer need to process reasoning messages here
            // as they are now handled by the WebSocket subscription in TextGlasspane.jsx
            
            return data_as_json;
        })
        .catch(error => {
            // Only show error message if it's not an authentication error
            if (error.message !== 'Authentication error') {
                // Update the UI with an error message
                addMessageToMessages({
                    role: 'system',
                    content:
                        'Error: Could not send message. Please check your connection or try again later.',
                });
            }
            // Optionally, you could also set an error state here to show a dedicated error UI
            // Error handled in the catch block above
        })
        .finally(() => {
            setLoading(false);
            // We no longer need to clear glass text here as it's handled by the WebSocket subscription
        });
    };

    return { 
        messages: getMessages(),
        messagesVersion,
        setMessages,
        workflows: getWorkflows(),
        workflowVersion,
        handleSelectWorkflow,
        sendMessage,
        step, setStep,
        userEmail, setUserEmail,
        jwtToken,
        setJwtToken,
        loading,
        loadingBlocked,
        blockLoading,
        restartTokenFlow,
        sessionId: sessionIdRef.current
        // toggleDebugMode is now handled by DebugModeContext
    };
}
