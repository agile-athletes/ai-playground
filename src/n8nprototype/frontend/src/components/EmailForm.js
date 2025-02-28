import React, { useState } from 'react';
import "./Forms.css"

export function EmailForm({ onSuccess }) {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const requestToken = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/auth/request-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to request token');
            }
            // If successful, call onSuccess passing the email (to be reused during token verification)
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
                {loading ? 'Sending...' : 'Send Access Token'}
            </button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            You will receive an email giving you access for a session that will remain open until you close your browser.
        </form>
    );
}