import { escapeHtml } from '../../../utils/helpers.js';
import { generateProductSchemaMarkup } from '../productSchemaMarkup.js';
import { getSimilarItemsHTML } from '../similarProductsHtml.js';

export function buildProductPageHtml({ catalog, shoe, currentColor, services }) {
  const images = shoe.getImagesForColor(currentColor);
  const mainImage = images[0] || shoe.thumbnail();

  // Generate JSON-LD structured data for SEO
  const schemaMarkup = generateProductSchemaMarkup(shoe);

  return `
      ${schemaMarkup}
      <section class="gallery">
        <div class="gallery-controls">
          <button class="btn-back" id="back-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back
          </button>
          <button class="wishlist-btn-product" id="wishlist-btn-product" data-id="${escapeHtml(String(shoe.id))}" title="Add to wishlist" aria-label="Add to wishlist">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
        </div>
        <div class="gallery-main" id="gallery-main">
          <button class="gallery-nav gallery-nav-prev" id="gallery-prev" aria-label="Previous image">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <img src="${escapeHtml(mainImage)}" alt="${escapeHtml(shoe.name)} image" id="main-img" loading="eager">
          <button class="gallery-nav gallery-nav-next" id="gallery-next" aria-label="Next image">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
          <div class="gallery-indicator" id="gallery-indicator">1 / ${images.length}</div>
        </div>
        <div class="thumb-row" id="thumb-row">
          ${images
            .map(
              (img, idx) => `
            <button class="thumb ${idx === 0 ? 'active' : ''}" data-index="${escapeHtml(String(idx))}">
              <img src="${escapeHtml(img)}" alt="${escapeHtml(shoe.name)} thumbnail ${idx + 1}" loading="lazy">
            </button>
          `
            )
            .join('')}
        </div>
        
        <div class="gallery-share">
          <span class="share-label">Share:</span>
          <button class="social-btn" id="share-whatsapp" title="Share on WhatsApp">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
          </button>
          <button class="social-btn" id="share-messenger" title="Share on Messenger">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.374 0 0 4.975 0 11.111c0 3.497 1.745 6.616 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.626 0 12-4.974 12-11.111C24 4.975 18.626 0 12 0zm1.193 14.963l-3.056-3.259-5.963 3.259L10.733 8.2l3.13 3.259L19.794 8.2l-6.601 6.763z"/>
            </svg>
          </button>
          <button class="social-btn" id="share-copy" title="Copy Link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
          </button>
        </div>
      </section>

      <aside class="details">
        <div class="product-header">
          ${shoe.brand ? `<div class="kicker">${escapeHtml(shoe.brand)}</div>` : ''}  
          <h2 class="product-title">${escapeHtml(shoe.name)}</h2>
          <button class="btn-admin-edit" id="admin-edit-btn" title="Edit Product" style="display:none;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Edit Product
          </button>
          <div class="product-price-section">
            ${
              shoe.oldPriceMKD
                ? `
              <div class="product-price-row">
                <div class="product-old-price" data-mkd="${escapeHtml(shoe.oldPriceMKD)}" data-eur="${escapeHtml(shoe.oldPriceEUR)}">${escapeHtml(services.currencyService ? services.currencyService.formatPrice(shoe.oldPriceMKD, shoe.oldPriceEUR) : shoe.oldPriceMKD)}</div>
                ${shoe.getDiscountPercentage() ? `<div class="product-sale-badge">🏷️ ${shoe.getDiscountPercentage()}% OFF</div>` : ''}
              </div>
            `
                : ''
            }
            <div class="product-meta" data-mkd="${escapeHtml(shoe.priceMKD)}" data-eur="${escapeHtml(shoe.priceEUR)}">${escapeHtml(services.currencyService ? services.currencyService.formatPrice(shoe.priceMKD, shoe.priceEUR) : shoe.priceMKD)}</div>
          </div>
        </div>

        ${
          shoe.availableSizes && shoe.availableSizes.length > 0
            ? `
          <div class="product-section">
            <div class="kicker">Available Sizes</div>
            <div class="size-list" id="size-list">
              ${shoe.availableSizes
                .map((size) => {
                  const isOutOfStock =
                    shoe.unavailableSizes && shoe.unavailableSizes.includes(size);
                  return `<button class="size-option ${isOutOfStock ? 'out-of-stock' : ''}" data-size="${escapeHtml(size)}" ${isOutOfStock ? 'disabled' : ''}>${escapeHtml(size)}${isOutOfStock ? '<span class="size-stock-badge">Out</span>' : ''}</button>`;
                })
                .join('')}
            </div>
          </div>
        `
            : ''
        }

        <div class="product-section">
          <div class="kicker">Colors</div>
          <div class="color-list" id="color-list"></div>
        </div>

        <div class="product-section">
          <div class="kicker">Description</div>
          <div class="product-desc-wrapper">
            <p class="product-desc" id="product-desc">${escapeHtml(shoe.description)}</p>
            <button class="read-more-btn" id="read-more-btn" style="display: none;">
              <span class="read-more-text">Read More</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>
        </div>

        ${
          shoe.tags.length > 0
            ? `
          <div class="product-section">
            <div class="kicker">Features</div>
            <div class="tag-list">
              ${shoe.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
            </div>
          </div>
        `
            : ''
        }

        <div class="cta-section">
          <button class="btn btn-primary btn-whatsapp" id="order-btn" style="flex: 2;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            Place Order
          </button>
          <button class="btn btn-secondary btn-whatsapp" id="contact-info-btn" style="flex: 1;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            Contact
          </button>
        </div>
      </aside>

      ${getSimilarItemsHTML(catalog, shoe)}
      
      <!-- Order Form Modal -->
      <div class="order-modal" id="order-modal" style="display:none;">
        <div class="order-modal-overlay" id="order-modal-overlay"></div>
        <div class="order-modal-content">
          <div class="order-modal-header">
            <h3>Complete Your Order</h3>
            <button class="order-modal-close" id="order-modal-close" aria-label="Close">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <form id="order-form" class="order-form">
            <div class="order-summary">
              <img src="${escapeHtml(shoe.thumbnail())}" alt="${escapeHtml(shoe.name)}" class="order-summary-img">
              <div class="order-summary-details">
                <h4>${escapeHtml(shoe.name)}</h4>
                ${shoe.brand ? `<p class="order-summary-brand">${escapeHtml(shoe.brand)}</p>` : ''}
                <p class="order-summary-price" data-mkd="${escapeHtml(shoe.priceMKD)}" data-eur="${escapeHtml(shoe.priceEUR)}">${escapeHtml(services.currencyService ? services.currencyService.formatPrice(shoe.priceMKD, shoe.priceEUR) : shoe.priceMKD)}</p>
                <div class="order-summary-selected" id="order-summary-selected"></div>
              </div>
            </div>
            
            <div class="form-group">
              <label for="order-name">Full Name *</label>
              <input type="text" id="order-name" name="name" placeholder="Enter your full name" pattern="[A-Za-zÀ-ÿ ]+" title="Name should only contain letters and spaces" required>
            </div>
            
            <div class="form-group">
              <label for="order-phone">Phone Number *</label>
              <div class="phone-input-group">
                <select id="order-phone-country" name="phoneCountry" class="country-select" required>
                  <option value="+389" data-flag="🇲🇰" selected>🇲🇰 +389</option>
                  <option value="+383" data-flag="🇽🇰">🇽🇰 +383</option>
                  <option value="+381" data-flag="🇷🇸">🇷🇸 +381</option>
                </select>
                <input type="tel" id="order-phone" name="phone" placeholder="70 123 456" pattern="[0-9 ]{7,15}" title="Phone should only contain numbers and spaces" inputmode="numeric" required>
              </div>
            </div>
            
            <div class="form-group">
              <label for="order-address">Delivery Address *</label>
              <input type="text" id="order-address" name="address" placeholder="Street address" pattern="[a-zA-ZÀ-ÿ0-9 ., #/-]+" title="Address should not contain special symbols" required>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="order-country">Country *</label>
                <select id="order-country" name="country" class="country-select-full" required>
                  <option value="North Macedonia" data-flag="🇲🇰" selected>🇲🇰 North Macedonia</option>
                  <option value="Kosovo" data-flag="🇽🇰">🇽🇰 Kosovo</option>
                  <option value="Serbia" data-flag="🇷🇸">🇷🇸 Serbia</option>
                </select>
              </div>
              <div class="form-group">
                <label for="order-city">City *</label>
                <input type="text" id="order-city" name="city" placeholder="City" pattern="[A-Za-zÀ-ÿ ]+" title="City should only contain letters and spaces" required>
              </div>
            </div>
            
            <div class="form-group">
              <label for="order-postal">Postal Code</label>
              <input type="text" id="order-postal" name="postal" placeholder="1000" pattern="[0-9]*" title="Postal code should only contain numbers" inputmode="numeric">
            </div>
            
            <div class="form-group">
              <label for="order-notes">Additional Notes</label>
              <textarea id="order-notes" name="notes" rows="3" placeholder="Special delivery instructions, questions, etc."></textarea>
            </div>
            
            <div class="order-form-actions">
              <button type="button" class="btn btn-secondary" id="order-cancel">Cancel</button>
              <button type="submit" class="btn btn-primary btn-whatsapp">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                Send Order via WhatsApp
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
}
