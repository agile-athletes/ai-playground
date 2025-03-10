import React, { useEffect, useState } from 'react';
import { useAppState } from './UseAppState';
import './SplashScreen.css';

const SplashScreen = ({ loading }) => {
    const [isExiting, setIsExiting] = useState(false);
    const { blockLoading } = useAppState();

    useEffect(() => {
        if (loading) {
            setIsExiting(false);
        } else if (!isExiting) {
            setIsExiting(true);
            // Remove component after animation completes
            setTimeout(() => {
                setIsExiting(false);
            }, 500);
        }
    }, [loading]);

    const handleClick = () => {
        blockLoading();
    };

    // Only render if loading or during exit animation
    if (!loading && !isExiting ) return null;

    return (
        <div className={'splash-screen'}  onClick={handleClick}>
            <div className="splash-content">
                <div className="loader"></div>
                <h2 className="splash-text">Click to interrupt AI-Processing...</h2>
            </div>
        </div>
    );
};

export default SplashScreen;
