import {useState} from 'react';
import {
    filterByName,
    workflowSelectionSample,
    workflowSelectionStart
} from "./helpers/experiments";
import {JsonToMarkdownConverter} from "./helpers/json_to_markdown";

const WEBHOOK_URL = 'http://localhost:5678/webhook/bxKkwMfFdXNReTjV/webhook/27f68323-c314-4adf-a88f-aad037af08ee'; // Select prod

export function useAppState() {
    const [messages, setMessages] = useState([]);
    const [workflows, setWorkflows] = useState(workflowSelectionStart(WEBHOOK_URL));
    const [mock] = useState(false);
    const [step, setStep] = useState('email'); // 'email', 'token', 'authenticated'
    const [userEmail, setUserEmail] = useState('');
    const [jwtToken, setJwtToken] = useState([{"token":""}])
    const [loading, setLoading] = useState(false);


    const getWebhookUrl = () => {
        const index = workflows.length - 1;
        if (index >= 0) {
            return workflows[index].value.url;
        }
    }

    const appendWorkflowsToWorkflows = (newWorkflows) => {
        setWorkflows((prevWorkflows) => {
            const currentCount = prevWorkflows.length + 1;
            const workflowsWithIds = newWorkflows.map((workflow, index) => ({
                ...workflow,
                id: currentCount + index,
            }));
            return [...prevWorkflows, ...workflowsWithIds];
        });
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

    const sendMessage = async (userContent) => {
        const toUpdateMessages = [...messages];
        const userMessage = { role: 'user', content: userContent };
        toUpdateMessages.push(userMessage);
        setLoading(true);

        // Create a timeout promise that rejects after 10 seconds
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Request timed out")), 60000)
        );

        try {
            let data_as_json;
            if (mock) {
                data_as_json = workflowSelectionSample();
                console.log(getWebhookUrl());
            } else {
                // Use Promise.race to combine fetch with the timeout
                const response = await Promise.race([
                    fetch(getWebhookUrl(), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': makeJwtToken(),
                        },
                        body: JSON.stringify(toUpdateMessages),
                    }),
                    timeoutPromise,
                ]);

                data_as_json = await response.json();
                if (response.status === 440) {
                    // If backend signals a token-related issue, restart the flow.
                    restartTokenFlow();
                    return;
                }
            }

            const workflowsToAppend = filterByName(data_as_json, "workflows");
            if (Array.isArray(workflowsToAppend) && workflowsToAppend.length > 0) {
                appendWorkflowsToWorkflows(workflowsToAppend);
            }

            const attentions = filterByName(data_as_json, "attentions");
            if (Array.isArray(attentions) && attentions.length > 0) {
                const data_as_markdown = new JsonToMarkdownConverter(attentions).toMarkdown();
                const message_from_n8n = { role: 'system', content: data_as_markdown };
                toUpdateMessages.push(message_from_n8n);
                setMessages(toUpdateMessages);
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
        }
    };


    return { messages,
        setMessages,
        workflows,
        handleSelectWorkflow,
        sendMessage,
        step, setStep,
        userEmail, setUserEmail,
        setJwtToken,
        loading,
        restartTokenFlow };
}
