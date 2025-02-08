// src/components/ModalFilePicker.js
import React, { useState, useRef } from 'react';
import './ModalFilePicker.css';

const ModalFilePicker = ({ onFileSelect, onCancel }) => {
    const [file, setFile] = useState(null);
    const fileInputRef = useRef(null);

    // This function triggers the hidden file input's click event.
    const handleChooseFile = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    // This function handles file selection.
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
        } else {
            alert('Please select a PDF file.');
        }
    };

    const handleSubmit = () => {
        if (file) {
            onFileSelect(file);
        } else {
            alert('No file selected.');
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-file-picker">
                <h2>Select a PDF File</h2>
                {/* Hidden file input */}
                <input
                    type="file"
                    accept="application/pdf"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                />
                {/* Button that opens the hidden file input */}
                <button onClick={handleChooseFile} className="choose-file-button">
                    {file ? file.name : 'Choose File'}
                </button>
                <div className="modal-buttons">
                    <button onClick={handleSubmit} className="submit-button">
                        Select
                    </button>
                    <button onClick={onCancel} className="cancel-button">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalFilePicker;
