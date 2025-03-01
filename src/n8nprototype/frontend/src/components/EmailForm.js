import React, { useState } from 'react';
import "./Forms.css"

export function EmailForm({ onSuccess, onRestart }) {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const requestToken = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('http://localhost:5678/webhook-test/request-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            if (response.status === 440) {
                // If backend signals token-related issue, restart the flow.
                onRestart();
                return;
            }
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to request token');
            }
            onSuccess(email);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={requestToken} className="form-container">
            Login to the Playground App
            <h2>Enter Your Email</h2>
            <input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
            <button type="submit" disabled={loading}>
                {loading ? 'Sending...' : 'Send Token'}
            </button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            You will receive an email giving you access for a session that will remain open until you close your browser.
        </form>
    );
}
