/* ProductView.js - Product detail page rendering */
import { escapeHtml, getColorName } from '../../utils/helpers.js';
import { buildProductPageHtml } from './templates/productPageTemplate.js';

export class ProductView {
  constructor(catalog, phone, services) {
    this.catalog = catalog;
    this.phone = phone;
    this.services = services;
    this.currentColor = null;
    this.selectedSize = null;
    this.shoe = null;
  }

  render(id) {
    try {
      this.shoe = this.catalog.findById(id);
      if (!this.shoe) {
        return this.renderNotFound();
      }

      // Track product view
      if (this.services.socialService) {
        try {
          this.services.socialService.trackView(id);
        } catch (error) {
          console.error('Failed to track view:', error);
        }
      }

      this.currentColor = this.shoe.availableColors[0] || Object.keys(this.shoe.images)[0];

      const product = document.createElement('div');
      product.className = 'product';
      product.innerHTML = this.getProductHTML();

      this.attachEventHandlers(product);
      return product;
    } catch (error) {
      console.error('Error rendering product:', error);
      if (window.showErrorNotification) {
        window.showErrorNotification('Failed to load product details.');
      }
      return this.renderError();
    }
  }

  getProductHTML() {
    return buildProductPageHtml({
      catalog: this.catalog,
      shoe: this.shoe,
      currentColor: this.currentColor,
      services: this.services,
    });
  }

