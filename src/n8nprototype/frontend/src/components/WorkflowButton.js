import React, {useState} from 'react';
import './WorkflowButton.css'

const WorkflowButton = ({workflow, setWebhookUrl}) => {
    const [selected, setSelected] = useState(workflow.value.selected)
    if (!workflow || !workflow.value || !workflow.value.label) return null;

    const handleClick = () => {
        const selection = workflow.value.selected;
        if ( selection ) { return; }  // can be selected but not deselected
        setSelected(selection)
        setWebhookUrl(workflow.value.url)
    };

    const baseStyle = {
        color: '#fff',
        border: 'none',
        padding: '8px 16px',
        cursor: 'pointer',
    };

    // Use a blue background for the highest workflow attention, otherwise a gray background
    const style = selected
        ? {...baseStyle, backgroundColor: '#007bff'}
        : {...baseStyle, backgroundColor: '#6c757d'};

    return (
        <button className='open-workflow-button' onClick={handleClick} style={style}>
            {workflow.value.label}
        </button>
    );
};

export default WorkflowButton;
