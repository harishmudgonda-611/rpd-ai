export function renderPriceBadge(price: string, mrp?: string | null, discount?: string | null): string {
  const discountHtml = discount ? `<span class="badge-discount">${discount}% OFF</span>` : '';
  const mrpHtml = mrp ? `<span class="badge-mrp">₹${mrp}</span>` : '';
  return `<div class="rpd-price-badge"><span class="badge-price">${price}</span>${mrpHtml}${discountHtml}</div>`;
}

export function renderCtaButton(label = 'SHOP NOW', linkUrl?: string | null): string {
  const urlAttr = linkUrl ? ` data-affiliate-url="${linkUrl}"` : '';
  return `<a class="rpd-cta-button"${urlAttr}>${label} &rarr;</a>`;
}
