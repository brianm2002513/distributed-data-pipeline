/**
 * Pure core of the pipeline: normalize raw listings, validate them and
 * remove duplicates. No network and no filesystem access, so this core
 * can be fully tested offline.
 */

const HTTP_LINK_PATTERN = /^https?:\/\/\S+/i;

/**
 * Strips HTML tags and collapses whitespace.
 * @param {string} text
 * @returns {string}
 */
function stripHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/<\/?[^>]+(>|$)/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Today's date as YYYY-MM-DD.
 * @returns {string}
 */
function today() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Shapes a raw listing into the canonical pipeline record.
 * Missing fields are filled with safe defaults instead of propagating junk.
 * @param {object} raw
 * @returns {object}
 */
function normalizeJob(raw) {
    if (!raw || typeof raw !== 'object') {
        return { title: '', company: 'Unknown', location: 'Unknown', link: '', source: 'Unknown', date_found: today() };
    }
    return {
        title: stripHtml(raw.title),
        company: raw.company ? String(raw.company).trim() : 'Unknown',
        location: raw.location ? String(raw.location).trim() : 'Unknown',
        link: raw.link ? String(raw.link).trim() : '',
        source: raw.source || 'Unknown',
        date_found: raw.date_found || today(),
    };
}

/**
 * Validation gate: a listing is kept only if it has a usable title and a
 * real web link. This is what stops broken records from reaching the archive.
 * @param {object} job
 * @returns {boolean}
 */
function isValidJob(job) {
    if (!job || typeof job !== 'object') return false;
    if (!job.title || job.title.trim().length < 3) return false;
    if (!job.link || !HTTP_LINK_PATTERN.test(job.link)) return false;
    return true;
}

/**
 * Removes duplicate listings by link, keeping the first occurrence.
 * @param {Array<object>} jobs
 * @returns {Array<object>}
 */
function dedupeJobs(jobs) {
    const seen = new Set();
    const unique = [];
    for (const job of jobs || []) {
        if (!job.link || seen.has(job.link)) continue;
        seen.add(job.link);
        unique.push(job);
    }
    return unique;
}

module.exports = { stripHtml, today, normalizeJob, isValidJob, dedupeJobs };