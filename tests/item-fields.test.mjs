import assert from 'node:assert/strict';
import test from 'node:test';

import { isEstimatedPrice, parseEstimatedPrice } from '../src/features/inventory/item-fields.ts';

test('optional yen input accepts zero, whole numbers, full-width digits and grouped yen', () => {
  for (const [input, expected] of [['0', 0], ['1250', 1250], ['1,250', 1250], [' １２５０ ', 1250]]) {
    assert.equal(parseEstimatedPrice(input), expected);
  }
  assert.equal(parseEstimatedPrice(''), undefined);
  assert.equal(parseEstimatedPrice('   '), undefined);
});

test('invalid yen never becomes a saved price', () => {
  for (const input of ['-1', '1.5', 'abc', 'NaN', 'Infinity', '1e3', '0x10', '1,2', '1,,250', ',', '9007199254740992']) {
    assert.equal(parseEstimatedPrice(input), undefined, input);
  }
  for (const value of [undefined, null, '1250', -1, NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(isEstimatedPrice(value), false);
  }
  assert.equal(isEstimatedPrice(0), true);
});
