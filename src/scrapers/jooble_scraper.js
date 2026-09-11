const path = require('path');
const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
const config = require('../config');
const { normalizeJob, isValidJob } = require('../lib/jobs');

chromium.use(stealth);

/**
 * Scraper for Jooble (South Africa/Zimbabwe)
 * Using browser instead of API because API gives irrelevant results.
 * @param {string} searchTerm 
 * @param {string} countryCode 'za' or 'zw'
 */
async function scrapeJooble(searchTerm = 'software', countryCode = 'za') {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    const domain = 'jooble.org';
    const location = countryCode === 'zw' ? 'Zimbabwe' : 'South Africa';
    // Use za subdomain for SA, and main domain with location keyword for Zim
    const baseUrl = countryCode === 'za' ? `https://za.${domain}` : `https://${domain}`;
    const query = countryCode === 'zw' ? `${searchTerm} ${location}` : searchTerm;
    const url = `${baseUrl}/SearchResult?ukw=${encodeURIComponent(query)}`;
    
    console.log(`Searching Jooble (${location}): ${url}`);
    
    const jobs = [];
    
    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(4000);
        await page.screenshot({ path: path.join(config.dataDir, `screenshot_jooble_${countryCode}.png`), fullPage: true });
        
        // Handle the "Time for a new Job?" modal if it appears
        const modalClose = await page.$('[data-test-name="_confirmSubscribePopupCloseButton"], button[class*="close"], [class*="modal"] button');
        if (modalClose) {
            await modalClose.click().catch(() => null);
            await page.waitForTimeout(1000);
        }

        // Selector for job cards on Jooble
        const jobElements = await page.$$('[data-test-name="_jobCard"], article, [class*="job-list-item"]');
        
        for (const el of jobElements) {
            try {
                const titleEl = await el.$('h2 a');
                if (!titleEl) continue;
                
                const title = await titleEl.innerText();
                const link = await titleEl.getAttribute('href');
                
                const companyEl = await el.$('[data-test-name="_companyName"]');
                const company = companyEl ? await companyEl.innerText() : 'Jooble Listing';

                const locEl = await el.$('.caption');
                const jobLoc = locEl ? await locEl.innerText() : location;

                if (link) {
                    jobs.push(normalizeJob({
                        title,
                        company,
                        location: jobLoc,
                        link: link.startsWith('http') ? link : `${baseUrl}${link}`,
                        source: `Jooble (${location})`,
                    }));
                }
            } catch (innerError) {
                console.error('Error processing job element:', innerError);
            }
        }
    } catch (error) {
        console.error(`Error scraping Jooble (${location}):`, error.message);
    } finally {
        await browser.close().catch(() => null);
    }
    
    console.log(`Jooble scraper finished for ${location}. Found ${jobs.length} jobs.`);
    return jobs.filter(isValidJob);
}

module.exports = scrapeJooble;
