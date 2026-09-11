const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();

chromium.use(stealth);

/**
 * Scraper for iHarareJobs.com (Zimbabwe)
 * @param {string} searchTerm 
 */
async function scrapeIHarare(searchTerm = 'software') {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    const url = `https://ihararejobs.com/?s=${encodeURIComponent(searchTerm)}`;
    console.log(`Searching iHarare Jobs: ${url}`);
    
    const jobs = [];
    
    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'data/screenshot_iharare.png', fullPage: true });
        
        const jobElements = await page.$$('h3 a');
        
        for (const el of jobElements) {
            let link = await el.getAttribute('href');
            
            if (link && link.includes('/job/')) {
                // Prepend domain if relative
                if (link.startsWith('/')) {
                    link = `https://ihararejobs.com${link}`;
                }
                
                jobs.push({
                    title: await el.innerText(),
                    company: 'iHarare Listing',
                    location: 'Zimbabwe',
                    link,
                    source: 'iHarare Jobs',
                    date_found: new Date().toISOString().split('T')[0]
                });
            }
        }
        
    } catch (error) {
        console.error('Error scraping iHarare:', error.message);
    } finally {
        await browser.close().catch(() => null);
    }
    
    return jobs;
}

module.exports = scrapeIHarare;
