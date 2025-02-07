// src/index.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Ensure that the index.html file has an element with id="root"
const container = document.getElementById('root');
if (!container) {
    throw new Error('Could not find root element to mount to!');
}

const root = createRoot(container);
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
