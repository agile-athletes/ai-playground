import {useState} from 'react';
import {filterByName, selectHighestWorkflow, workflowSelectionSample} from "./helpers/experiments";
import {JsonToMarkdownConverter} from "./helpers/json_to_markdown";

export const WEBHOOK_URL = 'http://localhost:5678/webhook/bxKkwMfFdXNReTjV/webhook/27f68323-c314-4adf-a88f-aad037af08ee'; // Select prod

export function useAppState() {
    const [messages, setMessages] = useState([]);
    const [webhookUrl, setWebhookUrl] = useState(WEBHOOK_URL); // GeneralMusterOfBasicLLMChain
    const [workflows, setWorkflows] = useState([]);
    const [mock] = useState(false);

    const addMessageToMessages = (newMessage) => {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
    }

    const sendMessage = async (userContent) => {
        const toUpdateMessages = [...messages];
        const userMessage = {role: 'user', content: userContent};
        toUpdateMessages.push(userMessage);

        console.log(JSON.stringify(toUpdateMessages))

        try {
            let data_as_json;
            if (mock) {
                data_as_json = workflowSelectionSample();
            }
            else {
                const response = await fetch(
                    webhookUrl,
                    {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify(toUpdateMessages),
                    }
                );
                data_as_json = await response.json();
            }

            const workflows = filterByName(data_as_json, "workflows");
            const selectedWorkflow = selectHighestWorkflow(workflows);
            setWebhookUrl(selectedWorkflow ? selectedWorkflow.value.url : WEBHOOK_URL);
            setWorkflows(workflows);

            const attentions = filterByName(data_as_json, "attentions")
            if ( Array.isArray(attentions) && attentions.length > 0) {
                const data_as_markdown = new JsonToMarkdownConverter(attentions).toMarkdown();
                const message_from_n8n = {role: 'system', content: data_as_markdown};
                toUpdateMessages.push(message_from_n8n);
            }
            setMessages(toUpdateMessages);
            return data_as_json;
        } catch (error) {
            console.error('Error sending message:', error);
            addMessageToMessages({role: 'system', content: 'Error: Could not send message.'});
            throw error;
        }
    };


    return { messages, setMessages, webhookUrl, setWebhookUrl, workflows, setWorkflows, sendMessage };
}
