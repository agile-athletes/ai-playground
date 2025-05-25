import React from 'react';
import { openN8nWorkflows } from '../../utils/n8nUtils';
import './NavigationLeft.css';
// No longer need WebSocketContext as UseAppState handles subscriptions
// Create a local WorkflowButton component instead of importing from upper directory

const WorkflowButton = ({ workflow, selectWorkflow, index }) => {
    return (
        <button 
            className="workflow-button"
            onClick={() => selectWorkflow(workflow)}
        >
            {workflow.name || `Workflow ${index + 1}`}
        </button>
    );
};

const NavigationLeft = ({ workflows, selectWorkflow }) => {

  // NOTE: Workflows are now handled by UseAppState.jsx
  // This component just renders the workflows that are passed as props

  // Handler for opening the N8N workflows interface
  const handleOpenN8nWorkflows = () => {
    openN8nWorkflows();
  };

  // Existing return statement follows
    return (
        <nav className="navigation-left">
            <div className="navigation-header">
                <h3>Workflows</h3>
                <button 
                    className="n8n-link-button" 
                    onClick={handleOpenN8nWorkflows}
                    title="Open N8N Workflows Interface">
                    <i className="workflow-icon">⚙️</i> N8N
                </button>
            </div>
            <ul>
                {workflows.map((workflow, index) => (
                    <li key={workflow.id} style={{ paddingLeft: `${index * 20}px` }}>
                        <WorkflowButton
                            workflow={workflow}
                            selectWorkflow={selectWorkflow}
                            index={index}
                        />
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default NavigationLeft;
