import {useRef, useState, useEffect} from 'react';
import {
    filterByName,
    workflowSelectionStart,
    mergeWorkflows,
    findNextNavigationReasoning,
    findGlassPaneReasoning,
    flushReasonings
} from "./helpers/experiments";
import {JsonToMarkdownConverter} from "./helpers/json_to_markdown";
import { getWebhookUrl } from "../utils/baseUrl";
import websocketService from "../utils/websocketService";

// Remove 'webhook/' from these constants as getWebhookUrl already adds that prefix
const EXPLAINER_URL = 'explainer'; // Select explainer when the user hits the first workflow

export function useAppState() {
    const messagesRef = useRef([]);
    // Add a state to trigger re-renders when messages change
    const [messagesVersion, setMessagesVersion] = useState(0);
    // Replace useState with useRef for workflows
    const workflowsRef = useRef(workflowSelectionStart(EXPLAINER_URL));
    // Add a state to trigger re-renders when workflows change
    const [ workflowVersion, setWorkflowsVersion] = useState(0);
    const [step, setStep] = useState('authenticated'); // TODO 'email', 'token', 'authenticated'
    const [userEmail, setUserEmail] = useState('');
    const [jwtToken, setJwtToken] = useState([{"token":""}])
    const [loading, setLoading] = useState(false);
    const loadingBlocked = useRef(false);
    const [glassText, setGlassText] = useState('');
    const [showGlassText, setShowGlassText] = useState(false);
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
            // Set the session ID for the WebSocket service
            websocketService.setSessionId(sessionIdRef.current);
            
            // Connect to all WebSocket topics
            websocketService.connect();
            
            // Subscribe to reasoning messages (glasspane)
            const reasoningUnsubscribe = websocketService.subscribe('reasoning', (data) => {
                if (data && data.consideration) {
                    updateGlassText(data.consideration);
                    
                    // Wait for a longer time for users to read longer texts
                    const displayTime = Math.max(3000, data.consideration.length * 20);
                    
                    // Automatically clear the glass pane after the calculated time
                    setTimeout(() => {
                        updateGlassText('');
                    }, displayTime);
                }
            });
            
            // Subscribe to navigation messages (left panel)
            const navigationUnsubscribe = websocketService.subscribe('navigation', (data) => {
                if (data && Array.isArray(data)) {
                    // Handle navigation updates (workflows)
                    appendWorkflowsToWorkflows(data);
                }
            });
            
            // Subscribe to attentions messages (center)
            const attentionsUnsubscribe = websocketService.subscribe('attentions', (data) => {
                if (data && Array.isArray(data)) {
                    // Convert attentions to markdown and add to messages
                    const data_as_markdown = new JsonToMarkdownConverter(data).toMarkdown();
                    const message_from_n8n = { role: 'system', content: data_as_markdown };
                    addMessageToMessages(message_from_n8n);
                }
            });
            
            // Cleanup function
            return () => {
                reasoningUnsubscribe();
                navigationUnsubscribe();
                attentionsUnsubscribe();
                websocketService.disconnect();
            };
        }
    }, [step]);

    const updateGlassText = (text) => {
        return new Promise(resolve => {
            setGlassText(text);
            setShowGlassText(!!text);
            // Use a small timeout to ensure state updates are processed
            setTimeout(resolve, 3000);
        });
    };

    const sendMessage = async (userContent) => {

        if (userContent != null) {
            addMessageToMessages({ role: 'user', content: userContent });
        }

        loadingBlocked.current = false;
        setLoading(true);

        const toUpdateMessages = [...getMessages()];

        try {
            let data_as_json;
            const response = await fetch(getWorkflowUrl(), {
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

            data_as_json = await response.json();

            // Extract data from response and publish to appropriate MQTT topics via WebSocket
            const workflowsToAppend = filterByName(data_as_json, "workflows");
            if (Array.isArray(workflowsToAppend) && workflowsToAppend.length > 0) {
                // Publish to navigation topic
                websocketService.send('navigation', workflowsToAppend);
                
                // Still update local state for immediate response
                appendWorkflowsToWorkflows(workflowsToAppend);
            }

            const attentions = filterByName(data_as_json, "attentions");
            if (Array.isArray(attentions) && attentions.length > 0) {
                // Publish to attentions topic
                websocketService.send('attentions', attentions);
                
                // Still update local state for immediate response
                const data_as_markdown = new JsonToMarkdownConverter(attentions).toMarkdown();
                const message_from_n8n = { role: 'system', content: data_as_markdown };
                addMessageToMessages(message_from_n8n);
            }

            const reasonings = filterByName(data_as_json, "reasoning");
            
            // Check for glass pane reasoning first
            const glassPaneReasoning = findGlassPaneReasoning(reasonings);
            if (glassPaneReasoning?.value?.consideration && !loadingBlocked.current) {
                // Publish to reasoning topic
                websocketService.send('reasoning', {
                    consideration: glassPaneReasoning.value.consideration,
                    type: 'glasspane'
                });
                
                // Still update local state for immediate response
                await updateGlassText(glassPaneReasoning.value.consideration);
                
                // Wait for a longer time for users to read longer texts
                const displayTime = Math.max(3000, glassPaneReasoning.value.consideration.length * 20);
                
                // Automatically clear the glass pane after the calculated time
                setTimeout(() => {
                    updateGlassText('');
                }, displayTime);
            }
            
            // Then check for next navigation reasoning
            const nextNavigation = findNextNavigationReasoning(reasonings);
            if (nextNavigation?.value?.consideration && !loadingBlocked.current) {
                // Publish to reasoning topic
                websocketService.send('reasoning', {
                    consideration: nextNavigation.value.consideration,
                    type: 'navigation',
                    suggested: nextNavigation?.value?.suggested
                });
                
                // Still update local state for immediate response
                await updateGlassText(nextNavigation.value.consideration);
                data_as_json = flushReasonings(data_as_json);

                await new Promise(resolve => setTimeout(resolve, 0));
                await sendMessage(nextNavigation?.value?.suggested);
                // Clear the glass text after processing
                await updateGlassText('');
            }

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
            // Ensure glass text is cleared when loading is done
            if (showGlassText) {
                updateGlassText('');
            }
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
        setJwtToken,
        loading,
        loadingBlocked,
        blockLoading,
        restartTokenFlow,
        glassText,
        showGlassText,
        updateGlassText,
        sessionId: sessionIdRef.current
    };
}
