const path = require('path');
require('dotenv').config();

/**
 * Central configuration.
 * Every module reads settings from here so the pipeline behaves the same
 * in development, Docker and tests.
 */
module.exports = {
    // Data directory can be overridden for tests via the DATA_DIR env var.
    dataDir: process.env.DATA_DIR || path.join(__dirname, '..', 'data'),
    adzuna: {
        appId: process.env.ADZUNA_APP_ID,
        appKey: process.env.ADZUNA_APP_KEY,
    },
    jooble: {
        apiKey: process.env.JOOBLE_API_KEY,
    },
};