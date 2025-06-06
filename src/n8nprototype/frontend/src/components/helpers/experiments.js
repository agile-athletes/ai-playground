import { getWebhookUrl, isLocalhost } from "../../utils/baseUrl";

export function workflowSelectionSample() {
    // Determine the appropriate URLs based on environment
    const workflow2Url = isLocalhost() ? 
        getWebhookUrl('workflow-2') : 
        getWebhookUrl('workflow-2');
    
    const workflow3Url = isLocalhost() ? 
        getWebhookUrl('workflow-3') : 
        getWebhookUrl('workflow-3');
        
    return {
        "attentions": [
            {
                "id": 1,
                "name": "Accuracy of USER_TEXT",
                "value": "0.0",
                "weight": "0.5",
                "parent_id": null
            },
            {
                "id": 2,
                "name": "Title",
                "value": "Gap in Identifying Planning Issues",
                "weight": "0.7",
                "parent_id": 1
            },
            {
                "id": 3,
                "name": "SOFT Question",
                "value": "What must be done to safeguard the satisfactory in present operations?",
                "weight": "0.6",
                "parent_id": 2
            }
        ],
        "workflows": [
            {
                "id": 2,
                "name": "Workflow 2",
                "value": {
                    "type": "workflow",
                    "label": "SOFT Validation",
                    "selected": false,
                    "url": workflow2Url
                },
                "weight": "0.7",
                "parent_id": null
            },
            {
                "id": 3,
                "name": "Workflow 3",
                "value": {
                    "type": "workflow",
                    "label": "One Level deeper",
                    "selected": false,
                    "url": workflow3Url
                },
                "weight": "0.7",
                "parent_id": null
            }
        ],
        "reasoning": [
            {
                "id": 1,
                "name": "Navigate to next workflow",
                "value": {
                    "type": "next-navigation",
                    "consideration": "Based on the request, the request indicates the need for a validation by the SOFT framework. This can be done by the next workflow called Soft Validation.",
                    "suggested": "Our business of online translation services is under pressure of AI-Chat Apps."
                },
                "weight": "0.7",
                "parent_id": null
            }
    ]
    };
}

export function workflowSelectionStart(url) {
    return [
        {
            "id": 1,
            "name": "Root workflow",
            "value": {
                "type": "workflow",
                "label": "Explainer",
                "selected": true,
                "url": url
            },
            "weight": "1",
            "parent_id": null
        }
    ]
}

// call with name = "attentions" or "workflows
export const filterByName = (json, name) => {
    if (!json || !json[name]) return [];
    return json[name]
}

export const hasWorkflowSelectionParent = (fromAiServer) => {
    return fromAiServer.workflows && typeof fromAiServer.workflows === "object"
}

export const selectNewWorkflow = (workflows, id) => {
    if (!Array.isArray(workflows)) {
        throw new Error("Expected workflows to be an array.");
    }

    return workflows.map((workflow) => {
        if (workflow?.value) {
            return {
                ...workflow,
                value: {
                    ...workflow.value,
                    selected: workflow.id === id,
                },
            };
        }
        // Return a shallow copy even if there's no value object
        return {...workflow};
    });
};

export const mergeWorkflows = (existingWorkflows, newWorkflows) => {
    // Filter out null workflow values from both arrays
    const validExistingWorkflows = existingWorkflows.filter(wf => wf !== null && wf.value !== null);
    const validNewWorkflows = newWorkflows.filter(wf => wf !== null && wf.value !== null);
    
    // If there are no valid workflows to merge, just return the filtered existing workflows
    if (validNewWorkflows.length === 0) {
        return validExistingWorkflows;
    }
    
    // Check for URL matches and find the earliest matching index
    const matchIndex = validExistingWorkflows.findIndex(existingWorkflow => 
        validNewWorkflows.some(newWorkflow => 
            newWorkflow.value.url === existingWorkflow.value.url
        )
    );

    // Determine the base workflows to use
    const baseWorkflows = matchIndex !== -1 
        ? validExistingWorkflows.slice(0, matchIndex) 
        : validExistingWorkflows;

    // Add IDs to new workflows
    const currentCount = baseWorkflows.length + 1;
    const workflowsWithIds = validNewWorkflows.map((workflow, index) => ({
        ...workflow,
        id: currentCount + index,
    }));

    return [...baseWorkflows, ...workflowsWithIds];
};

export const findNextNavigationReasoning = (reasonings) => {
    if (!Array.isArray(reasonings)) return null;
    return reasonings.find(reasoning => 
        reasoning?.value?.type === 'next-navigation'
    );
};

export const findGlassPaneReasoning = (reasonings) => {
    if (!Array.isArray(reasonings)) return null;
    return reasonings.find(reasoning => 
        reasoning?.value?.type === 'to-glasspane'
    );
};

// Function to flush all "reasoning" elements from data_as_json
export const flushReasonings = (data) => {
    if (!data || typeof data !== 'object') return data;
    
    // If it's an array, process each element
    if (Array.isArray(data)) {
        return data.filter(item => {
            // Filter out any object with name "reasoning"
            return !(item && typeof item === 'object' && item.name === "reasoning");
        }).map(item => flushReasonings(item)); // Recursively process remaining items
    }
    
    // If it's an object, process each property
    const result = {};
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            // Skip the "reasoning" property
            if (key === "reasoning") continue;
            
            // Recursively process the value
            result[key] = flushReasonings(data[key]);
        }
    }
    return result;
};
