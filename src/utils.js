/**
 * Checks if a job title is relevant to the search term.
 * Helps filter out "Sanitation Specialist" when searching for "Developer".
 * @param {string} title 
 * @param {string} searchTerm 
 * @returns {boolean}
 */
function isRelevant(title, searchTerm) {
    if (!title || !searchTerm) return false;
    
    const normalizedTitle = title.toLowerCase();
    const keywords = searchTerm.toLowerCase().split(' ').filter(k => k.length > 2);
    
    // Core technical keywords that MUST be present for a tech search if the search term has them
    const techKeywords = ['developer', 'engineer', 'software', 'programmer', 'frontend', 'backend', 'fullstack', 'data', 'devops', 'analyst', 'tech'];
    const searchHasTech = keywords.some(k => techKeywords.includes(k));
    
    // If we are searching for tech, the title should probably have at least one tech keyword
    if (searchHasTech) {
        const titleHasTech = techKeywords.some(tk => normalizedTitle.includes(tk));
        if (!titleHasTech) return false;
    }
    
    // Title must contain at least one of the keywords from the search term
    return keywords.some(k => normalizedTitle.includes(k));
}

module.exports = { isRelevant };
