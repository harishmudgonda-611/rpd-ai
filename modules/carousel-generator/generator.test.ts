import test from 'node:test';import assert from 'node:assert/strict';import{generateCarousel,renderSlideHtml,validateCarousel}from './generator.js';
const input={productTitle:'Georgette Embroidery Kurti',price:'₹466',mrp:'₹999',discount:'53% OFF',colours:['Pink','Black','Green'],modelImage:'model.jpg',content:{hook:'₹466 and it looks this good? 👀',slides:[{role:'hook',headline:'₹466 and it looks this good?'},{role:'hero',headline:'Georgette Embroidery Kurti',body:'Everyday fashion pick'},{role:'benefits',headline:'Why you’ll like it',body:'Easy to style'},{role:'colours',headline:'Pick your colour',body:'Pink • Black • Green'},{role:'price',headline:'Only ₹466',body:'₹999 MRP • 53% OFF'},{role:'cta',headline:'Tap the link to shop'}]}};
test('creates valid 1080x1350 carousel',()=>{const d=generateCarousel(input);const v=validateCarousel(d);assert.equal(d.width,1080);assert.equal(d.height,1350);assert.equal(d.slides.length,6);assert.equal(v.valid,true);});
test('renders deterministic slide HTML',()=>{const d=generateCarousel(input);const html=renderSlideHtml(d,0);assert.ok(html.includes('1080px'));assert.ok(html.includes('₹466'));});
test('rejects invalid slide count',()=>{const d=generateCarousel({...input,content:{...input.content,slides:input.content.slides.slice(0,3)}});assert.equal(validateCarousel(d).valid,false);});

test('supports new template options HIGH_FASHION_SPLIT and MAGAZINE_COVER', ()=>{
  const d1 = generateCarousel({ ...input, template: 'HIGH_FASHION_SPLIT' });
  assert.equal(d1.template, 'HIGH_FASHION_SPLIT');
  assert.equal(validateCarousel(d1).valid, true);

  const d2 = generateCarousel({ ...input, template: 'MAGAZINE_COVER' });
  assert.equal(d2.template, 'MAGAZINE_COVER');
  assert.equal(validateCarousel(d2).valid, true);
});

test('slide editing field isolation regression test', () => {
  const d = generateCarousel(input);
  const slide = d.slides[5]; // CTA slide

  // 1. Changing CTA modifies ONLY CTA
  slide.cta = 'Click link in bio to buy';
  assert.equal(slide.cta, 'Click link in bio to buy');

  const html = renderSlideHtml(d, 5);
  assert.ok(html.includes('Click link in bio to buy'));

  // 2. Verify CTA does NOT overwrite hook or details
  assert.notEqual(slide.hook, 'Click link in bio to buy');
  assert.notEqual(slide.details, 'Click link in bio to buy');
});
