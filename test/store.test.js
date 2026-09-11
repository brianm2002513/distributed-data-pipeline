const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// Point the pipeline at a throwaway directory BEFORE loading the module.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pipeline-store-test-'));
process.env.DATA_DIR = tmpDir;
const store = require('../src/store');

const job = (link) => ({
    title: 'Software Developer',
    company: 'Test Co',
    location: 'Harare',
    link,
    source: 'Test',
    date_found: '2026-09-09',
});

test('fresh directories load as empty', () => {
    assert.equal(store.loadHistory().size, 0);
    assert.deepEqual(store.loadTracked(), {});
});

test('history round-trips through save and load', () => {
    store.saveHistory(new Set(['https://example.com/1', 'https://example.com/2']));
    const loaded = store.loadHistory();
    assert.ok(loaded instanceof Set);
    assert.equal(loaded.size, 2);
    assert.ok(loaded.has('https://example.com/1'));
});

test('saveJobs writes the latest batch and appends the archive', () => {
    store.saveJobs([job('https://example.com/a')]);
    store.saveJobs([job('https://example.com/b'), job('https://example.com/c')]);

    const latest = JSON.parse(fs.readFileSync(path.join(tmpDir, 'jobs.json'), 'utf8'));
    const archive = JSON.parse(fs.readFileSync(path.join(tmpDir, 'full_archive.json'), 'utf8'));
    assert.equal(latest.length, 2);
    assert.equal(archive.length, 3);
});

test('tracked jobs round-trip through save and load', () => {
    store.saveTracked({ 'https://example.com/a': { status: 'applied', date: '2026-09-09' } });
    const tracked = store.loadTracked();
    assert.equal(tracked['https://example.com/a'].status, 'applied');
});

test('removeJobFromActiveLists removes a listing from jobs and archive', () => {
    store.saveJobs([job('https://example.com/x'), job('https://example.com/y')]);
    store.removeJobFromActiveLists('https://example.com/x');

    const latest = JSON.parse(fs.readFileSync(path.join(tmpDir, 'jobs.json'), 'utf8'));
    assert.equal(latest.length, 1);
    assert.equal(latest[0].link, 'https://example.com/y');
});