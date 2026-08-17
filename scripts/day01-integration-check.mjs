import {existsSync,readFileSync} from 'node:fs';
const required=[
 'src/extractor.ts',
 'modules/ai-fashion-model/src/types.ts',
 'modules/ai-fashion-model/src/tryon.ts',
 'modules/variant-colour-intelligence/analyzer.ts',
 'modules/content-intelligence/generator.ts',
 'modules/carousel-generator/generator.ts',
 'modules/carousel-generator/templates.md'
];
const missing=required.filter(p=>!existsSync(p));
if(missing.length){console.error('Missing integration files:',missing);process.exit(1)}
const carousel=readFileSync('modules/carousel-generator/generator.ts','utf8');
if(!/1080/.test(carousel)||!/1350/.test(carousel)) {console.error('Carousel dimension contract missing');process.exit(1)}
const content=readFileSync('modules/content-intelligence/generator.ts','utf8');
if(!/ContentPackage/.test(content)){console.error('Content contract missing');process.exit(1)}
console.log('RPD Day 1 integration contract: PASS');
