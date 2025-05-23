import React, { useEffect } from 'react';
import './NavigationLeft.css';
import { useWebSocket } from '../WebSocketContext'; // Path relative to NavigationLeft.js in components/workflows
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
  // Debug mode is now set to false
  const debugMode = false; 
  const { subscribe, connected: wsConnected, error: wsError } = useWebSocket();

  useEffect(() => {
    // Log WebSocket connection status from context
    if (debugMode && (wsError || !wsConnected)) { // Log only if there's an issue or still connecting with debug on
        console.log(`NavigationLeft: WebSocketContext connected: ${wsConnected}, error: ${wsError}, sessionId available: ${!!sessionId}`);
    }

    if (!subscribe || !sessionId) {
      if (debugMode || !sessionId) console.log('NavigationLeft: WebSocket service not available or sessionId missing.');
      return;
    }

    const topicToSubscribe = debugMode ? 'navigation' : `navigation/${sessionId}`;
    if (debugMode) {
      console.log(`NavigationLeft: DEBUG MODE ON - Subscribing to base topic: ${topicToSubscribe}`);
    } else {
      console.log(`NavigationLeft: DEBUG MODE OFF - Subscribing to session-specific topic: ${topicToSubscribe}`);
    }

    const handleNavigationMessage = (payload) => {
      console.log('NavigationLeft: Received navigation message:', payload);
      // TODO: Process the navigation payload, e.g., update workflows, trigger actions
      // Example: if (payload.type === 'navigateToWorkflow') selectWorkflow(payload.workflowId);
    };

    const unsubscribeNavigation = subscribe(topicToSubscribe, handleNavigationMessage);

    return () => {
      if (unsubscribeNavigation) {
        unsubscribeNavigation();
      }
    };
  }, [subscribe, wsConnected, wsError, sessionId, debugMode, selectWorkflow]);

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
