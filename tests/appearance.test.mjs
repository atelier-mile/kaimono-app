import assert from 'node:assert/strict';
import test from 'node:test';
import { defaultAppearance, readAppearance, scaleAppStyles, textScales, displayScales } from '../src/features/appearance/appearance-model.ts';

test('old and invalid preferences preserve valid independent settings', () => {
  for (const value of [null, undefined, {}, { textSize: 'invalid' }]) assert.deepEqual(readAppearance(value), defaultAppearance);
  assert.deepEqual(readAppearance({ textSize: 'large' }), { textSize: 'large', displaySize: 'standard', inventoryColumns: 1 });
  assert.deepEqual(readAppearance({ displaySize: 'compact', textSize: 'bad' }), { textSize: 'standard', displaySize: 'compact', inventoryColumns: 1 });
});

test('column preferences round-trip independently and reject invalid values', () => {
  const saved = { textSize: 'large', displaySize: 'compact', inventoryColumns: 2 };
  assert.deepEqual(readAppearance(JSON.parse(JSON.stringify(saved))), saved);
  for (const inventoryColumns of [0, 3, '2', null]) {
    assert.equal(readAppearance({ ...saved, inventoryColumns }).inventoryColumns, 1);
  }
});

test('text choices scale text and line height without changing default spacing or original styles', () => {
  const base = { label: { fontSize: 16, lineHeight: 24, padding: 12, color: '#315B40' } };
  for (const size of ['small', 'standard', 'large']) {
    const actual = scaleAppStyles(base, textScales[size]);
    assert.equal(actual.label.fontSize, 16 * textScales[size]);
    assert.equal(actual.label.lineHeight, 24 * textScales[size]);
    assert.equal(actual.label.padding, 12);
    assert.equal(actual.label.color, base.label.color);
  }
  assert.equal(base.label.fontSize, 16);
});

test('all nine combinations keep typography independent from layout and preserve flex and percentages', () => {
  const base = { card: { padding: 20, gap: 10, fontSize: 16, lineHeight: 24, width: '100%', flex: 1, borderWidth: 1 } };
  for (const textScale of Object.values(textScales)) for (const displayScale of Object.values(displayScales)) {
    const actual = scaleAppStyles(base, textScale, displayScale).card;
    assert.equal(actual.fontSize, 16 * textScale);
    assert.equal(actual.lineHeight, 24 * textScale);
    assert.equal(actual.padding, 20 * displayScale);
    assert.equal(actual.gap, 10 * displayScale);
    assert.equal(actual.width, '100%');
    assert.equal(actual.flex, 1);
    assert.equal(actual.borderWidth, 1);
  }
  assert.equal(base.card.padding, 20);
});

test('compact controls retain usable touch areas', () => {
  const actual = scaleAppStyles({ closeButton: { width: 38, height: 38 }, nameInput: { minHeight: 40 } }, 1.2, 0.85);
  assert.ok(actual.closeButton.width >= 44);
  assert.ok(actual.closeButton.height >= 44);
  assert.ok(actual.nameInput.minHeight >= 44);
});
