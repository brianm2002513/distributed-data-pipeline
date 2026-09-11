const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();

chromium.use(stealth);

/**
 * Scraper that uses Google Search to find ATS links (Greenhouse/Lever)
 * @param {string} searchTerm 
 * @param {string} region 
 */
async function scrapeATSDorker(searchTerm = 'software developer', region = 'South Africa') {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    // DDG works better with single-site queries
    let queries = [];
    if (region.toLowerCase() === 'remote') {
        queries = [
            `site:boards.greenhouse.io ${searchTerm} "remote" "worldwide"`,
            `site:jobs.lever.co ${searchTerm} "remote" "anywhere"`,
            `site:jobs.workable.com ${searchTerm} "remote"`,
            `site:ashbyhq.com ${searchTerm} "remote"`,
            `site:smartrecruiters.com ${searchTerm} "remote" "worldwide"`
        ];
    } else {
        queries = [
            `site:boards.greenhouse.io ${searchTerm} ${region}`,
            `site:jobs.lever.co ${searchTerm} ${region}`,
            `site:jobs.workable.com ${searchTerm} ${region}`,
            `site:ashbyhq.com ${searchTerm} ${region}`,
            `site:bamboohr.com/jobs ${searchTerm} ${region}`,
            // SA & Zim Specific Boards
            `site:pnet.co.za ${searchTerm} ${region}`,
            `site:careers24.com ${searchTerm} ${region}`
        ];
    }
    
    const jobs = [];
    
    for (const query of queries) {
        const url = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
        console.log(`Dorking DuckDuckGo: ${url}`);
        
        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
            await page.waitForTimeout(3000); // Give it time to load
            
            const screenshotName = `screenshot_ats_${region.toLowerCase().replace(/\s+/g, '_')}_${query.split(':')[1].split(' ')[0]}.png`;
            await page.screenshot({ path: `data/${screenshotName}` });
            
            const results = await page.$$('[data-testid="result-title-a"]');
            
            for (const el of results) {
                const title = await el.innerText().catch(() => 'ATS Role');
                const link = await el.getAttribute('href').catch(() => null);
                
                const validDomains = [
                    'greenhouse.io', 'lever.co', 'workable.com', 
                    'ashbyhq.com', 'bamboohr.com', 'smartrecruiters.com',
                    'pnet.co.za', 'careers24.com'
                ];
                
                if (link && validDomains.some(domain => link.includes(domain))) {
                    jobs.push({
                        title,
                        company: 'Direct (ATS)',
                        location: region,
                        link,
                        source: 'ATS Dorker (via DDG)',
                        date_found: new Date().toISOString().split('T')[0]
                    });
                }
            }
        } catch (error) {
            console.error(`Error dorking ${query}:`, error.message);
        }
    }
    
    await browser.close();
    return jobs;
}

module.exports = scrapeATSDorker;
