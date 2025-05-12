import {useRef, useState, useEffect} from 'react';
import {
    workflowSelectionStart,
    mergeWorkflows
} from "./helpers/experiments";
import {JsonToMarkdownConverter} from "./helpers/json_to_markdown";
import { getWebhookUrl } from "../utils/baseUrl";

// Remove 'webhook/' from these constants as getWebhookUrl already adds that prefix
const EXPLAINER_URL = 'explainer'; // Select explainer when the user hits the first workflow

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

    // For testing, we can start in authenticated mode
    const [step, setStep] = useState('authenticated'); // TODO 'email', 'token', 'authenticated'
    // Use test token for MQTT connection
    const [jwtToken, setJwtToken] = useState([{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NDY5NDYzOTUuNzE4NTY0LCJleHAiOjE3NDg2NzQzOTUuNzE4NTY0LCJ1c2VyX2lkIjoidXNlckBleGFtcGxlLmNvbSJ9.kcs665-fbXIBisx0xkc9HuYdTXg0xHpV4KNK6TxvTMo"}])

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
            
            // Special case: If the first workflow is selected, call sendMessage with EXPLAINER_URL
            if (index === 0) {
                setUseExplainerUrl(true);
                sendMessage(null);
            }
        }
    };

    const addMessageToMessages = (newMessage) => {
        messagesRef.current = [...messagesRef.current, newMessage];
        setMessagesVersion(prev => prev + 1);
    }

    const restartTokenFlow = () => {
        setStep('email');
        setUserEmail('');
    };

    const makeJwtToken = () => {
        return `Bearer ${jwtToken}`;
    }
    
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
    }, [step]);
    
    // Function to set up subscription to attentions topic
    const setupAttentionsSubscription = () => {
        if (!webSocketContext.current?.subscribe) {
            console.warn('WebSocket subscribe method not available for attentions');
            return;
        }
        
        console.log('Setting up attentions subscription');
        
        // Subscribe to the attentions topic
        return webSocketContext.current.subscribe('attentions', (payload) => {
            console.log('Received attentions via WebSocket:', payload);
            
            // Process attentions from different message formats
            let attentions = [];
            
            // Format 1: Direct attentions array
            if (Array.isArray(payload)) {
                attentions = payload;
            }
            // Format 2: Attentions in a property
            else if (payload && Array.isArray(payload.attentions)) {
                attentions = payload.attentions;
            }
            // Format 3: Single attention object
            else if (payload && payload.id && payload.name && payload.value) {
                attentions = [payload];
            }
            
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
        if (!webSocketContext.current?.subscribe) {
            console.warn('WebSocket subscribe method not available for workflows');
            return;
        }
        
        console.log('Setting up workflows subscription');
        
        // Subscribe to the workflows topic
        return webSocketContext.current.subscribe('workflows', (payload) => {
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
        };

        // Get the correct webhook URL based on the current workflow
        const webhookUrl = getWorkflowUrl();

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
            console.error('Error in sendMessage:', error);
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
    };
}
