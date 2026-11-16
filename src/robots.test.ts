import test from 'node:test';
import assert from 'node:assert/strict';
import { robotsAllows } from './robots.js';

test('allows paths not covered by a disallow rule', () => {
  assert.equal(robotsAllows('User-agent: *\nDisallow: /private', '/products/1'), true);
});

test('blocks disallowed paths and honours a more specific allow rule', () => {
  const rules = 'User-agent: *\nDisallow: /catalog\nAllow: /catalog/public';
  assert.equal(robotsAllows(rules, '/catalog/private'), false);
  assert.equal(robotsAllows(rules, '/catalog/public/item'), true);
});

test('prefers rules for the matching crawler over wildcard rules', () => {
  const rules = 'User-agent: *\nDisallow: /\nUser-agent: RPD-Product-Intelligence\nAllow: /';
  assert.equal(robotsAllows(rules, '/item'), true);
});

test('supports wildcard path segments and end anchors', () => {
  const rules = 'User-agent: *\\nDisallow: /private/*\\nAllow: /private/public$';
  assert.equal(robotsAllows(rules, '/private/secret'), false);
  assert.equal(robotsAllows(rules, '/private/public'), true);
  assert.equal(robotsAllows(rules, '/private/public/child'), false);
});
