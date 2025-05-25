import React, { useState, useEffect, useRef } from 'react';
import './Settings.css';

const Settings = ({ onClose }) => {
    const [persistSession, setPersistSession] = useState(false);
    const [singleShotTest, setSingleShotTest] = useState(false);
    const settingsRef = useRef(null);

    // Check if session persistence is already enabled
    useEffect(() => {
        const persistenceEnabled = localStorage.getItem('persistJwtSession') === 'true';
        setPersistSession(persistenceEnabled);
        
        // Check if single shot test is enabled
        const singleShotEnabled = localStorage.getItem('singleShotN8nTest') === 'true';
        setSingleShotTest(singleShotEnabled);
    }, []);

    // Handle click outside to close settings panel
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (settingsRef.current && !settingsRef.current.contains(event.target)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    // Toggle session persistence
    const toggleSessionPersistence = () => {
        const newValue = !persistSession;
        setPersistSession(newValue);
        
        if (newValue) {
            // Enable persistence - store setting in localStorage
            localStorage.setItem('persistJwtSession', 'true');
            
            // Move current auth data from sessionStorage to localStorage if it exists
            const authData = sessionStorage.getItem('authData');
            if (authData) {
                localStorage.setItem('authData', authData);
            }
        } else {
            // Disable persistence - remove setting from localStorage
            localStorage.setItem('persistJwtSession', 'false');
            
            // Move current auth data from localStorage to sessionStorage if it exists
            const authData = localStorage.getItem('authData');
            if (authData) {
                sessionStorage.setItem('authData', authData);
                localStorage.removeItem('authData');
            }
        }
    };
    
    // Toggle single shot test mode
    const toggleSingleShotTest = () => {
        const newValue = !singleShotTest;
        setSingleShotTest(newValue);
        localStorage.setItem('singleShotN8nTest', newValue.toString());
        
        // If enabling, we'll also set a flag that this is the first use
        // This will be checked and cleared by the URL modification logic
        if (newValue) {
            localStorage.setItem('singleShotN8nTestPending', 'true');
        } else {
            localStorage.removeItem('singleShotN8nTestPending');
        }
    };

    return (
        <div className="settings-panel" ref={settingsRef}>
            <div className="settings-header">
                <h3>Settings</h3>
                <button className="close-button" onClick={onClose}>&times;</button>
            </div>
            <div className="settings-content">
                <div className="setting-item">
                    <div className="toggle-container" title="Activating this feature makes your conversations accessible to hackers who follow your requests. The risk is limited, however, and only applies until your next login.">
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={persistSession}
                                onChange={toggleSessionPersistence}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                        <span className="setting-label">Remember session when browser closes</span>
                        <div className="tooltip">ⓘ</div>
                    </div>
                </div>
                <div className="setting-description">
                    {persistSession 
                        ? "Your session will be remembered even after you close your browser."
                        : "Your session will be cleared when you close your browser."}
                </div>
                
                <div className="setting-divider"></div>
                
                <div className="setting-item">
                    <div className="toggle-container" title="Append '-test' to the next call to N8N workflows URL. Will reset automatically after use.">
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={singleShotTest}
                                onChange={toggleSingleShotTest}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                        <span className="setting-label">Single shot: N8N test</span>
                        <div className="tooltip">ⓘ</div>
                    </div>
                </div>
                <div className="setting-description">
                    {singleShotTest 
                        ? "The next call to N8N workflows will use the test endpoint. Will reset automatically."
                        : "Using standard N8N workflow endpoints."}
                </div>
            </div>
        </div>
    );
};

export default Settings;
