export function setupColorSync(container, colorId) {
  const colorPicker = container.querySelector(`#${colorId}`);
  const colorText = container.querySelector(`#${colorId}-text`);

  if (colorPicker && colorText) {
    colorPicker.addEventListener('input', (e) => {
      colorText.value = e.target.value.toUpperCase();
    });

    colorText.addEventListener('input', (e) => {
      const value = e.target.value;
      if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
        colorPicker.value = value;
      }
    });
  }
}

export async function handleSaveSettings(container) {
  const { validateSlug, validateRequired } = await import('../../utils/helpers.js');

  const formData = {
    brandName: container.querySelector('#brand-name').value,
    brandSlug: container.querySelector('#brand-slug').value,
    brandTagline: container.querySelector('#brand-tagline').value,
    brandDescription: container.querySelector('#brand-description').value,
    contactPhone: container.querySelector('#contact-phone').value,
    contactEmail: container.querySelector('#contact-email').value,
    contactAddress: container.querySelector('#contact-address').value,
    colorAccent: container.querySelector('#color-accent').value,
    colorAccentLight: container.querySelector('#color-accent-light').value,
    colorAccentDark: container.querySelector('#color-accent-dark').value,
    exchangeRate: container.querySelector('#business-exchange-rate').value,
    shippingPolicy: container.querySelector('#policy-shipping').value,
    returnsPolicy: container.querySelector('#policy-returns').value,
    warrantyPolicy: container.querySelector('#policy-warranty').value,
    whatsappUrl: container.querySelector('#social-whatsapp').value.trim(),
    instagramUrl: container.querySelector('#social-instagram').value.trim(),
    facebookUrl: container.querySelector('#social-facebook').value.trim(),
  };

  const validationErrors = [];

  if (!validateRequired(formData.brandName, 'Brand Name'))
    validationErrors.push('Brand Name is required');
  if (!validateRequired(formData.brandSlug, 'Brand Slug'))
    validationErrors.push('Brand Slug is required');
  if (!validateRequired(formData.brandTagline, 'Brand Tagline'))
    validationErrors.push('Brand Tagline is required');
  if (!validateRequired(formData.brandDescription, 'Brand Description'))
    validationErrors.push('Brand Description is required');

  if (formData.brandSlug && !validateSlug(formData.brandSlug)) {
    validationErrors.push('Brand Slug must contain only lowercase letters, numbers, and hyphens');
  }

  if (validationErrors.length > 0) {
    if (window.toastService) {
      window.toastService.error('Validation errors: ' + validationErrors.join(', '));
    }
    return;
  }

  const sanitizedData = formData;

  const config = {
    brand: {
      name: sanitizedData.brandName,
      slug: sanitizedData.brandSlug,
      tagline: sanitizedData.brandTagline,
      description: sanitizedData.brandDescription,
    },
    contact: {
      phone: sanitizedData.contactPhone,
      email: sanitizedData.contactEmail,
      address: sanitizedData.contactAddress,
    },
    colors: {
      accent: sanitizedData.colorAccent,
      accentLight: sanitizedData.colorAccentLight,
      accentDark: sanitizedData.colorAccentDark,
    },
    business: {
      defaultCurrency: container.querySelector('#business-currency').value,
      exchangeRate: parseFloat(sanitizedData.exchangeRate),
    },
    policies: {
      shipping: sanitizedData.shippingPolicy,
      returns: sanitizedData.returnsPolicy,
      warranty: sanitizedData.warrantyPolicy,
    },
    social: {
      whatsapp: sanitizedData.whatsappUrl,
      instagram: sanitizedData.instagramUrl,
      facebook: sanitizedData.facebookUrl,
    },
  };

  localStorage.setItem('storeConfig', JSON.stringify(config));

  if (window.holidayBannerService) {
    const banners = window.holidayBannerService.getBanners();
    const holidayInputs = container.querySelectorAll('[data-holiday-id]');

    holidayInputs.forEach((input) => {
      const bannerId = input.dataset.holidayId;
      const banner = banners.find((b) => b.id === bannerId);

      if (banner) {
        if (input.type === 'checkbox') {
          banner.enabled = input.checked;
        } else if (input.name === 'title') {
          banner.title = input.value;
        } else if (input.name === 'message') {
          banner.message = input.value;
        } else if (input.name === 'startDate') {
          banner.startDate = input.value || '';
        } else if (input.name === 'endDate') {
          banner.endDate = input.value || '';
        }
      }
    });

    window.holidayBannerService.saveBanners(banners);
    window.holidayBannerService.hideBanner();
    setTimeout(() => window.holidayBannerService.showBanner(), 100);
  }

  if (window.storeConfig) {
    window.storeConfig.brand = config.brand;
    window.storeConfig.contact = config.contact;
    window.storeConfig.colors = config.colors;
    window.storeConfig.business = config.business;
    window.storeConfig.policies = config.policies;
    window.storeConfig.social = config.social;
  }

  document.documentElement.style.setProperty('--accent', config.colors.accent);
  document.documentElement.style.setProperty('--accent-light', config.colors.accentLight);
  document.documentElement.style.setProperty('--accent-dark', config.colors.accentDark);

  if (window.currencyService) {
    window.currencyService.baseCurrency = config.business.defaultCurrency;
    window.currencyService.exchangeRate = config.business.exchangeRate;
  }

  if (window.initBrandElements) {
    window.initBrandElements();
  }

  document.querySelectorAll('.brand-name').forEach((el) => (el.textContent = config.brand.name));
  document.querySelectorAll('#brand-name').forEach((el) => (el.textContent = config.brand.name));
  document.querySelectorAll('#footer-brand').forEach((el) => (el.textContent = config.brand.name));
  document
    .querySelectorAll('#copyright-brand')
    .forEach((el) => (el.textContent = config.brand.name));

  document.title = `${config.brand.name} — ${config.brand.tagline}`;

  const phone = config.contact.phone;
  const whatsappPhone = phone.replace(/\D/g, '');
  document.querySelectorAll('#footer-phone').forEach((el) => (el.href = `tel:${phone}`));
  document
    .querySelectorAll('#whatsapp-link')
    .forEach((el) => (el.href = `https://wa.me/${whatsappPhone}`));

  if (window.initFooterSocialLinks) {
    window.initFooterSocialLinks();
  }

  if (window.toastService) {
    window.toastService.success(
      'Settings saved and applied successfully! All changes are now live.'
    );
  }
}
