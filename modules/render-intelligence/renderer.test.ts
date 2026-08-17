import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { renderRPD } from './renderer.js';

test('renders RPD slides into real SVG and HTML files', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'rpd-render-'));

  const result = await renderRPD(
    {
      productTitle: 'Printed Kurti',
      price: 799,
      mrp: 1499,
      discount: 47,
      productImages: [
        'https://cdn.example.com/products/kurti.jpg',
      ],
      slides: [
        {
          index: 1,
          role: 'hook',
          headline: 'This kurti is worth seeing 👀',
        },
        {
          index: 2,
          role: 'price',
          headline: 'Under ₹799',
        },
      ],
      template: 'rpd-pink-deal',
    },
    dir,
  );

  assert.equal(result.success, true);
  assert.equal(result.slideCount, 2);
  assert.equal(result.assets.length, 4);

  const svg = await readFile(
    join(dir, 'rpd-slide-01.svg'),
    'utf8',
  );

  assert.match(svg, /<svg/);
  assert.match(svg, /Printed Kurti/);
  assert.match(svg, /1080/);
});

test('does not fail when visual assets are unavailable', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'rpd-render-'));

  const result = await renderRPD(
    {
      productTitle: 'Unknown Product',
      slides: [
        {
          index: 1,
          role: 'hero',
          headline: 'Unknown Product',
        },
      ],
    },
    dir,
  );

  assert.equal(result.success, true);
  assert.ok(
    result.warnings.some((x) =>
      x.includes('No trusted visual asset'),
    ),
  );
});
