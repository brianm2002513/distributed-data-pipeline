const scrapeIndeedSA = require('./src/scrapers/indeed_sa');
const scrapeVacancyMail = require('./src/scrapers/vacancymail_zim');
const scrapeIHarare = require('./src/scrapers/iharare_zim');
const scrapeATSDorker = require('./src/scrapers/ats_dorker');
const dorkBrave = require('./src/scrapers/brave_dorker');
const scrapeAdzuna = require('./src/scrapers/adzuna');
const scrapeJooble = require('./src/scrapers/jooble_scraper');
const { ensureDataDir, loadHistory, saveHistory, saveJobs, loadTracked } = require('./src/store');
const { isValidJob, dedupeJobs } = require('./src/lib/jobs');
const { isRelevant } = require('./src/utils');

async function main() {
    const searchTerm = process.argv[2] || 'software developer';
    console.log(`Starting job data pipeline for: "${searchTerm}"`);

    ensureDataDir();
    const history = loadHistory();
    const tracked = loadTracked();
    const trackedLinks = new Set(Object.keys(tracked));
    const allJobs = [];

    console.log('\n--- Running Indeed SA ---');
    allJobs.push(...await scrapeIndeedSA(searchTerm));

    console.log('\n--- Running VacancyMail ZW ---');
    allJobs.push(...await scrapeVacancyMail(searchTerm));

    console.log('\n--- Running iHarare ZW ---');
    allJobs.push(...await scrapeIHarare(searchTerm));

    console.log('\n--- Running ATS Dorker (DuckDuckGo) ---');
    allJobs.push(...await scrapeATSDorker(searchTerm, 'South Africa'));
    allJobs.push(...await scrapeATSDorker(searchTerm, 'Zimbabwe'));
    allJobs.push(...await scrapeATSDorker(searchTerm, 'Remote'));

    console.log('\n--- Running Brave Search Dorker ---');
    allJobs.push(...await dorkBrave(searchTerm, 'South Africa'));
    allJobs.push(...await dorkBrave(searchTerm, 'Zimbabwe'));
    allJobs.push(...await dorkBrave(searchTerm, 'Remote'));

    console.log('\n--- Querying Adzuna API (ZA) ---');
    allJobs.push(...await scrapeAdzuna(searchTerm, 'za'));

    console.log('\n--- Running Jooble Scraper ---');
    allJobs.push(...await scrapeJooble(searchTerm, 'za'));
    allJobs.push(...await scrapeJooble(searchTerm, 'zw'));

    console.log(`\nCaptured ${allJobs.length} raw listings.`);

    // Validate: drop records with missing titles or broken links.
    const validJobs = allJobs.filter(isValidJob);

    // Deduplicate: same link from two sources collapses to one record.
    const uniqueJobs = dedupeJobs(validJobs);
    console.log(`Validation kept ${uniqueJobs.length} valid, unique listings.`);

    // Relevance: keep only listings that match the search term.
    const relevantJobs = uniqueJobs.filter(job => isRelevant(job.title, searchTerm));
    console.log(`Relevance filter kept ${relevantJobs.length} listings.`);

    // Seen-history: skip anything captured or tracked in earlier runs.
    const newJobs = relevantJobs.filter(job => !history.has(job.link) && !trackedLinks.has(job.link));
    console.log(`Identified ${newJobs.length} NEW listings.`);

    if (newJobs.length > 0) {
        saveJobs(newJobs);
        saveHistory(history);
    } else {
        console.log('No new jobs found this run.');
    }

    console.log('\nPipeline run complete.');
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
