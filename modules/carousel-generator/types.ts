export type CarouselTemplateId = 'rpd-editorial'|'rpd-pink-deal'|'rpd-minimal'|'rpd-lookbook'|'rpd-colour-grid';
export type SlideRole = 'hook'|'hero'|'benefits'|'colours'|'details'|'price'|'cta';
export type CarouselAsset = { type:'image'|'text'; src?:string; text?:string; alt?:string };
export type CarouselSlide = { index:number; role:SlideRole; background:string; assets:CarouselAsset[] };
export type CarouselDocument = { id:string; width:1080; height:1350; template:CarouselTemplateId; slides:CarouselSlide[]; sourceProductUrl?:string|null; generatedAt:string; exportTargets:string[] };
export type CarouselInput = { productTitle:string; price?:string|null; mrp?:string|null; discount?:string|null; colours?:string[]; modelImage?:string|null; productImages?:string[]; content:{hook:string; caption?:string; slides:Array<{role:SlideRole;headline:string;body?:string;emphasis?:string[]}>}; template?:CarouselTemplateId; sourceProductUrl?:string|null };
