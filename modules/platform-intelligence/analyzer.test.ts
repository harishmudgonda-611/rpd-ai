
import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzePlatformIntelligence } from './analyzer.js';

test('creates platform-specific requirements', () => {
  const result = analyzePlatformIntelligence('meesho');

  assert.equal(result.targets.length, 3);
  assert.equal(result.recommendedPrimary, 'instagram');
  assert.equal(result.targets[0].aspectRatio, '9:16');
});

test('keeps WhatsApp CTA platform-specific', () => {
  const result = analyzePlatformIntelligence(
    'amazon',
    ['whatsapp'],
  );

  assert.equal(
    result.targets[0].cta,
    'Join WhatsApp for daily deals',
  );
});
