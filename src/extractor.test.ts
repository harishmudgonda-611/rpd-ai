import test from 'node:test';
import assert from 'node:assert/strict';
import { extractProduct } from './extractor.js';

const html = `<!doctype html><html><head>
<link rel="canonical" href="https://shop.test/p/kurti" />
<meta property="og:title" content="Blue Printed Kurti Set" />
<meta property="og:image" content="/images/kurti.jpg" />
<script type="application/ld+json">{
  "@context":"https://schema.org",
  "@type":"Product",
  "name":"Blue Printed Kurti Set",
  "description":"Cotton kurti set for everyday wear",
  "brand":{"@type":"Brand","name":"Test Fashion"},
  "image":["/images/kurti-front.jpg","/images/kurti-back.jpg"],
  "color":"Blue",
  "offers":{"@type":"Offer","price":"799","priceCurrency":"INR","availability":"https://schema.org/InStock"},
  "aggregateRating":{"ratingValue":"4.4","reviewCount":"125"}
}</script></head><body><h1>Fallback title</h1></body></html>`;

test('extracts normalized product data from JSON-LD and metadata', () => {
  const product = extractProduct(html, 'https://shop.test/p/kurti');
  assert.equal(product.title.value, 'Blue Printed Kurti Set');
  assert.equal(product.brand.value, 'Test Fashion');
  assert.equal(product.price.value, 799);
  assert.equal(product.currency.value, 'INR');
  assert.equal(product.colors[0]?.name, 'Blue');
  assert.equal(product.images.length, 3);
  assert.equal(product.rating.value, 4.4);
  assert.equal(product.reviewCount.value, 125);
  assert.equal(product.extraction.warnings.length, 0);
});

test('does not invent missing product facts', () => {
  const product = extractProduct('<html><head><title>Unknown</title></head><body></body></html>', 'https://shop.test/x');
  assert.equal(product.price.value, null);
  assert.equal(product.colors.length, 0);
  assert.ok(product.extraction.warnings.length >= 3);
});
