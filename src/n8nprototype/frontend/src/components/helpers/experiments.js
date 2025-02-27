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
                    "url": "http://localhost:5678/webhook/98772d9f-9897-4030-935b-3e5efeed970b"
                },
                "weight": "0.7",
                "parent_id": null
            },
            {
                "id": 3,
                "name": "Workflow 3",
                "value": {
                    "type": "workflow",
                    "label": "On Level deeper",
                    "selected": false,
                    "url": "http://localhost:5678/webhook/98772d9f-9897-4030-935b-3e5efeed970b"
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

// export const selectHighestWorkflow = (workflows) => {
//     workflows.forEach((workflow) => {
//         if (workflow.value.selected !== undefined) {
//             workflow.value.selected = isHighestWorkflowAttention(workflow, workflows)
//             return workflow;
//         }
//     });
//     return undefined;
// };