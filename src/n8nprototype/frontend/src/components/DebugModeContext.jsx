import React, { createContext, useContext, useState, useEffect } from 'react';
import { setDebugMode as setMqttDebugMode } from './WebSocketContext';

// Create the context
const DebugModeContext = createContext();

// Initial debug mode setting
const initialDebugMode = false; // Set to false to use session-specific topics

// Provider component
export const DebugModeProvider = ({ children }) => {
  const [debugMode, setDebugMode] = useState(initialDebugMode);

  // Update WebSocketContext when debug mode changes
  useEffect(() => {
    setMqttDebugMode(debugMode);
    console.log(`[App] Debug mode ${debugMode ? 'enabled' : 'disabled'}`);
  }, [debugMode]);

  // Toggle function
  const toggleDebugMode = (enabled) => {
    if (enabled === undefined) {
      // Toggle if no value provided
      setDebugMode(prev => !prev);
    } else {
      // Set to specific value if provided
      setDebugMode(enabled);
    }
  };

  return (
    <DebugModeContext.Provider value={{ debugMode, toggleDebugMode }}>
      {children}
    </DebugModeContext.Provider>
  );
};

// Custom hook to use the debug mode
export const useDebugMode = () => {
  const context = useContext(DebugModeContext);
  if (context === undefined) {
    throw new Error('useDebugMode must be used within a DebugModeProvider');
  }
  return context;
};
