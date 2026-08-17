import test from 'node:test';
import assert from 'node:assert/strict';
import {buildStructuredPrompt,generateContent} from './generator.js';
import type {ContentRequest} from './types.js';

const request:ContentRequest={product:{title:'Georgette Embroidery Kurti',brand:'Test Fashion',price:466,currency:'INR',mrp:999,discountPercent:53,category:'kurti',description:'Embroidered georgette kurti',colors:['Pink','Black','Green'],sizes:['S','M','L'],features:['Embroidered','Lightweight'],occasions:['Festive','Casual']},angle:'price',cta:'shop-now',brandVoice:'deal',locale:'en-IN',slideCount:7};

test('generates structured carousel content without inventing product facts',()=>{const out=generateContent(request);assert.ok(out.hook.includes('₹466'));assert.equal(out.carousel.length,7);assert.ok(out.carousel.some(s=>s.role==='colors'));assert.ok(out.caption.includes('₹466'));assert.ok(out.hashtags.length>0);});

test('does not fabricate price when unavailable',()=>{const r={...request,product:{...request.product,price:null}};const out=generateContent(r);assert.equal(out.warnings.some(x=>x.includes('Price unavailable')),true);assert.equal(out.caption.includes('₹466'),false);});

test('builds provider-neutral structured prompt',()=>{const p=buildStructuredPrompt(request);assert.ok(p.system.includes('Never invent product facts'));assert.ok(p.user.includes('Georgette Embroidery Kurti'));});
