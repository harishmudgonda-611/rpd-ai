import test from'node:test';
import assert from'node:assert/strict';
import{analyzeVariants,normalizeColorName}from'./analyzer.js';

test('normalizes colour aliases',()=>assert.equal(normalizeColorName('Wine'),'maroon'));
test('deduplicates colours',()=>{const r=analyzeVariants([{color:'Wine',size:'M',sku:'A1'},{color:'Maroon',size:'M',sku:'A2'},{color:'Pink',size:'M',sku:'A3'}]);assert.equal(r.uniqueColorCount,2)});
test('creates explicit colour variants',()=>assert.equal(analyzeVariants([],['Black','Pink','Green']).variants.length,3));

test('rejects technical color values like hex codes, rgb, and css declarations', () => {
  const result = analyzeVariants([
    { color: '#ee5f73' },
    { color: 'rgb(238, 95, 115)' },
    { color: 'var(--primary-color)' },
    { color: 'color: #fff;' },
    { color: 'Pink' }
  ], ['#000000', 'Blue']);

  assert.equal(result.uniqueColorCount, 2);
  assert.deepEqual(result.colors.map(c => c.name), ['Pink', 'Blue']);
});
