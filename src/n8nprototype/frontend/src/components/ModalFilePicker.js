// src/components/ModalFilePicker.js
import React, { useState } from 'react';
import './ModalFilePicker.css';

const ModalFilePicker = ({ onFileSelect, onCancel }) => {
    const [file, setFile] = useState(null);

    const handleChange = (e) => {
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
                <input type="file" accept="application/pdf" onChange={handleChange} />
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
