const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();

chromium.use(stealth);

/**
 * Scraper for VacancyMail.co.zw (Zimbabwe)
 * @param {string} searchTerm 
 */
async function scrapeVacancyMail(searchTerm = 'software') {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    const url = `https://vacancymail.co.zw/?s=${encodeURIComponent(searchTerm)}`;
    console.log(`Searching VacancyMail: ${url}`);
    
    const jobs = [];
    
    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'data/screenshot_vacancymail.png', fullPage: true });
        
        await page.waitForSelector('article, .post, .job-list-item, h3', { timeout: 10000 }).catch(() => null);
        
        const jobElements = await page.$$('h3 a');
        
        for (const el of jobElements) {
            const title = await el.innerText();
            const link = await el.getAttribute('href');
            
            if (link && !link.includes('category') && !link.includes('author')) {
                jobs.push({
                    title,
                    company: 'VacancyMail Listing',
                    location: 'Zimbabwe',
                    link,
                    source: 'VacancyMail',
                    date_found: new Date().toISOString().split('T')[0]
                });
            }
        }
    } catch (error) {
        console.error('Error scraping VacancyMail:', error.message);
    } finally {
        await browser.close().catch(() => null);
    }
    
    return jobs;
}

module.exports = scrapeVacancyMail;
