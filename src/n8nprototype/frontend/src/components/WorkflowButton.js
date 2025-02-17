import React from 'react';
import './WorkflowButton.css'

const WorkflowButton = ({attention, isHighest}) => {
    if (!attention || !attention.value || !attention.value.label) return null;

    const handleClick = () => {
        // Navigate to the workflow URL
        window.location.href = attention.value.url;
    };

    const baseStyle = {
        color: '#fff',
        border: 'none',
        padding: '8px 16px',
        cursor: 'pointer',
    };

    // Use a blue background for the highest workflow attention, otherwise a gray background
    const style = isHighest
        ? {...baseStyle, backgroundColor: '#007bff'}
        : {...baseStyle, backgroundColor: '#6c757d'};

    return (
        <button className='open-workflow-button' onClick={handleClick} style={style}>
            {attention.value.label}
        </button>
    );
};

export default WorkflowButton;
