const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();

chromium.use(stealth);

/**
 * Scraper for Indeed South Africa (via DuckDuckGo pivot)
 * @param {string} searchTerm 
 */
async function scrapeIndeedSA(searchTerm = 'software') {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Pivot to DuckDuckGo to avoid CAPTCHA
    const url = `https://duckduckgo.com/?q=site%3Aza.indeed.com%20${encodeURIComponent(searchTerm)}%20South%20Africa`;
    console.log(`Pivoting Indeed SA to DuckDuckGo Search: ${url}`);
    
    const jobs = [];
    
    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(2000); 
        await page.screenshot({ path: 'data/screenshot_indeed.png', fullPage: true });
        
        const results = await page.$$('[data-testid="result-title-a"]');
        
        for (const el of results) {
            const title = await el.innerText();
            const link = await el.getAttribute('href');
            
            if (link && link.includes('indeed.com')) {
                jobs.push({
                    title,
                    company: 'Indeed Listing',
                    location: 'South Africa',
                    link,
                    source: 'Indeed (via DDG)',
                    date_found: new Date().toISOString().split('T')[0]
                });
            }
        }
    } catch (error) {
        console.error('Error scraping Indeed SA:', error.message);
    } finally {
        await browser.close().catch(() => null);
    }
    
    return jobs;
}

module.exports = scrapeIndeedSA;
