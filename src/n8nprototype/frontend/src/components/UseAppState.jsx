import { useState } from 'react';
import {filterByName, selectHighestWorkflow, workflowSelectionSample} from "./helpers/experiments";
import {parseJsonStringWithOpenAiTics} from "./helpers/json_helper";
import {JsonToMarkdownConverter} from "./helpers/json_to_markdown";

export const WEBHOOK_URL = 'http://localhost:5678/webhook/62eb6dc8-452e-4b0f-a461-615c6eda1ebe'; // Select prod
// export const WEBHOOK_URL = 'http://localhost:5678/webhook-test/7f718eed-4d7c-49eb-880c-45d93f5bdb04'; // Validate prod

export function useAppState() {
    const [messages, setMessages] = useState([]);
    const [webhookUrl, setWebhookUrl] = useState(WEBHOOK_URL); // SelectWorkflowExperiment
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
                const data = await response.json();
                data_as_json = parseJsonStringWithOpenAiTics(data.text);
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
