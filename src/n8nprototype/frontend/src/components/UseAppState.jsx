import {useRef, useState, useEffect} from 'react';
import {
    filterByName,
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
                }
            }, 1000);
            
            // Clean up interval on unmount
            return () => clearInterval(checkInterval);
        }
    }, [step]);

    const sendMessage = async (userContent) => {
        if (loadingBlocked.current) {
            return;
        }
        setLoading(true);
        loadingBlocked.current = false;

        try {
            // Add user message to the chat if provided
            if (userContent) {
                addMessageToMessages({ role: 'user', content: userContent });
            }

            // Prepare the messages to send to the backend
            const toUpdateMessages = {
                messages: getMessages(),
            };

            // Get the correct webhook URL based on the current workflow
            const webhookUrl = getWorkflowUrl();

            // Send the request to the backend
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': makeJwtToken(),
                },
                body: JSON.stringify(toUpdateMessages),
            });

            // Check status before attempting to parse JSON
            if (response.status === 401 || response.status === 403) {
                // If backend signals a token-related issue, restart the flow.
                restartTokenFlow();
                return;
            }

            const data_as_json = await response.json();

            // Extract data from response and update local state
            const workflowsToAppend = filterByName(data_as_json, "workflows");
            if (Array.isArray(workflowsToAppend) && workflowsToAppend.length > 0) {
                // Update local state
                appendWorkflowsToWorkflows(workflowsToAppend);
            }

            const attentions = filterByName(data_as_json, "attentions");
            if (Array.isArray(attentions) && attentions.length > 0) {
                // Update local state
                const data_as_markdown = new JsonToMarkdownConverter(attentions).toMarkdown();
                const message_from_n8n = { role: 'system', content: data_as_markdown };
                addMessageToMessages(message_from_n8n);
            }

            // Note: We no longer need to process reasoning messages here
            // as they are now handled by the WebSocket subscription in TextGlasspane.jsx

            return data_as_json;
        } catch (error) {
            // Update the UI with an error message instead of throwing the error
            addMessageToMessages({
                role: 'system',
                content:
                    'Error: Could not send message. Please check your connection or try again later.',
            });
            // Optionally, you could also set an error state here to show a dedicated error UI
        } finally {
            setLoading(false);
            // We no longer need to clear glass text here as it's handled by the WebSocket subscription
        }
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
