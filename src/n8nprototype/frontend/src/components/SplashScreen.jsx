import React from 'react';
import './SplashScreen.css';

const SplashScreen = ({ loading, setLoadingBlocked }) => {

    const handleClick = (e) => {
        console.log('SplashScreen clicked');
        e.preventDefault();
        e.stopPropagation();
        setLoadingBlocked(true);
    };

    if (!loading) {
        console.log('SplashScreen not rendering due to !loading');
        return null;
    }

    return (
        <div 
            className="splash-screen"
            onClick={handleClick}
        >
            <div className="splash-content">
                <div className="loader"></div>
                <h2 className="splash-text">Click to interrupt AI-Processing...</h2>
            </div>
        </div>
    );
};

export default SplashScreen;
