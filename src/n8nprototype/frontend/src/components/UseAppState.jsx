import {useRef, useState} from 'react';
import {
    filterByName,
    workflowSelectionSample,
    workflowSelectionStart,
    mergeWorkflows,
    findNextNavigationReasoning
} from "./helpers/experiments";
import {JsonToMarkdownConverter} from "./helpers/json_to_markdown";

const WEBHOOK_URL = 'http://localhost:5678/webhook/bxKkwMfFdXNReTjV/webhook/27f68323-c314-4adf-a88f-aad037af08ee'; // Select prod

export function useAppState() {
    const [messages, setMessages] = useState([]);
    const [workflows, setWorkflows] = useState(workflowSelectionStart(WEBHOOK_URL));
    const [mock] = useState(true);
    const [step, setStep] = useState('authenticated'); // 'email', 'token', 'authenticated'
    const [userEmail, setUserEmail] = useState('');
    const [jwtToken, setJwtToken] = useState([{"token":""}])
    const [loading, setLoading] = useState(false);
    const loadingBlocked = useRef(false);
    const [glassText, setGlassText] = useState('');
    const [showGlassText, setShowGlassText] = useState(false);

    const TEST = false;

    const getWebhookUrl = () => {
        const index = workflows.length - 1;
        let result = null;
        if (index >= 0) { result = workflows[index].value.url; }
        if ( result && TEST ) {
            result = result.replace("/webhook/", "/webhook-test/"); // first occurrence
        }
        return result;
    }

    const blockLoading = () => {
        console.log('blockLoading called');
        loadingBlocked.current = true;
    };

    const appendWorkflowsToWorkflows = (newWorkflows) => {
        setWorkflows((prevWorkflows) => mergeWorkflows(prevWorkflows, newWorkflows));
    };

    const handleSelectWorkflow = (selectedWorkflow) => {
        const index = workflows.findIndex(workflow => workflow.id === selectedWorkflow.id);
        if (index !== -1) {
            // Remove all workflows after the selected one (including itself keeps it)
            setWorkflows(workflows.slice(0, index + 1));
        }
    };

    const addMessageToMessages = (newMessage) => {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
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

    // Test function to demonstrate the TextGlasspane functionality
    const testGlassPane = (text) => {
        updateGlassText(text);
        // Clear the glass text after 5 seconds
        setTimeout(() => {
            updateGlassText('');
        }, 5000);
    };

    const sendMessage = async (userContent) => {
        loadingBlocked.current = false;
        const userMessage = { role: 'user', content: userContent };
        addMessageToMessages(userMessage);
        const toUpdateMessages = [...messages];
        setLoading(true);

        try {
            let data_as_json;
            if (mock) {
                // Simulate backend processing time
                await new Promise(resolve => setTimeout(resolve, 2000));
                data_as_json = workflowSelectionSample();
                console.log(getWebhookUrl());
            } else {
                const response = await fetch(getWebhookUrl(), {
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
                console.log("Jelle "+nextNavigation.value.consideration);
                // Display the consideration in the glass pane
                updateGlassText(nextNavigation.value.consideration);
                await new Promise(resolve => setTimeout(resolve, 0));
                await sendMessage(nextNavigation.value.consideration);
                // Clear the glass text after processing
                updateGlassText('');
            }

            return data_as_json;
        } catch (error) {
            console.error('Error sending message:', error);
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
        messages,
        setMessages,
        workflows,
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
        testGlassPane
    };
}
