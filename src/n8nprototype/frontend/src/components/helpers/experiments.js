export function workflowSelectionSample() {
    return {
        "workflows": [
            {
                "id": 1,
                "name": "WorkflowSelectionParent",
                "value": "WorkflowSelectionParent",
                "weight": "0",
                "parent_id": null
            },
            {
                "id": 2,
                "name": "Workflow foobar 1",
                "value": {
                    "type": "workflow",
                    "label": "Upload Workflow Policy",
                    "selected": true,
                    "url": "http://localhost:5678/webhook/98772d9f-9897-4030-935b-3e5efeed970a"
                },
                "weight": "0.7",
                "parent_id": 1
            },
            {
                "id": 3,
                "name": "Workflow foobar 2",
                "value": {
                    "type": "workflow",
                    "label": "App Settings",
                    "selected": false,
                    "url": "http://localhost:5678/webhook/98772d9f-9897-4030-935b-3e5efeed970b"
                },
                "weight": "0.1",
                "parent_id": 1
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


export const hasWorkflowSelectionParent = (fromAiServer) => {
    return fromAiServer.workflows  && typeof fromAiServer.workflows === "object"
}

// Returns true if the given attention has the highest weight among all workflow attentions
const isHighestWorkflowAttention = (attention, workflows) => {
    if (workflows.length === 0) return false;
    const maxWeight = Math.max(...workflows.map((att) => parseFloat(att.weight)));
    return parseFloat(attention.weight) === maxWeight;
};

export const selectHighestWorkflow = (workflows) => {
    workflows.forEach((workflow) => {
        if (workflow.value.selected !== undefined) {
            workflow.value.selected = isHighestWorkflowAttention(workflow, workflows)
        }
    });
}