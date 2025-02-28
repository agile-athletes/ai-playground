import {useState} from "react";
import "./Forms.css"

export function TokenForm({ email, onVerified }) {
    const [token, setToken] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const verifyToken = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/auth/verify-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, token }),
                credentials: 'include' // include cookies in the request
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Token verification failed');
            }
            // Token verified; backend should have set the secure session cookie.
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