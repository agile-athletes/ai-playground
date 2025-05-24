import React, { useEffect } from 'react';
import './NavigationLeft.css';
import { useWebSocket } from '../WebSocketContext'; // Path relative to NavigationLeft.js in components/workflows
import { useDebugMode } from '../DebugModeContext';
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

const NavigationLeft = ({ workflows, selectWorkflow, sessionId }) => {
  const { debugMode } = useDebugMode(); // Get debugMode from context
  const { subscribe } = useWebSocket();

  useEffect(() => {
    if (!subscribe || !sessionId) {
      console.log('NavigationLeft: WebSocket service not available or sessionId missing.');
      return;
    }

    // Always use base topic name - WebSocketContext will add session ID
    const topicName = 'workflows';
    console.log(`NavigationLeft: Subscribing to topic: ${topicName}`);

    const handleNavigationMessage = (payload) => {
      console.log('NavigationLeft: Received navigation message:', payload);
      // TODO: Process the navigation payload, e.g., update workflows, trigger actions
      // Example: if (payload.type === 'navigateToWorkflow') selectWorkflow(payload.workflowId);
    };

    const unsubscribeNavigation = subscribe(topicName, handleNavigationMessage);

    return () => {
      if (unsubscribeNavigation) {
        unsubscribeNavigation();
      }
    };
  }, [subscribe, sessionId]); // Include all dependencies

  // Existing return statement follows
    return (
        <nav className="navigation-left">
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
