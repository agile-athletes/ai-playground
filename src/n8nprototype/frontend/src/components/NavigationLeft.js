// Example snippet from App.js:
import ModalFilePicker from "./ModalFilePicker";
import {useState} from "react";
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
                <li>Chat 1</li>
                <li>Chat 2</li>
                <li>Chat 3</li>
            </ul>
            {showFilePicker && (
                <ModalFilePicker
                    onFileSelect={handleFileSelect}
                    onCancel={closeFilePicker}
                />
            )}
        </nav>
    );
}

export default NavigationLeft;
