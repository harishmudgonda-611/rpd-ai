import type {ContentAngle,ContentPackage,ContentRequest,CTAType,CarouselSlideCopy} from './types.js';

const money=(p:number|null|undefined,c='INR')=>p==null?'':`${c==='INR'?'₹':c+' '}${Math.round(p).toLocaleString('en-IN')}`;
const clean=(s:string)=>s.replace(/\s+/g,' ').trim();
const title=(r:ContentRequest)=>clean(r.product.title);
const category=(r:ContentRequest)=>r.product.category||'fashion find';
const ctaText=(x:CTAType)=>({ 'shop-now':'Tap the link to shop','save-post':'Save this for your next shopping trip','share':'Share this with your fashion bestie','comment':'Comment “LINK” for the product','whatsapp':'Join WhatsApp for the product link','link-in-bio':'Find it through the link in bio' }[x]);
const angleHook=(r:ContentRequest,angle:ContentAngle)=>{const t=title(r),p=money(r.product.price,r.product.currency||'INR');switch(angle){case'price':return p?`${p} and it looks this good? 👀`: `This ${t} is a budget-friendly find 👀`;case'style':return `A simple ${category(r)} that can instantly elevate your look ✨`;case'occasion':return `One ${category(r)}, so many occasions ✨`;case'value':return `A fashion find worth saving before it sells out 👀`;case'trend':return `This ${category(r)} deserves a spot in your wardrobe ✨`;case'problem-solution':return `Want an easy outfit upgrade without overspending?`;default:return `Wait till you see this ${category(r)} 👀`;}};
const alternatives=(r:ContentRequest)=>['This might be your next wardrobe favourite 👀',`Found a ${category(r)} worth checking out ✨`,`Budget-friendly fashion finds hit different 💖`].map(clean);
const hashtags=(r:ContentRequest)=>[category(r),...(r.product.colors||[]).slice(0,3),'fashion','fashionfinds','budgetfashion','indianfashion','shopping'].map(x=>'#'+x.toLowerCase().replace(/[^a-z0-9]+/g,'' )).filter((x,i,a)=>x.length>1&&a.indexOf(x)===i).slice(0,12);
const slide=(slide:number,role:CarouselSlideCopy['role'],headline:string,body?:string,emphasis?:string[]):CarouselSlideCopy=>({slide,role,headline:clean(headline),body:body?clean(body):undefined,emphasis});

export function generateContent(r:ContentRequest):ContentPackage{
 const angle=r.angle||'style', voice=r.brandVoice||'friendly', locale=r.locale||'en-IN', cta=r.cta||'shop-now', n=Math.min(8,Math.max(4,r.slideCount||6));
 const p=r.product, hook=angleHook(r,angle), slides:CarouselSlideCopy[]=[slide(1,'hook',hook),slide(2,'hero',title(r),[p.brand,p.description].filter(Boolean).join(' • ')||'A fresh fashion pick for your wardrobe')];
 if(n>=5)slides.push(slide(3,'benefits','Why you’ll like it', (p.features?.length?p.features.slice(0,3):['Easy to style','Made for everyday looks','A versatile wardrobe pick']).join(' • ')));
 if(n>=6&&p.colors?.length)slides.push(slide(4,'colors',`Available in ${p.colors.length} colour${p.colors.length===1?'':'s'}`,p.colors.slice(0,8).join(' • '),p.colors.slice(0,8)));
 if(n>=7)slides.push(slide(5,'details','Style it your way', (p.occasions?.length?p.occasions:['Casual days','Office looks','Weekend outings']).slice(0,3).join(' • ')));
 const priceText=p.price!=null?`Now ${money(p.price,p.currency||'INR')}`:'Check the current price';
 if(n>=8)slides.push(slide(6,'price',priceText,p.mrp&&p.price&&p.mrp>p.price?`${money(p.mrp,p.currency||'INR')} MRP • ${Math.round(((p.mrp-p.price)/p.mrp)*100)}% off`:undefined));
 slides.push(slide(n,'cta',ctaText(cta)));
 const caption=`${hook}\n\n${title(r)}${p.price!=null?` • ${money(p.price,p.currency||'INR')}`:''}\n\n${p.description?clean(p.description).slice(0,240):'A versatile fashion find to add to your wardrobe.'}\n\n${ctaText(cta)}.`;
 const warnings:string[]=[]; if(!p.price)warnings.push('Price unavailable; price claims were not invented.'); if(!p.colors?.length)warnings.push('Colour data unavailable; colour slide should be adapted by the carousel renderer.');
 return {hook,alternativeHooks:alternatives(r),carousel:slides.slice(0,n),caption,cta:ctaText(cta),hashtags:hashtags(r),keywords:[category(r),'fashion','budget fashion',...(p.colors||[]).slice(0,5)],metadata:{angle,voice,locale,generatedBy:'rpd-content-intelligence-v1'},warnings};
}

export type LLMProvider={name:string;generate:(system:string,user:string)=>Promise<string>};
export function buildStructuredPrompt(r:ContentRequest){return {system:'You are RPD Content Intelligence. Generate original fashion affiliate content. Never invent product facts, prices, colours, sizes, fabric or claims. Return ONLY JSON matching the supplied schema.',user:JSON.stringify(r)}};
