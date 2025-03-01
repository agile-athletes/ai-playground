import {useState} from "react";
import "./Forms.css"

export function TokenForm({ email, onVerified, onRestart }) {
    const [token, setToken] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Sets the cookie on the client side as a workaround
    const workaroundNoReverseProxySetCookie = (responsePayload) => {
        const sessionData = responsePayload[0];
        const { session_id, session_expiry } = sessionData;
        const expiryDate = new Date(session_expiry).toUTCString();
        document.cookie = `session_id=${session_id}; expires=${expiryDate}; path=/; SameSite=Lax;`;
    }

    const verifyToken = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('http://localhost:5678/webhook/authenticate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, token })
                // TODO the cookie should be set on the server side with: credentials: 'include' // include cookies in the request
            });
            if (response.status === 440) {
                // HTTP 440 indicates the temporary token is invalid/expired
                onRestart();
                return;
            }
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Token verification failed');
            }
            // Workaround
            const responsePayload = await response.json()
            workaroundNoReverseProxySetCookie(responsePayload)
            // TODO Token verified; backend should have set the secure session cookie.
            onVerified();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={verifyToken} className="form-container">
            <h2>Enter the Token</h2>
            <p>A token was sent to: <strong>{email}</strong></p>
            <input
                type="text"
                placeholder="Enter token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
            />
            <button type="submit" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify Token'}
            </button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </form>
    );
}