import React, { useState } from 'react';
import './SplashScreen.css';

const SplashScreen = ({ loading, blockLoading }) => {
    const [isBlocking, setIsBlocking] = useState(false);

    const handleClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsBlocking(true);
        blockLoading();
    };

    if (!loading) {
        return null;
    }

    return (
        <div 
            className={`splash-screen ${isBlocking ? 'blocking' : ''}`}
            onClick={!isBlocking ? handleClick : undefined}
        >
            <div className="splash-content">
                <div className="loader"></div>
                <h2 className="splash-text">
                    {isBlocking 
                        ? "Hold in progress... Please wait for current processing to complete." 
                        : "Click to interrupt AI-Processing..."}
                </h2>
            </div>
        </div>
    );
};

export default SplashScreen;