  attachEventHandlers(product) {
    // Ensure product element exists
    if (!product) return;

    const colorList = product.querySelector('#color-list');
    const thumbRow = product.querySelector('#thumb-row');
    const mainImg = product.querySelector('#main-img');
    const backBtn = product.querySelector('#back-btn');
    const contactInfoBtn = product.querySelector('#contact-info-btn');
    const orderBtn = product.querySelector('#order-btn');
    const wishlistBtn = product.querySelector('#wishlist-btn-product');
    const adminEditBtn = product.querySelector('#admin-edit-btn');

    // Social share buttons
    const shareWhatsApp = product.querySelector('#share-whatsapp');
    const shareMessenger = product.querySelector('#share-messenger');
    const shareInstagram = product.querySelector('#share-instagram');
    const shareViber = product.querySelector('#share-viber');
    const shareCopy = product.querySelector('#share-copy');

    // Admin edit button handler
    if (adminEditBtn) {
      // Show button if admin is authenticated
      if (this.services.authService && this.services.authService.isAuthenticated()) {
        adminEditBtn.style.display = 'inline-flex';
        adminEditBtn.addEventListener('click', (e) => {
          e.preventDefault();
          // Store edit product ID in sessionStorage for AdminView to pick up
          sessionStorage.setItem('editProductId', this.shoe.id);
          // Navigate to admin page
          window.history.pushState({}, '', '/admin');
          window.dispatchEvent(new PopStateEvent('popstate'));
        });
      }
    }

    // Render components with safety checks
    if (colorList) this.renderSwatches(colorList);
    if (thumbRow && mainImg) this.renderThumbs(thumbRow);

    // Import services from app context
    const wishlistService = this.services.wishlistService;
    const socialService = this.services.socialService;

    // Set initial wishlist state
    if (wishlistBtn && wishlistService) {
      if (wishlistService.isInWishlist(this.shoe.id)) {
        wishlistBtn.classList.add('active');
      }

      // Wishlist button handler
      wishlistBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        wishlistService.toggle(this.shoe.id);
        wishlistBtn.classList.toggle('active');

        // Update wishlist badge
        if (window.app && window.app.updateWishlistBadge) {
          window.app.updateWishlistBadge();
        }
      });
    }

    // Social share handlers
    if (socialService) {
      if (shareWhatsApp) {
        shareWhatsApp.addEventListener('click', async (e) => {
          e.preventDefault();
          const url = `${window.location.origin}/product/${this.shoe.slug}`;
          const message = `Check out this product!\n\n${this.shoe.name}\n${this.shoe.priceMKD || this.shoe.price}\n\n${url}`;

          // Use native share if available (works on mobile)
          if (navigator.share) {
            try {
              await navigator.share({
                title: this.shoe.name,
                text: message,
                url: url,
              });
            } catch (err) {
              // User cancelled or error - fallback to WhatsApp web
              if (err.name !== 'AbortError') {
                window.open(
                  `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`,
                  '_blank'
                );
              }
            }
          } else {
            // Fallback: Open WhatsApp web without phone number (user can choose contact)
            window.open(
              `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`,
              '_blank'
            );
          }
        });
      }

      if (shareMessenger) {
        shareMessenger.addEventListener('click', (e) => {
          e.preventDefault();
          socialService.shareOnMessenger(this.shoe);
        });
      }

      if (shareInstagram) {
        shareInstagram.addEventListener('click', (e) => {
          e.preventDefault();
          socialService.shareOnInstagram(this.shoe);
        });
      }

      if (shareViber) {
        shareViber.addEventListener('click', (e) => {
          e.preventDefault();
          socialService.shareOnViber(this.shoe);
        });
      }

      if (shareCopy) {
        shareCopy.addEventListener('click', async (e) => {
          e.preventDefault();
          const result = await socialService.copyLink(this.shoe);
          // Show temporary feedback
          const originalHTML = shareCopy.innerHTML;
          if (result.success) {
            shareCopy.innerHTML =
              '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';
            setTimeout(() => {
              shareCopy.innerHTML = originalHTML;
            }, 2000);
          }
        });
      }
    }

    // Initialize description toggle
    this.initDescriptionToggle(product);

    // Contact for Info button - sends basic product info
    if (contactInfoBtn) {
      contactInfoBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.sendProductInfo();
      });
    }

    // Place Order button - opens order form modal
    if (orderBtn) {
      orderBtn.addEventListener('click', (e) => {
        e.preventDefault();

        // Check if size is required and selected
        const sizeList = product.querySelector('#size-list');
        if (sizeList && this.shoe.availableSizes && this.shoe.availableSizes.length > 0) {
          if (!this.selectedSize) {
            if (this.services.toastService) {
              this.services.toastService.warning('Please select a size before placing an order.');
            }
            // Scroll to size section
            sizeList.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
          }
        }

        // Check if color is required and selected
        const colorList = product.querySelector('#color-list');
        if (colorList && this.shoe.colors && this.shoe.colors.length > 0) {
          if (!this.currentColor) {
            if (window.toastService) {
              window.toastService.warning('Please select a color before placing an order.');
            }
            // Scroll to color section
            colorList.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
          }
        }

        this.openOrderModal(product);
      });
    }

    // Order form modal handlers
    this.attachOrderFormHandlers(product);

    // Size selection
    const sizeList = product.querySelector('#size-list');
    if (sizeList) {
      sizeList.addEventListener('click', (e) => {
        const sizeBtn = e.target.closest('.size-option');
        if (!sizeBtn) return;

        // Don't allow selection of out of stock sizes
        if (sizeBtn.disabled || sizeBtn.classList.contains('out-of-stock')) {
          return;
        }

        const size = sizeBtn.dataset.size;

        // Update selected size
        this.selectedSize = size;

        // Update UI
        sizeList
          .querySelectorAll('.size-option')
          .forEach((btn) => btn.classList.remove('selected'));
        sizeBtn.classList.add('selected');
      });
    }

    if (colorList) {
      colorList.addEventListener('click', (e) => {
        const sw = e.target.closest('.swatch');
        if (!sw) return;
        const color = sw.dataset.color;
        this.setSelectedColor(color, colorList, mainImg, thumbRow);
      });
    }

    // Thumbnail navigation
    if (thumbRow) {
      thumbRow.addEventListener('click', (e) => {
        const thumb = e.target.closest('.thumb');
        if (!thumb) return;
        const index = parseInt(thumb.dataset.index);
        this.setGalleryImage(index, product);
      });
    }

    // Gallery navigation buttons
    const prevBtn = product.querySelector('#gallery-prev');
    const nextBtn = product.querySelector('#gallery-next');

    if (prevBtn && nextBtn) {
      prevBtn.addEventListener('click', () => {
        const currentIndex = this.getCurrentImageIndex(product);
        const images = this.shoe.getImagesForColor(this.currentColor);
        const newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
        this.setGalleryImage(newIndex, product);
      });

      nextBtn.addEventListener('click', () => {
        const currentIndex = this.getCurrentImageIndex(product);
        const images = this.shoe.getImagesForColor(this.currentColor);
        const newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
        this.setGalleryImage(newIndex, product);
      });
    }

    // Keyboard navigation for gallery
    const handleKeyboard = (e) => {
      if (e.key === 'ArrowLeft') {
        prevBtn?.click();
      } else if (e.key === 'ArrowRight') {
        nextBtn?.click();
      }
    };
    document.addEventListener('keydown', handleKeyboard);

    // Cleanup on navigation away
    const cleanup = () => {
      document.removeEventListener('keydown', handleKeyboard);
    };
    window.addEventListener('popstate', cleanup, { once: true });

    // Image zoom functionality
    if (mainImg) {
      mainImg.style.cursor = 'zoom-in';

      // Add loaded class when image loads
      if (mainImg.complete) {
        mainImg.classList.add('loaded');
      } else {
        mainImg.addEventListener(
          'load',
          () => {
            mainImg.classList.add('loaded');
          },
          { once: true }
        );
      }

      mainImg.addEventListener('click', () => {
        this.openImageZoom(mainImg.src);
      });
    }

    if (backBtn) {
      backBtn.addEventListener('click', () => {
        window.history.back();
      });
    }

    // Attach image load handlers to similar product cards
    const similarCards = product.querySelectorAll('.similar-card img');
    similarCards.forEach((img) => {
      if (img.complete) {
        img.classList.add('loaded');
      } else {
        img.addEventListener(
          'load',
          () => {
            img.classList.add('loaded');
          },
          { once: true }
        );
        img.addEventListener(
          'error',
          () => {
            img.classList.add('loaded');
          },
          { once: true }
        );
      }
    });
  }

  getCurrentImageIndex(product) {
    const thumbRow = product.querySelector('#thumb-row');
    const activeThumb = thumbRow?.querySelector('.thumb.active');
    return activeThumb ? parseInt(activeThumb.dataset.index) : 0;
  }

  setGalleryImage(index, product) {
    const images = this.shoe.getImagesForColor(this.currentColor);
    const mainImg = product.querySelector('#main-img');
    const thumbRow = product.querySelector('#thumb-row');
    const indicator = product.querySelector('#gallery-indicator');

    if (!mainImg || index < 0 || index >= images.length) return;

    // Remove loaded class before changing image
    mainImg.classList.remove('loaded');

    // Update main image
    mainImg.src = images[index];

    // Add loaded class when new image loads
    if (mainImg.complete) {
      mainImg.classList.add('loaded');
    } else {
      mainImg.addEventListener(
        'load',
        () => {
          mainImg.classList.add('loaded');
        },
        { once: true }
      );
    }

    // Update thumbnails
    if (thumbRow) {
      thumbRow.querySelectorAll('.thumb').forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
      });
    }

    // Update indicator
    if (indicator) {
      indicator.textContent = `${index + 1} / ${images.length}`;
    }
  }

  openImageZoom(imageSrc) {
    // Create zoom overlay
    const overlay = document.createElement('div');
    overlay.className = 'image-zoom-overlay';
    overlay.innerHTML = `
      <div class="image-zoom-container">
        <button class="image-zoom-close" aria-label="Close">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <img src="${imageSrc}" alt="Zoomed image" class="image-zoom-img">
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    // Close handlers
    const closeZoom = () => {
      overlay.classList.add('closing');
      setTimeout(() => {
        document.body.removeChild(overlay);
        document.body.style.overflow = '';
      }, 200);
    };

    overlay.querySelector('.image-zoom-close').addEventListener('click', closeZoom);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeZoom();
    });

    // ESC key to close
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        closeZoom();
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);

    // Animate in
    requestAnimationFrame(() => {
      overlay.classList.add('active');
    });
  }

  setSelectedColor(color, colorList, mainImg, thumbRow) {
    if (!this.shoe.hasColor(color)) return;
    this.currentColor = color;

    const imgs = this.shoe.getImagesForColor(color);
    mainImg.src = imgs[0];

    // Update thumbnails with new images
    this.renderThumbs(thumbRow);

    // Update gallery indicator
    const product = mainImg.closest('.product');
    const indicator = product?.querySelector('#gallery-indicator');
    if (indicator) {
      indicator.textContent = `1 / ${imgs.length}`;
    }

    Array.from(colorList.children).forEach((el) => {
      el.classList.toggle('selected', el.dataset.color === color);
    });
  }

  renderSwatches(container) {
    container.innerHTML = '';
    this.shoe.availableColors.forEach((color) => {
      const sw = document.createElement('button');
      sw.className = 'swatch';
      sw.title = getColorName(color);
      sw.dataset.color = color;
      sw.style.background = color;
      if (color === this.currentColor) sw.classList.add('selected');
      container.appendChild(sw);
    });
  }

  renderThumbs(container) {
    if (!container) return;

    container.innerHTML = '';
    const imgs = this.shoe.getImagesForColor(this.currentColor);

    if (!imgs || imgs.length === 0) {
      console.warn(`No images found for color ${this.currentColor}`);
      return;
    }

    imgs.forEach((src, idx) => {
      const thumb = document.createElement('button');
      thumb.className = 'thumb';
      thumb.dataset.index = idx;
      if (idx === 0) thumb.classList.add('active');
      thumb.innerHTML = `<img src="${src}" alt="${escapeHtml(this.shoe.name)} view ${idx + 1}" loading="lazy">`;
      container.appendChild(thumb);
    });
  }

  sendProductInfo() {
    // Get WhatsApp number from store config
    const whatsappNumber = window.storeConfig?.whatsappNumber || '38970123456';

    // Build product info message
    const productUrl = `${window.location.origin}/product/${this.shoe.slug}`;
    let message = `👋 Hi! I'd like to know more about this product:\n\n`;

    // Product details
    message += `📦 Product: ${this.shoe.name}\n`;
    if (this.shoe.brand) {
      message += `🏷️ Brand: ${this.shoe.brand}\n`;
    }

    // Selected options
    if (this.selectedSize) {
      message += `📏 Size: ${this.selectedSize}\n`;
    }
    if (this.currentColor) {
      message += `🎨 Color: ${getColorName(this.currentColor)}\n`;
    }

    message += `\n🔗 Product Link: ${productUrl}`;

    // URL encode and open WhatsApp
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  }

  openOrderModal(product) {
    const modal = product.querySelector('#order-modal');
    const summarySelected = product.querySelector('#order-summary-selected');

    if (!modal) return;

    // Update summary with selected options
    let selectedInfo = '';
    if (this.selectedSize) {
      selectedInfo += `<span class="order-tag">Size: ${escapeHtml(this.selectedSize)}</span>`;
    }
    if (this.currentColor) {
      selectedInfo += `<span class="order-tag">Color: ${getColorName(this.currentColor)}</span>`;
    }

    if (summarySelected) {
      summarySelected.innerHTML = selectedInfo;
    }

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Focus first input
    setTimeout(() => {
      const firstInput = modal.querySelector('#order-name');
      if (firstInput) firstInput.focus();
    }, 100);
  }

  closeOrderModal(product) {
    const modal = product.querySelector('#order-modal');
    if (!modal) return;

    modal.style.display = 'none';
    document.body.style.overflow = '';
  }

  attachOrderFormHandlers(product) {
    const modal = product.querySelector('#order-modal');
    if (!modal) return;

    const closeBtn = modal.querySelector('#order-modal-close');
    const cancelBtn = modal.querySelector('#order-cancel');
    const overlay = modal.querySelector('#order-modal-overlay');
    const form = modal.querySelector('#order-form');

    // Close handlers
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeOrderModal(product));
    }
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.closeOrderModal(product));
    }
    if (overlay) {
      overlay.addEventListener('click', () => this.closeOrderModal(product));
    }

    // ESC key to close
    const handleEsc = (e) => {
      if (e.key === 'Escape' && modal.style.display === 'flex') {
        this.closeOrderModal(product);
      }
    };
    document.addEventListener('keydown', handleEsc);

    // Attach real-time validation to order form inputs
    if (window.inputValidation) {
      const nameInput = form.querySelector('#order-name');
      const phoneInput = form.querySelector('#order-phone');
      const addressInput = form.querySelector('#order-address');
      const cityInput = form.querySelector('#order-city');
      const postalInput = form.querySelector('#order-postal');
      const countryInput = form.querySelector('#order-country');
      const notesInput = form.querySelector('#order-notes');

      // Attach validation to each input
      if (nameInput) {
        window.inputValidation.attachFieldValidation(
          nameInput,
          window.inputValidation.validationRules.order.name
        );
      }
      if (phoneInput) {
        window.inputValidation.attachFieldValidation(
          phoneInput,
          window.inputValidation.validationRules.order.phone
        );
      }
      if (addressInput) {
        window.inputValidation.attachFieldValidation(
          addressInput,
          window.inputValidation.validationRules.order.address
        );
      }
      if (cityInput) {
        window.inputValidation.attachFieldValidation(
          cityInput,
          window.inputValidation.validationRules.order.city
        );
      }
      if (postalInput) {
        window.inputValidation.attachFieldValidation(
          postalInput,
          window.inputValidation.validationRules.order.postal
        );
      }
      if (countryInput) {
        window.inputValidation.attachFieldValidation(
          countryInput,
          window.inputValidation.validationRules.order.city
        ); // Reuse city rules for country
      }
      if (notesInput) {
        window.inputValidation.attachFieldValidation(
          notesInput,
          window.inputValidation.validationRules.order.notes
        );
      }
    }

    // Form submission
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleOrderSubmit(product, form);
      });
    }
  }

  handleOrderSubmit(product, form) {
    // Get form values
    const formData = new FormData(form);
    const orderData = {
      name: formData.get('name').trim(),
      phoneCountry: formData.get('phoneCountry').trim(),
      phone: formData.get('phone').trim(),
      address: formData.get('address').trim(),
      country: formData.get('country').trim(),
      city: formData.get('city').trim(),
      postal: formData.get('postal').trim(),
      notes: formData.get('notes').trim(),
    };

    // Use InputValidation utility for comprehensive validation
    const validation = window.inputValidation.validateAndSanitizeForm(orderData, 'order');

    if (!validation.isValid) {
      // Show validation errors
      Object.entries(validation.errors).forEach(([fieldName, errors]) => {
        const input = form.querySelector(`[name="${fieldName}"]`);
        if (input) {
          input.classList.add('error');
          const errorEl = document.createElement('div');
          errorEl.className = 'form-error';
          errorEl.textContent = errors.join(', ');
          input.parentNode.appendChild(errorEl);
        }
      });

      if (window.toastService) {
        window.toastService.error(
          `Please fix the validation errors: ${Object.values(validation.errors).flat().join(', ')}`,
          6000
        );
      }

      // Scroll to first error
      const firstError = form.querySelector('.error');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Use sanitized data
    const sanitizedData = validation.sanitizedData;

    // Check if size is selected and in stock
    if (this.selectedSize) {
      const isOutOfStock =
        this.shoe.unavailableSizes && this.shoe.unavailableSizes.includes(this.selectedSize);
      if (isOutOfStock) {
        if (window.toastService) {
          window.toastService.error(
            `Sorry, size ${this.selectedSize} is currently out of stock. Please select another size.`
          );
        }
        return;
      }
    }

    // Format full phone number
    const fullPhone = `${sanitizedData.phoneCountry} ${sanitizedData.phone}`;

    // Build WhatsApp message with customer details
    const productUrl = `${window.location.origin}/product/${this.shoe.slug}`;
    let message = `🛍️ NEW ORDER\n`;
    message += `━━━━━━━━━━━━━━━━\n\n`;

    // Customer Details
    message += `👤 CUSTOMER DETAILS:\n`;
    message += `Name: ${sanitizedData.name}\n`;
    message += `Phone: ${fullPhone}\n`;
    message += `Address: ${sanitizedData.address}\n`;
    message += `City: ${sanitizedData.city}, ${sanitizedData.country}`;
    if (sanitizedData.postal) message += ` - ${sanitizedData.postal}`;
    message += `\n\n`;

    // Product Details
    message += `📦 PRODUCT:\n`;
    message += `${this.shoe.name}\n`;
    if (this.shoe.brand) {
      message += `Brand: ${this.shoe.brand}\n`;
    }
    const displayPrice = window.currencyService
      ? window.currencyService.formatPrice(this.shoe.priceMKD, this.shoe.priceEUR)
      : this.shoe.priceMKD;
    message += `Price: ${displayPrice}\n`;
    if (this.selectedSize) {
      message += `Size: ${this.selectedSize}\n`;
    }
    if (this.currentColor) {
      message += `Color: ${getColorName(this.currentColor)}\n`;
    }
    message += `\n`;

    // Additional notes
    if (sanitizedData.notes) {
      message += `📝 NOTES:\n${sanitizedData.notes}\n\n`;
    }

    // Product link
    message += `🔗 Product Link:\n${productUrl}`;

    // Open WhatsApp
    const whatsappUrl = `https://wa.me/${this.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    // Close modal and reset form
    this.closeOrderModal(product);
    form.reset();

    // Show success message
    if (window.toastService) {
      window.toastService.success("Order sent! We'll contact you shortly via WhatsApp.");
    }
  }

  renderNotFound() {
    const notFound = document.createElement('div');
    notFound.className = 'not-found';
    notFound.innerHTML = `
      <div class="not-found-content">
        <h2>Product Not Found</h2>
        <p>The product you're looking for doesn't exist.</p>
        <button class="btn btn-primary" id="go-home">Back to Collection</button>
      </div>
    `;

    notFound.querySelector('#go-home').addEventListener('click', () => {
      location.hash = '#home';
    });

    return notFound;
  }

  renderError() {
    const error = document.createElement('div');
    error.className = 'not-found';
    error.innerHTML = `
      <div class="not-found-content">
        <h2>Oops! Something Went Wrong</h2>
        <p>We encountered an error loading this product. Please try again.</p>
        <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 1.5rem;">
          <button class="btn btn-secondary" id="go-back">Go Back</button>
          <button class="btn btn-primary" id="try-again">Try Again</button>
        </div>
      </div>
    `;

    error.querySelector('#go-back').addEventListener('click', () => {
      window.history.back();
    });

    error.querySelector('#try-again').addEventListener('click', () => {
      location.reload();
    });

    return error;
  }

  initDescriptionToggle(container) {
    const descElement = container.querySelector('#product-desc');
    const readMoreBtn = container.querySelector('#read-more-btn');

    if (!descElement || !readMoreBtn) return;

    const MAX_HEIGHT = 80; // ~4 lines of text
    const textHeight = descElement.scrollHeight;

    // Only show read more if content exceeds max height
    if (textHeight > MAX_HEIGHT) {
      descElement.style.maxHeight = `${MAX_HEIGHT}px`;
      descElement.style.overflow = 'hidden';
      descElement.classList.add('truncated');
      readMoreBtn.style.display = 'inline-flex';

      readMoreBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const isExpanded = descElement.classList.contains('expanded');

        if (isExpanded) {
          // Collapse
          descElement.style.maxHeight = `${MAX_HEIGHT}px`;
          descElement.classList.remove('expanded');
          readMoreBtn.querySelector('.read-more-text').textContent = 'Read More';
          readMoreBtn.querySelector('svg polyline').setAttribute('points', '6 9 12 15 18 9');
        } else {
          // Expand
          descElement.style.maxHeight = `${textHeight}px`;
          descElement.classList.add('expanded');
          readMoreBtn.querySelector('.read-more-text').textContent = 'Show Less';
          readMoreBtn.querySelector('svg polyline').setAttribute('points', '18 15 12 9 6 15');
        }
      });
    }
  }
}
