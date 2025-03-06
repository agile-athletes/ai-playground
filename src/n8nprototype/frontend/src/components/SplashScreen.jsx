import React, { useEffect, useState } from 'react';
import './SplashScreen.css';

const SplashScreen = ({ loading }) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        if (loading) {
            setIsExiting(false);
        } else {
            setIsExiting(true);
        }
    }, [loading]);

    if (!loading && !isExiting) return null;

    return (
        <div className={`splash-screen ${isExiting ? 'exit' : ''}`}>
            <div className="splash-content">
                <div className="loader"></div>
                <h2 className="splash-text">AI-Processing on our server located in the EU ...</h2>
            </div>
        </div>
    );
};

export default SplashScreen;
