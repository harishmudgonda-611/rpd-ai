export interface DmResponsePackage {
  commentText: string;
  matchedProductId: string | null;
  productName: string | null;
  affiliateUrl: string | null;
  dmResponseText: string;
  isAmbiguous: boolean;
}

export function generateDmResponsePackage(
  commentText: string,
  products: Array<{ productId: string; title: string; affiliateUrl: string; aliases?: string[] }>,
): DmResponsePackage {
  const text = commentText.toLowerCase().trim();

  for (const product of products) {
    const titleMatch = product.title && text.includes(product.title.toLowerCase());
    const aliasMatch = product.aliases?.some(alias => text.includes(alias.toLowerCase()));

    if (titleMatch || aliasMatch) {
      return {
        commentText,
        matchedProductId: product.productId,
        productName: product.title,
        affiliateUrl: product.affiliateUrl,
        dmResponseText: `Hey! Here is the link for ${product.title}: ${product.affiliateUrl}`,
        isAmbiguous: false,
      };
    }
  }

  // Fallback for general comments like "link please" or "price?"
  const primaryProduct = products[0] || null;
  return {
    commentText,
    matchedProductId: primaryProduct?.productId || null,
    productName: primaryProduct?.title || null,
    affiliateUrl: primaryProduct?.affiliateUrl || null,
    dmResponseText: primaryProduct
      ? `Hey! Here is the link for our featured item (${primaryProduct.title}): ${primaryProduct.affiliateUrl}`
      : 'Hey! Send us a message with the product name and we will share the direct link!',
    isAmbiguous: products.length > 1,
  };
}
