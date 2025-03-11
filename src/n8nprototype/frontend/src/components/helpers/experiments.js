export function workflowSelectionSample() {
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
            },
        ],
        "workflows": [
            {
                "id": 2,
                "name": "Workflow 2",
                "value": {
                    "type": "workflow",
                    "label": "SOFT Validation",
                    "selected": false,
                    "url": "http://localhost:5678/webhook/workflow-2"
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
                    "url": "http://localhost:5678/webhook/workflow-3"
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
                    "suggested": "What must be done to safeguard the satisfactory in present operations?"
                },
                "weight": "0.7",
                "parent_id": null
            }
    ],
    };
}

export function workflowSelectionStart(url) {
    return [
        {
            "id": 1,
            "name": "Root workflow",
            "value": {
                "type": "workflow",
                "label": "Select",
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
    // Check for URL matches and find the earliest matching index
    const matchIndex = existingWorkflows.findIndex(existingWorkflow => 
        newWorkflows.some(newWorkflow => 
            newWorkflow.value.url === existingWorkflow.value.url
        )
    );

    // Determine the base workflows to use
    const baseWorkflows = matchIndex !== -1 
        ? existingWorkflows.slice(0, matchIndex) 
        : existingWorkflows;

    // Add IDs to new workflows
    const currentCount = baseWorkflows.length + 1;
    const workflowsWithIds = newWorkflows.map((workflow, index) => ({
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
