export function extractJsonFromLastElement(arr) {
    if (!Array.isArray(arr) || arr.length === 0) {
        throw new Error("Input must be a non-empty array");
    }

    const lastElement = arr[arr.length - 1];
    let content = lastElement.content;

    // Remove markdown code fences if present (e.g., ```json ... ```)
    const regex = /^```json\s*([\s\S]*?)\s*```$/;
    const match = content.match(regex);
    if (match) {
        content = match[1];
    }

    try {
        return JSON.parse(content);
    } catch (error) {
        return null;
    }
}

// Example usage:
const messages = [
    {
        "role": "user",
        "content": "New artificial intelligence technology is challenging our core business of on-demand translation."
    },
    {
        "role": "system",
        "content": "```json \n{\n  \"attentions\": [\n    {\n      \"id\": 1,\n      \"name\": \"Accuracy of USER_TEXT\",\n      \"value\": \"60\",\n      \"weight\": \"0.6\",\n      \"parent_id\": null\n    },\n    {\n      \"id\": 2,\n      \"name\": \"Title\",\n      \"value\": \"Impact of AI on On-Demand Translation Business\",\n      \"weight\": \"0.8\",\n      \"parent_id\": 1\n    },\n    {\n      \"id\": 3,\n      \"name\": \"SOFT Question\",\n      \"value\": \"What must be done to thwart, ameliorate or avert the threats to future operations?\",\n      \"weight\": \"0.9\",\n      \"parent_id\": 2\n    },\n    {\n      \"id\": 4,\n      \"name\": \"Description\",\n      \"value\": \"The new artificial intelligence technology presents a significant challenge to our core business of on-demand translation, and proactive measures are needed to address this threat.\",\n      \"weight\": \"0.7\",\n      \"parent_id\": 3\n    },\n    {\n      \"id\": 5,\n      \"name\": \"Reference sources or facts\",\n      \"value\": \"Research indicates that AI-driven translation tools are improving rapidly, potentially outpacing traditional on-demand services.\",\n      \"weight\": \"0.7\",\n      \"parent_id\": 3\n    },\n    {\n      \"id\": 6,\n      \"name\": \"Possible actions and resource requirements\",\n      \"value\": \"Invest in enhancing the current translation services with AI capabilities, train staff on new technologies, and explore partnerships with AI technology providers.\",\n      \"weight\": \"0.8\",\n      \"parent_id\": 3\n    }\n  ]\n}\n```"
    }
];

const resultJson = extractJsonFromLastElement(messages);
