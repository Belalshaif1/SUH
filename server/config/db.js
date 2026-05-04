/**
 * @file server/config/db.js
 * @description Re-exports the SQLite database instance.
 *              Keeping this in config/ makes the dependency path explicit and
 *              allows swapping the database engine without touching every controller.
 *
 * Note: The actual database initialization (createTables, insertDefaultData)
 *       lives in server/db.js and is imported directly by server.js at startup.
 *       This file simply re-exports the `db` object for use in controllers/utils.
 */

// Re-export the already-initialised db object from the root db.js
module.exports = require('../db');
