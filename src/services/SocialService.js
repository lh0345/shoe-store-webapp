/* SocialService.js - Social sharing and engagement features */

export class SocialService {
  constructor(brandSlug = 'store') {
    this.viewsKey = `${brandSlug}_product_views`;
    this.views = this.loadViews();
  }

  loadViews() {
    try {
      const data = localStorage.getItem(this.viewsKey);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Failed to load views:', error);
      return {};
    }
  }

  saveViews() {
    try {
      localStorage.setItem(this.viewsKey, JSON.stringify(this.views));
    } catch (error) {
      console.error('Failed to save views:', error);
    }
  }

  // Track product view
  trackView(productId) {
    if (!this.views[productId]) {
      this.views[productId] = 0;
    }
    this.views[productId]++;
    this.saveViews();
    return this.views[productId];
  }

  // Get view count for a product
  getViews(productId) {
    return this.views[productId] || 0;
  }

  // Share on Messenger
  shareOnMessenger(product) {
    const url = `${window.location.origin}/product/${product.slug}`;
    const shareUrl = `https://www.facebook.com/dialog/send?link=${encodeURIComponent(url)}&app_id=YOUR_APP_ID`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
  }

  // Share on Instagram
  shareOnInstagram(product) {
    // Instagram doesn't have a direct web share URL, so we copy the link and show a message
    this.copyLink(product).then((result) => {
      if (result.success && window.toastService) {
        window.toastService.info(
          'Link copied! You can now paste it in your Instagram story or bio.'
        );
      }
    });
  }

  // Share on Viber
  shareOnViber(product) {
    const url = `${window.location.origin}/product/${product.slug}`;
    const text = `Check out this amazing ${product.name}!`;
    const shareUrl = `viber://forward?text=${encodeURIComponent(text + ' ' + url)}`;
    window.open(shareUrl, '_blank');
  }

  // Share via WhatsApp with product details
  shareOnWhatsApp(product, phone) {
    const url = `${window.location.origin}/product/${product.slug}`;
    const message = `Check out this product!\n\n${product.name}\n${product.priceMKD || product.price}\n\n${url}`;
    const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }

  // Share via Email
  shareViaEmail(product) {
    const url = `${window.location.origin}/product/${product.slug}`;
    const subject = `Check out this product: ${product.name}`;
    const body = `I thought you might be interested in this:\n\n${product.name}\n${product.description}\n\nView it here: ${url}`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  }

  // Copy link to clipboard
  async copyLink(product) {
    const url = `${window.location.origin}/product/${product.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      return { success: true, message: 'Link copied to clipboard!' };
    } catch (error) {
      console.error('Failed to copy:', error);
      return { success: false, message: 'Failed to copy link' };
    }
  }
}
