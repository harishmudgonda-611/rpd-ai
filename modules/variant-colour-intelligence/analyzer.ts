import type{VariantInput,ColorEvidence,RPDVariant,VariantAnalysis}from'./types.js';

const A:Record<string,string>={blk:'black',wht:'white',wine:'maroon',burgundy:'maroon',grey:'grey',gray:'grey',navy:'navy blue'};

const clean=(x:unknown)=>typeof x==='string'?x.replace(/\s+/g,' ').trim():'';

const FASHION_COLORS = [
  'black', 'white', 'pink', 'red', 'blue', 'green', 'yellow', 'purple', 'lavender',
  'maroon', 'beige', 'olive', 'charcoal', 'coral', 'teal', 'gold', 'silver',
  'indigo', 'cyan', 'orange', 'turquoise', 'peach', 'magenta', 'mint', 'navy',
  'grey', 'gray', 'brown', 'rust', 'mustard', 'fuchsia', 'burgundy', 'wine', 'cream'
];

export function inferColorFromText(text: string): ColorEvidence | null {
  if (!text) return null;
  const cleanText = text.toLowerCase();
  for (const color of FASHION_COLORS) {
    const regex = new RegExp(`\\b${color}\\b`, 'i');
    if (regex.test(cleanText)) {
      const normalized = normalizeColorName(color);
      return {
        name: color.charAt(0).toUpperCase() + color.slice(1),
        normalizedName: normalized || color,
        confidence: 0.85,
        source: 'inferred',
      };
    }
  }
  return null;
}

export function isTechnicalColorValue(value: string): boolean {
  if (!value) return true;
  const v = value.trim();

  // HEX colors (#ee5f73, #fff, #12345678)
  if (/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v)) return true;

  // RGB/RGBA, HSL/HSLA
  if (/^(rgb|rgba|hsl|hsla)\s*\(/i.test(v)) return true;

  // CSS variables (var(--...))
  if (/^var\s*\(/i.test(v)) return true;

  // CSS declarations / key-value / color property syntax
  if (/\b(color|background|fill|stroke)\s*:/i.test(v) || v.includes(';')) return true;

  // Generic technical or numeric hex without hash (e.g. 0xffffff, 0x000)
  if (/^0x[0-9a-f]+/i.test(v)) return true;

  return false;
}

export const normalizeColorName=(x:string)=>{
  const v=clean(x).toLowerCase();
  if (isTechnicalColorValue(x)) return '';
  return A[v]??v;
};

export function analyzeVariants(inputs:VariantInput[]=[],explicitColors:string[]=[]):VariantAnalysis{
  const variants:RPDVariant[]=[];
  const seen=new Set<string>();
  const add=(x:VariantInput)=>{
    const c=clean(x.color);
    if (isTechnicalColorValue(c)) return;
    const n=normalizeColorName(c);
    const key=[n,clean(x.size),clean(x.sku),clean(x.image)].join('|');
    if(seen.has(key))return;
    seen.add(key);
    variants.push({
      variantId:`variant-${variants.length+1}`,
      name:clean(x.name)||[c,clean(x.size)].filter(Boolean).join(' / ')||`Variant ${variants.length+1}`,
      color:n?{name:c,normalizedName:n,confidence:.98,source:'explicit-product-data'}:null,
      size:clean(x.size)||null,
      sku:clean(x.sku)||null,
      url:clean(x.url)||null,
      image:clean(x.image)||null,
      source:'explicit-product-data',
      confidence:.98
    });
  };
  inputs.forEach(add);
  explicitColors.forEach(c=>{
    if (isTechnicalColorValue(c)) return;
    if(!variants.some(v=>v.color?.normalizedName===normalizeColorName(c)))add({name:c,color:c});
  });
  const colors:ColorEvidence[]=[];
  variants.forEach(v=>{if(v.color&&!colors.some(c=>c.normalizedName===v.color!.normalizedName))colors.push(v.color)});
  return{
    variants,
    colors,
    uniqueColorCount:colors.length,
    warnings:variants.length?[]:['No explicit product variants or colours supplied'],
    method:'explicit-product-data+normalization+deduplication'
  };
}
