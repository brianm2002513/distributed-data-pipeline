const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeJob, isValidJob, dedupeJobs } = require('../src/lib/jobs');

// A raw record shaped like what the Adzuna API actually returns.
const adzunaResult = {
    title: '<b>Graduate</b> Software Developer',
    company: { display_name: 'TechFlow (ZA)' },
    location: { display_name: 'Cape Town, South Africa' },
    redirect_url: 'https://www.adzuna.co.za/jobs/1',
};

const mapped = normalizeJob({
    title: adzunaResult.title,
    company: adzunaResult.company.display_name,
    location: adzunaResult.location.display_name,
    link: adzunaResult.redirect_url,
    source: 'Adzuna (za)',
});

test('raw API records flow through the full pipeline core', () => {
    assert.equal(mapped.title, 'Graduate Software Developer');
    assert.equal(mapped.company, 'TechFlow (ZA)');
    assert.equal(mapped.location, 'Cape Town, South Africa');
    assert.equal(isValidJob(mapped), true);
});

test('broken records are filtered before they reach the archive', () => {
    const batch = [
        mapped,
        { title: '', link: 'https://example.com/2', source: 'Jooble (za)' },
        { title: 'Backend Engineer', link: 'ftp://bad.example/3', source: 'Jooble (za)' },
        { title: 'Backend Engineer', source: 'Jooble (za)' },
        { title: 'Data Engineer', company: 'DataCo', location: 'Harare', link: 'https://jobs.lever.co/4', source: 'Jooble (zw)' },
    ];
    const valid = batch.filter(isValidJob);
    assert.equal(valid.length, 2);
    assert.equal(dedupeJobs(valid).length, 2);
});

test('duplicates across sources collapse to one record', () => {
    const fromJooble = normalizeJob({
        title: 'Graduate Software Developer',
        company: 'Jooble Listing',
        link: 'https://www.adzuna.co.za/jobs/1',
        source: 'Jooble (za)',
    });
    const unique = dedupeJobs([mapped, fromJooble]);
    assert.equal(unique.length, 1);
    assert.equal(unique[0].source, 'Adzuna (za)');
});