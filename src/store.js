const fs = require('fs');
const path = require('path');
const config = require('./config');

const DATA_DIR = config.dataDir;
const JOBS_FILE = path.join(DATA_DIR, 'jobs.json');
const ARCHIVE_FILE = path.join(DATA_DIR, 'full_archive.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
const TRACKED_FILE = path.join(DATA_DIR, 'tracked.json');

/**
 * Ensures the data directory exists.
 */
function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

/**
 * Loads history of seen job links.
 * @returns {Set<string>}
 */
function loadHistory() {
    ensureDataDir();
    if (fs.existsSync(HISTORY_FILE)) {
        const data = fs.readFileSync(HISTORY_FILE, 'utf8');
        return new Set(data.trim() ? JSON.parse(data) : []);
    }
    return new Set();
}

/**
 * Saves a set of seen job links.
 * @param {Set<string>} history 
 */
function saveHistory(history) {
    ensureDataDir();
    fs.writeFileSync(HISTORY_FILE, JSON.stringify([...history], null, 2));
}

/**
 * Saves newly found jobs to the jobs.json file and appends to archive.
 * @param {Array} jobs 
 */
function saveJobs(jobs) {
    ensureDataDir();
    
    // Save latest batch
    fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2));
    
    // Append to archive
    let archive = [];
    if (fs.existsSync(ARCHIVE_FILE)) {
        const data = fs.readFileSync(ARCHIVE_FILE, 'utf8');
        archive = data.trim() ? JSON.parse(data) : [];
    }
    archive.push(...jobs);
    fs.writeFileSync(ARCHIVE_FILE, JSON.stringify(archive, null, 2));
    
    console.log(`Saved ${jobs.length} new jobs to ${JOBS_FILE}`);
    console.log(`Total archived jobs: ${archive.length}`);
}

/**
 * Loads tracked job data.
 * @returns {Object} Object mapping link to tracking info { status, date }
 */
function loadTracked() {
    ensureDataDir();
    if (fs.existsSync(TRACKED_FILE)) {
        const data = fs.readFileSync(TRACKED_FILE, 'utf8');
        return data.trim() ? JSON.parse(data) : {};
    }
    return {};
}

/**
 * Saves tracked job data.
 * @param {Object} trackedData 
 */
function saveTracked(trackedData) {
    ensureDataDir();
    fs.writeFileSync(TRACKED_FILE, JSON.stringify(trackedData, null, 2));
}

/**
 * Removes a job from jobs.json and full_archive.json.
 * @param {string} link 
 */
function removeJobFromActiveLists(link) {
    ensureDataDir();
    
    // Remove from jobs.json
    if (fs.existsSync(JOBS_FILE)) {
        const data = fs.readFileSync(JOBS_FILE, 'utf8');
        const jobs = data.trim() ? JSON.parse(data) : [];
        const filteredJobs = jobs.filter(j => j.link !== link);
        if (jobs.length !== filteredJobs.length) {
            fs.writeFileSync(JOBS_FILE, JSON.stringify(filteredJobs, null, 2));
            console.log(`Removed from ${JOBS_FILE}`);
        }
    }
    
    // Remove from full_archive.json
    if (fs.existsSync(ARCHIVE_FILE)) {
        const data = fs.readFileSync(ARCHIVE_FILE, 'utf8');
        const archive = data.trim() ? JSON.parse(data) : [];
        const filteredArchive = archive.filter(j => j.link !== link);
        if (archive.length !== filteredArchive.length) {
            fs.writeFileSync(ARCHIVE_FILE, JSON.stringify(filteredArchive, null, 2));
            console.log(`Removed from ${ARCHIVE_FILE}`);
        }
    }
}

module.exports = {
    ensureDataDir,
    loadHistory,
    saveHistory,
    saveJobs,
    loadTracked,
    saveTracked,
    removeJobFromActiveLists
};
