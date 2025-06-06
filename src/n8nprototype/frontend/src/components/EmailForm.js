import React, { useState } from 'react';
import "./Forms.css"
import { getWebhookUrl } from "../utils/baseUrl";

export function EmailForm({ onSuccess, onRestart }) {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const requestToken = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch(getWebhookUrl('request-token'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            if (response.status === 440) {
                // If backend signals token expiration, restart the flow.
                onRestart();
                return;
            }
            if (response.status === 401) {
                // Set specific error message for closed user group at Agile Athletes
                setError('This is a closed user group, please let us know if you are interested: admin@agile-athletes.de');
                onRestart();
                return;
            }
            if (!response.ok) {
                let errorMessage = 'Failed to request token';
                try {
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const errorData = await response.json();
                        if (errorData && errorData.message) {
                            errorMessage = errorData.message;
                        }
                    }
                } catch (jsonError) {
                    console.error('Error parsing error response:', jsonError);
                }
                throw new Error(errorMessage);
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
            When you are registered, you will receive an email giving you access for a session.
        </form>
    );
}
