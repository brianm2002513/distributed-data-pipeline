const test = require('node:test');
const assert = require('node:assert/strict');
const { isRelevant } = require('../src/utils');

test('isRelevant keeps titles that contain a search keyword', () => {
    assert.equal(isRelevant('Senior Software Developer', 'software developer'), true);
    assert.equal(isRelevant('Frontend Developer', 'software developer'), true);
});

test('isRelevant drops unrelated titles for tech searches', () => {
    assert.equal(isRelevant('Sanitation Specialist', 'software developer'), false);
    assert.equal(isRelevant('Sales Representative', 'software developer'), false);
});

test('isRelevant supports non-tech search terms', () => {
    assert.equal(isRelevant('Graduate Trainee Programme', 'graduate trainee'), true);
    assert.equal(isRelevant('Office Administrator', 'graduate trainee'), false);
});

test('isRelevant rejects empty inputs', () => {
    assert.equal(isRelevant('', 'developer'), false);
    assert.equal(isRelevant(null, 'developer'), false);
    assert.equal(isRelevant('Developer', ''), false);
});