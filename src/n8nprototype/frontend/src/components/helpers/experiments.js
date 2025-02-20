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
                "id": 1,
                "name": "Workflow foobar 1",
                "value": {
                    "type": "workflow",
                    "label": "Upload Workflow Policy",
                    "selected": false,
                    "url": "http://localhost:5678/webhook/98772d9f-9897-4030-935b-3e5efeed970a"
                },
                "weight": "0.1",
                "parent_id": null
            },
            {
                "id": 2,
                "name": "Workflow foobar 2",
                "value": {
                    "type": "workflow",
                    "label": "App Settings",
                    "selected": false,
                    "url": "http://localhost:5678/webhook/98772d9f-9897-4030-935b-3e5efeed970b"
                },
                "weight": "0.7",
                "parent_id": null
            }
        ]
    };
}

export function workflowSelectionStart() {
    return {
        "workflows": [
            {
                "id": 1,
                "name": "Workflow foobar 1",
                "value": {
                    "type": "workflow",
                    "label": "Upload Workflow Policy",
                    "selected": true,
                    "url": "http://localhost:5678/webhook/98772d9f-9897-4030-935b-3e5efeed970a"
                },
                "weight": "0.7",
                "parent_id": null
            }
        ]
    }
}

// call with name = "attentions" or "workflows
export const filterByName = (json, name) => {
    if (!json || !json[name]) return [];
    return json[name]
}

export const hasWorkflowSelectionParent = (fromAiServer) => {
    return fromAiServer.workflows && typeof fromAiServer.workflows === "object"
}

// Returns true if the given attention has the highest weight among all workflow attentions
const isHighestWorkflowAttention = (attention, workflows) => {
    if (workflows.length === 0) return false;
    const maxWeight = Math.max(...workflows.map((att) => parseFloat(att.weight)));
    return parseFloat(attention.weight) === maxWeight;
};

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
        return { ...workflow };
    });
};

export const selectHighestWorkflow = (workflows) => {
    workflows.forEach((workflow) => {
        if (workflow.value.selected !== undefined) {
            workflow.value.selected = isHighestWorkflowAttention(workflow, workflows)
            return workflow;
        }
    });
    return undefined;
};