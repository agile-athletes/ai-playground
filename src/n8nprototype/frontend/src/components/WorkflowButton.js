import React from 'react';
import './WorkflowButton.css';

const WorkflowButton = ({ workflow, selectWorkflow, index }) => {
    if (!workflow || !workflow.value || !workflow.value.label) return null;

    const handleClick = () => {
        selectWorkflow(workflow);
    };

    const baseStyle = {
        color: '#fff',
        border: 'none',
        padding: '8px 16px',
        cursor: 'pointer',
    };

    // Define colors for four levels: index 0 is dark blueish, index 3 is dark greenish.
    const colors = ['#003366', '#004d4d', '#006633', '#007f00'];
    const level = Math.min(index, 3);
    const style = { ...baseStyle, backgroundColor: colors[level] };

    return (
        <button className='open-workflow-button' onClick={handleClick} style={style}>
            {workflow.value.label}
        </button>
    );
};

export default WorkflowButton;
