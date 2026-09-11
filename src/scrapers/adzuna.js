const axios = require('axios');
const config = require('../config');
const { normalizeJob, isValidJob } = require('../lib/jobs');

/**
 * Scraper for the Adzuna REST API.
 * @param {string} searchTerm
 * @param {string} country (za, etc)
 */
async function scrapeAdzuna(searchTerm = 'software', country = 'za') {
    const { appId, appKey } = config.adzuna;

    if (!appId || !appKey || appId === 'your_app_id_here') {
        console.warn('Adzuna API keys not set. Skipping Adzuna.');
        return [];
    }

    const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=20&what=${encodeURIComponent(searchTerm)}`;

    console.log(`Querying Adzuna API (${country}): ${searchTerm}`);

    try {
        const response = await axios.get(url);
        const results = response.data.results || [];

        return results
            .map(job => normalizeJob({
                title: job.title,
                company: job.company.display_name,
                location: job.location.display_name,
                link: job.redirect_url,
                source: `Adzuna (${country})`,
            }))
            .filter(isValidJob);
    } catch (error) {
        console.error('Adzuna API error:', error.message);
        return [];
    }
}

module.exports = scrapeAdzuna;
