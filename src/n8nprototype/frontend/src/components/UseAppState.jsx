import {useRef, useState} from 'react';
import {
    filterByName,
    workflowSelectionSample,
    workflowSelectionStart,
    mergeWorkflows,
    findNextNavigationReasoning,
    flushReasonings
} from "./helpers/experiments";
import {JsonToMarkdownConverter} from "./helpers/json_to_markdown";
import { getWebhookUrl, processWorkflowUrl } from "../utils/baseUrl";

const WEBHOOK_URL = getWebhookUrl('11e870d9-055b-4815-8d44-257a18a1cf19'); // Select prod

export function useAppState() {
    const messagesRef = useRef([]);
    // Add a state to trigger re-renders when messages change
    const [messagesVersion, setMessagesVersion] = useState(0);
    // Replace useState with useRef for workflows
    const workflowsRef = useRef(workflowSelectionStart(WEBHOOK_URL));
    // Add a state to trigger re-renders when workflows change
    const [ workflowVersion, setWorkflowsVersion] = useState(0);
    const [mock] = useState(false);
    const [step, setStep] = useState('token'); // 'email', 'token', 'authenticated'
    const [userEmail, setUserEmail] = useState('');
    const [jwtToken, setJwtToken] = useState([{"token":""}])
    const [loading, setLoading] = useState(false);
    const loadingBlocked = useRef(false);
    const [glassText, setGlassText] = useState('');
    const [showGlassText, setShowGlassText] = useState(false);

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
        const workflows = getWorkflows();
        const index = workflows.length - 1;
        let result = null;
        if (index >= 0) { result = workflows[index].value.url; }
        return processWorkflowUrl(result);
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

    const updateGlassText = (text) => {
        setGlassText(text);
        setShowGlassText(!!text);
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
            if (mock) {
                // Simulate backend processing time
                await new Promise(resolve => setTimeout(resolve, 2000));
                if (getWorkflows().length === 1) {
                    data_as_json = workflowSelectionSample();
                }
            } else {
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
            }

            const workflowsToAppend = filterByName(data_as_json, "workflows");
            if (Array.isArray(workflowsToAppend) && workflowsToAppend.length > 0) {
                appendWorkflowsToWorkflows(workflowsToAppend);
            }

            const attentions = filterByName(data_as_json, "attentions");
            if (Array.isArray(attentions) && attentions.length > 0) {
                const data_as_markdown = new JsonToMarkdownConverter(attentions).toMarkdown();
                const message_from_n8n = { role: 'system', content: data_as_markdown };
                addMessageToMessages(message_from_n8n);
            }

            const reasonings = filterByName(data_as_json, "reasoning");
            const nextNavigation = findNextNavigationReasoning(reasonings);
            if (nextNavigation?.value?.consideration && !loadingBlocked.current) {
                // Display the consideration in the glass pane
                updateGlassText(nextNavigation.value.consideration);
                data_as_json = flushReasonings(data_as_json);

                await new Promise(resolve => setTimeout(resolve, 0));
                await sendMessage(nextNavigation?.value?.suggested);
                // Clear the glass text after processing
                updateGlassText('');
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
        updateGlassText
    };
}
