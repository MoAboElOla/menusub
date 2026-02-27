import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldAutosave } from '../src/utils/menuAutosave.js';

test('shouldAutosave returns false for empty items array', () => {
  assert.equal(shouldAutosave([], false), false);
});

test('shouldAutosave returns false for undefined items', () => {
  assert.equal(shouldAutosave(undefined, false), false);
});

test('shouldAutosave returns true when at least one item has a name', () => {
  assert.equal(shouldAutosave([{ item_name_en: 'Coffee', item_name_ar: '' }], false), true);
});

test('shouldAutosave returns false when already saved', () => {
  assert.equal(shouldAutosave([{ item_name_en: 'Coffee' }], true), false);
});
