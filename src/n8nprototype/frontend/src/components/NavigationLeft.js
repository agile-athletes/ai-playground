// src/components/NavigationLeft.js
import { useState } from "react";
import ModalFilePicker from "./ModalFilePicker";
import './NavigationLeft.css';

const NavigationLeft = () => {
    const [showFilePicker, setShowFilePicker] = useState(false);

    const openFilePicker = () => setShowFilePicker(true);
    const closeFilePicker = () => setShowFilePicker(false);

    const handleFileSelect = (file) => {
        // Do something with the file
        console.log('Selected file:', file);
        closeFilePicker();
    };

    return (
        <nav className="navigation-left">
            <ul>
                <li>
                    {/* Button to open ModalFilePicker */}
                    <button onClick={openFilePicker} className="open-file-picker-button">
                        Open ModalFilePicker
                    </button>
                </li>
            </ul>
            {showFilePicker && (
                <ModalFilePicker
                    onFileSelect={handleFileSelect}
                    onCancel={closeFilePicker}
                />
            )}
        </nav>
    );
};

export default NavigationLeft;
