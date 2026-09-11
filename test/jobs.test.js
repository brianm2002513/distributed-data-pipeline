const test = require('node:test');
const assert = require('node:assert/strict');
const { stripHtml, normalizeJob, isValidJob, dedupeJobs } = require('../src/lib/jobs');

test('stripHtml removes markup and collapses whitespace', () => {
    assert.equal(stripHtml('<b>Senior</b> Software   Developer'), 'Senior Software Developer');
    assert.equal(stripHtml(''), '');
    assert.equal(stripHtml(null), '');
});

test('normalizeJob shapes raw records into the canonical form', () => {
    const job = normalizeJob({
        title: '  <b>Backend</b> Engineer  ',
        link: '  https://example.com/job/1  ',
        source: 'Adzuna (za)',
    });
    assert.equal(job.title, 'Backend Engineer');
    assert.equal(job.link, 'https://example.com/job/1');
    assert.equal(job.company, 'Unknown');
    assert.equal(job.location, 'Unknown');
    assert.match(job.date_found, /^\d{4}-\d{2}-\d{2}$/);
});

test('normalizeJob keeps an explicit date when provided', () => {
    const job = normalizeJob({ title: 'Data Engineer', link: 'https://a.co/1', date_found: '2026-09-01' });
    assert.equal(job.date_found, '2026-09-01');
});

test('isValidJob accepts complete listings', () => {
    assert.equal(isValidJob({ title: 'Backend Engineer', link: 'https://example.com/1' }), true);
});

test('isValidJob rejects broken records', () => {
    assert.equal(isValidJob(null), false);
    assert.equal(isValidJob({ link: 'https://example.com/1' }), false);
    assert.equal(isValidJob({ title: 'ab', link: 'https://example.com/1' }), false);
    assert.equal(isValidJob({ title: 'Backend Engineer' }), false);
    assert.equal(isValidJob({ title: 'Backend Engineer', link: 'javascript:alert(1)' }), false);
    assert.equal(isValidJob({ title: 'Backend Engineer', link: 'not a url' }), false);
});

test('dedupeJobs keeps the first occurrence of each link', () => {
    const a = { title: 'Job A', link: 'https://example.com/1' };
    const b = { title: 'Job A copy', link: 'https://example.com/1' };
    const c = { title: 'Job C', link: 'https://example.com/2' };
    const result = dedupeJobs([a, b, c]);
    assert.equal(result.length, 2);
    assert.equal(result[0].title, 'Job A');
    assert.equal(result[1].title, 'Job C');
});

test('dedupeJobs drops records without links', () => {
    const result = dedupeJobs([{ title: 'No link here' }, { title: 'Job A', link: 'https://example.com/1' }]);
    assert.equal(result.length, 1);
});