
const tobeprocessed = $('Code').first().json;
const messages = $('Webhook').first().json.body;
const chatInput = [];

function atobNode(base64) {
    return Buffer.from(base64, 'base64').toString('utf-8');
}

if (messages &&
    Array.isArray(messages) &&
    messages.length === 1 &&
    messages[0].role === 'user') {

    if (tobeprocessed.prompt) {
        const content = atobNode(tobeprocessed.prompt)
        chatInput.push({
            "role": "system",
            "content": content
        });
    }
}

if (Array.isArray(messages) && messages.length > 0) {
    for (const message of messages) {
        chatInput.push(message);
    }
}

return chatInput;