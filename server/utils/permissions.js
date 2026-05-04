/**
 * @file server/utils/permissions.js
 * @description Shared utility for computing a user's effective permissions.
 *              Merges role-level defaults with per-user overrides.
 *              Extracted from auth.js to avoid code duplication across multiple routes.
 */

const db = require('../config/db');

/**
 * getEffectivePermissions — builds the final permission map for a given user.
 * Role-level permissions are set as defaults; per-user overrides take priority.
 *
 * @param {string} userId - The UUID of the user
 * @param {string} role   - The user's base role string (e.g. 'super_admin')
 * @returns {Promise<Record<string, boolean>>} A map of permissionKey → boolean
 */
async function getEffectivePermissions(userId, role) {
    // Fetch the default permissions associated with the user's role
    const rolePerms = await db.query(
        'SELECT permission_key, is_enabled FROM role_permissions WHERE role = $1',
        [role]
    );

    // Fetch any per-user overrides that supersede the role defaults
    const userOverrides = await db.query(
        'SELECT permission_key, is_enabled FROM user_permissions WHERE user_id = $1',
        [userId]
    );

    const permissions = {};

    // Apply role-level permissions first
    rolePerms.forEach(p => {
        permissions[p.permission_key] = p.is_enabled === 1;
    });

    // Apply user-level overrides (these win over role defaults)
    userOverrides.forEach(p => {
        permissions[p.permission_key] = p.is_enabled === 1;
    });

    return permissions;
}

module.exports = { getEffectivePermissions };
