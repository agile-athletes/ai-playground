import React, { useState, useEffect } from 'react';
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
  // State to track if single shot N8N test is active
  const [singleShotActive, setSingleShotActive] = useState(false);

  // NOTE: Workflows are now handled by UseAppState.jsx
  // This component just renders the workflows that are passed as props

  // Check localStorage for single shot N8N test status
  useEffect(() => {
    // Function to check single shot status
    const checkSingleShotStatus = () => {
      const isActive = localStorage.getItem('singleShotN8nTest') === 'true';
      setSingleShotActive(isActive);
    };
    
    // Check immediately
    checkSingleShotStatus();
    
    // Set up interval to check periodically (every second)
    const intervalId = setInterval(checkSingleShotStatus, 1000);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  // Handler for opening the N8N workflows interface
  const handleOpenN8nWorkflows = () => {
    openN8nWorkflows();
  };

  // Existing return statement follows
    return (
        <nav className="navigation-left">
            <div className="navigation-header">
                <h3>Workflows</h3>
                {singleShotActive && (
                    <button 
                        className="n8n-link-button" 
                        onClick={handleOpenN8nWorkflows}
                        title="Open N8N Workflows Interface">
                        <i className="workflow-icon">⚙️</i> N8N
                    </button>
                )}
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
