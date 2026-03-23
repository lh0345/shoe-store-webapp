/**
 * JSON-LD Product schema for SEO (extracted from ProductView).
 */
export function generateProductSchemaMarkup(shoe) {
  if (!shoe) return '';

  const priceStr = shoe.priceMKD || '0';
  const price = parseInt(priceStr.replace(/[^0-9]/g, ''), 10) || 0;

  const allImages = [];
  shoe.availableColors.forEach((color) => {
    const colorImages = shoe.getImagesForColor(color);
    allImages.push(...colorImages);
  });

  const uniqueImages = [...new Set(allImages)];

  const schema = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: shoe.name,
    image: uniqueImages.length > 0 ? uniqueImages : [shoe.thumbnail()],
    description: shoe.description,
    brand: {
      '@type': 'Brand',
      name: shoe.brand || 'BRAND_NAME',
    },
    offers: {
      '@type': 'Offer',
      url: window.location.href,
      priceCurrency: 'MKD',
      price: price,
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'BRAND_NAME',
      },
    },
  };

  if (shoe.oldPriceMKD) {
    schema.offers.priceValidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
  }

  if (window.socialService) {
    try {
      const views = window.socialService.getViews(shoe.id);
      if (views > 10) {
        const ratingValue = 4 + Math.min(views / 100, 1);
        schema.aggregateRating = {
          '@type': 'AggregateRating',
          ratingValue: ratingValue.toFixed(1),
          reviewCount: Math.floor(views / 3),
          bestRating: '5',
          worstRating: '1',
        };
      }
    } catch (error) {
      console.error('Failed to get views for rating:', error);
    }
  }

  if (shoe.type) {
    schema.category = shoe.type;
  }

  if (shoe.material) {
    schema.material = shoe.material;
  }

  if (shoe.availableColors && shoe.availableColors.length > 0) {
    schema.color = shoe.availableColors.map((c) => c);
  }

  if (shoe.availableSizes && shoe.availableSizes.length > 0) {
    schema.size = shoe.availableSizes;
  }

  schema.sku = `SHOE-${shoe.id}`;
  schema.productID = String(shoe.id);

  return `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`;
}
