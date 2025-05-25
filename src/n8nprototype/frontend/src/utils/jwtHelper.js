/**
 * JWT Helper Functions
 * 
 * Provides utility functions for working with JWT tokens
 */

/**
 * Decode a JWT token to extract its payload without verification
 * @param {string} token - The JWT token to decode
 * @returns {Object|null} The decoded payload or null if invalid
 */
export const decodeJwt = (token) => {
  try {
    if (!token) return null;
    
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Decode the payload (middle part)
    return JSON.parse(atob(parts[1]));
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

/**
 * Extract the session ID from a JWT token
 * If the token doesn't contain a session_id, returns null
 * @param {string} token - The JWT token
 * @returns {string|null} The session ID or null
 */
export const extractSessionId = (token) => {
  const payload = decodeJwt(token);
  
  if (!payload) return null;
  
  // Check for session_id in various possible locations in the payload
  const sessionId = payload.session_id || 
                   (payload.data && payload.data.session_id) || 
                   payload.sid || 
                   payload.sub;
                   
  if (sessionId) {
    console.log(`Session ID extracted from JWT: ${sessionId}`);
  } else {
    console.log('No session ID found in JWT payload');
  }
  
  return sessionId;
};

// Determine if a JWT token is expired
export const isTokenExpired = (token) => {
  const payload = decodeJwt(token);
  if (!payload || !payload.exp) return true;
  
  // exp is in seconds since epoch, Date.now() is in milliseconds
  return payload.exp * 1000 < Date.now();
};

export default {
  decodeJwt,
  extractSessionId,
  isTokenExpired
};
