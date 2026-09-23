import test from 'node:test';
import assert from 'node:assert/strict';
import { importAffiliateCsv } from './affiliate-import.js';

test('parses affiliate conversion CSV without inventing missing revenue fields', async () => {
  process.env.NODE_ENV = 'test';
  const result = await importAffiliateCsv([
    'order_id,affiliate_network,order_timestamp,order_status,order_value,commission,currency',
    'ORD-1,EarnKaro,2026-09-23T10:00:00Z,confirmed,1499,74.95,INR',
    ',EarnKaro,2026-09-23T10:00:00Z,confirmed,999,49,INR'
  ].join('\n'));
  assert.equal(result.imported, 1);
  assert.equal(result.skipped, 1);
  assert.equal(result.orders[0]?.orderId, 'ORD-1');
  assert.equal(result.orders[0]?.commission, 74.95);
  assert.match(result.errors[0]?.error ?? '', /order_id is required/);
});
