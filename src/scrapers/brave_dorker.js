const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();

chromium.use(stealth);

/**
 * Scraper for ATS Dorking using Brave Search
 * @param {string} searchTerm 
 * @param {string} region 
 */
async function dorkBrave(searchTerm = 'software', region = 'South Africa') {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    let queries = [];
    if (region.toLowerCase() === 'remote') {
        queries = [
            `site:boards.greenhouse.io ${searchTerm} "remote" "worldwide"`,
            `site:jobs.lever.co ${searchTerm} "remote" "anywhere"`,
            `site:jobs.workable.com ${searchTerm} "remote"`,
            `site:ashbyhq.com ${searchTerm} "remote"`,
        ];
    } else {
        queries = [
            `site:boards.greenhouse.io ${searchTerm} ${region}`,
            `site:jobs.lever.co ${searchTerm} ${region}`,
            `site:jobs.workable.com ${searchTerm} ${region}`,
            `site:ashbyhq.com ${searchTerm} ${region}`,
            // SA & Zim Specific Boards
            `site:pnet.co.za ${searchTerm} ${region}`,
            `site:careers24.com ${searchTerm} ${region}`
        ];
    }
    
    const jobs = [];
    
    try {
        for (const query of queries) {
            const url = `https://search.brave.com/search?q=${encodeURIComponent(query)}`;
            console.log(`Dorking Brave Search: ${url}`);
            
            try {
                await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
                await page.waitForTimeout(3000);
                
                const results = await page.$$('a');
                
                for (const el of results) {
                    const link = await el.getAttribute('href').catch(() => null);
                    
                    const validDomains = [
                        'greenhouse.io', 'lever.co', 'workable.com', 
                        'ashbyhq.com', 'bamboohr.com', 'smartrecruiters.com',
                        'pnet.co.za', 'careers24.com'
                    ];

                    if (link && link.startsWith('http') && validDomains.some(domain => link.includes(domain))) {
                        const title = await el.innerText().catch(() => 'ATS Role');
                        const junkTitles = ['Images', 'Videos', 'Goggles', 'Google', 'Mojeek', 'News', 'Maps'];
                        
                        if (title.length > 5 && !junkTitles.includes(title.trim())) {
                            jobs.push({
                                title: title.trim(),
                                company: 'Direct (ATS)',
                                location: region,
                                link,
                                source: 'Brave Dorker',
                                date_found: new Date().toISOString().split('T')[0]
                            });
                        }
                    }
                }
            } catch (error) {
                console.error(`Brave Dorking error for ${query}:`, error.message);
            }
        }
    } finally {
        await browser.close().catch(() => null);
    }
    
    return jobs;
}

module.exports = dorkBrave;
