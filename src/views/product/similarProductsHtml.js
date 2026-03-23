import { escapeHtml } from '../../utils/helpers.js';

export function getSimilarProducts(catalog, shoe) {
  const allProducts = catalog.all().filter((p) => p.id !== shoe.id);

  const scored = allProducts.map((product) => {
    let score = 0;

    if (product.type === shoe.type) score += 3;
    if (product.brand && product.brand === shoe.brand) score += 2;
    if (product.gender && product.gender === shoe.gender) score += 1;

    const matchingTags = product.tags.filter((tag) => shoe.tags.includes(tag));
    score += matchingTags.length;

    return { product, score };
  });

  scored.sort((a, b) => {
    if (b.score === a.score) return Math.random() - 0.5;
    return b.score - a.score;
  });

  return scored.slice(0, 4).map((item) => item.product);
}

export function createSimilarCard(item) {
  const currencyService = window.currencyService;
  const displayPrice = currencyService
    ? currencyService.formatPrice(item.priceMKD, item.priceEUR)
    : item.priceMKD;

  const discount = item.getDiscountPercentage();
  const saleBadge = discount ? `<div class="sale-badge">-${discount}%</div>` : '';
  const brandTag = item.brand ? `<span class="card-brand">${escapeHtml(item.brand)}</span>` : '';

  return `
      <article class="card similar-card" data-slug="${escapeHtml(item.slug)}">
        <div class="card-img">
          ${saleBadge}
          <img src="${escapeHtml(item.thumbnail())}" alt="${escapeHtml(item.name)}" loading="lazy" />
          <button class="wishlist-btn" data-id="${escapeHtml(String(item.id))}" title="Add to wishlist" aria-label="Add to wishlist">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
        </div>
        <div class="card-body">
          ${brandTag}
          <h4 class="card-title">${escapeHtml(item.name)}</h4>
          <div class="card-price" data-mkd="${escapeHtml(item.priceMKD || '')}" data-eur="${escapeHtml(item.priceEUR || '')}">${displayPrice}</div>
        </div>
      </article>
    `;
}

export function getSimilarItemsHTML(catalog, shoe) {
  const similar = getSimilarProducts(catalog, shoe);

  if (similar.length === 0) return '';

  return `
      <section class="similar-items">
        <h3 class="similar-items-title">Similar Products</h3>
        <div class="similar-items-grid" id="similar-items-grid">
          ${similar.map((item) => createSimilarCard(item)).join('')}
        </div>
      </section>
    `;
}
