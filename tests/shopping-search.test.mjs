import assert from 'node:assert/strict';
import test from 'node:test';
import { matchesItemName } from '../src/features/inventory/shopping-search.ts';

test('name search supports partial names, spaces, width and kana variations', () => {
  for (const [name, query] of [['牛乳', '牛'], ['牛乳', ' 牛乳 '], ['ティッシュ', 'てぃっしゅ'], ['ミルク', 'ﾐﾙｸ'], ['ABC', 'ａｂｃ'], ['豆乳 牛乳', '牛乳 豆乳']]) {
    assert.equal(matchesItemName(name, query), true, `${name}: ${query}`);
  }
  assert.equal(matchesItemName('牛乳', ''), true);
  assert.equal(matchesItemName('牛乳', '洗剤'), false);
});

test('search follows current stock without modifying products', () => {
  const items = [{ id: 'milk', name: '牛乳', inStock: false, estimatedPrice: 250 }, { id: 'tea', name: 'お茶', inStock: true }];
  const original = JSON.stringify(items);
  const result = items.filter((item) => !item.inStock && matchesItemName(item.name, '乳'));
  assert.deepEqual(result.map((item) => item.id), ['milk']);
  assert.equal(JSON.stringify(items), original);
  const updated = items.map((item) => ({ ...item, inStock: true }));
  assert.equal(updated.filter((item) => !item.inStock && matchesItemName(item.name, '乳')).length, 0);
});
