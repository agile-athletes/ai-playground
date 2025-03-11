import React, { useState, useEffect, useRef } from 'react';
import './TextGlasspane.css';

const TextGlasspane = ({ text, isVisible }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shouldDisplay, setShouldDisplay] = useState(false);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Reset when text changes or visibility changes
    if (text && isVisible) {
      setDisplayedText('');
      setCurrentIndex(0);
      setShouldDisplay(true);
    }
  }, [text, isVisible]);

  useEffect(() => {
    // Start or stop the character-by-character animation
    if (isVisible && text && currentIndex < text.length) {
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // Set up new interval to add characters one by one
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prevIndex => {
          const newIndex = prevIndex + 1;
          setDisplayedText(text.substring(0, newIndex));
          
          // Clear interval when we reach the end of the text
          if (newIndex >= text.length) {
            clearInterval(intervalRef.current);
            
            // Set a timeout to hide the glasspane 1 second after completion
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
            }
            
            timeoutRef.current = setTimeout(() => {
              setShouldDisplay(false);
            }, 1000);
          }
          
          return newIndex;
        });
      }, 50); // Speed of character appearance (milliseconds)
    } else if (!isVisible) {
      // Clear interval when component becomes invisible
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setDisplayedText('');
      setCurrentIndex(0);
      setShouldDisplay(false);
    }

    // Cleanup interval and timeout on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isVisible, text, currentIndex]);

  if (!isVisible || !shouldDisplay) {
    return null;
  }

  return (
    <div className="text-glasspane">
      <div className="text-glasspane-content">
        <p className="trickling-text">{displayedText}</p>
      </div>
    </div>
  );
};

export default TextGlasspane;
