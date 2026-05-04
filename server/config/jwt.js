/**
 * @file server/config/jwt.js
 * @description Centralised JWT configuration and helper functions.
 *              Previously, JWT_SECRET was defined as a local constant inside auth.js.
 *              Moving it here makes the secret available to any future middleware
 *              without creating circular dependencies.
 */

const jwt = require('jsonwebtoken');

/** The JWT signing secret. Always read from the environment in production. */
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

/** Default token lifetime */
const JWT_EXPIRES_IN = '24h';

/**
 * signToken — creates and signs a new JWT for an authenticated user.
 *
 * @param {object} payload - Data to embed in the token (id, role, scope IDs)
 * @returns {string} A signed JWT string
 */
function signToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * verifyToken — verifies and decodes a JWT string.
 *
 * @param {string} token - The raw JWT string from the Authorization header
 * @returns {object} The decoded payload
 * @throws {Error} If the token is invalid or expired
 */
function verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
}

module.exports = { JWT_SECRET, JWT_EXPIRES_IN, signToken, verifyToken };
