import { escapeHtml } from '../../utils/helpers.js';
import { generateProductQRPDF } from './adminPdfExport.js';
import { addColorField } from './adminProductForm.js';

export async function renderProductsTable(admin, container, products = null, searchTerm = '') {
  const tbody = container.querySelector('#products-tbody');
  if (!tbody) {
    console.error('Products tbody not found in container');
    return;
  }

  // Get all products if not provided
  if (!products) {
    admin.allProducts = await admin.productService.getAll();
    admin.filteredProducts = searchTerm
      ? admin.allProducts.filter(
          (p) =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.type.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : [...admin.allProducts];
  } else {
    admin.filteredProducts = products;
  }

  // Sort products
  sortProducts(admin);

  // Calculate pagination
  const totalItems = admin.filteredProducts.length;
  const totalPages = Math.ceil(totalItems / admin.itemsPerPage);
  const startIndex = (admin.currentPage - 1) * admin.itemsPerPage;
  const endIndex = Math.min(startIndex + admin.itemsPerPage, totalItems);
  const itemsToShow = admin.filteredProducts.slice(startIndex, endIndex);

  // Update pagination controls
  updatePaginationControls(admin, container, totalItems, totalPages);

  tbody.innerHTML = '';

  itemsToShow.forEach((product) => {
    const row = document.createElement('tr');

    // Format prices for display (integers only)
    const formatPrice = (price) => {
      if (!price) return 'N/A';
      const numericValue = typeof price === 'string' ? price.replace(/[^0-9]/g, '') : price;
      if (!numericValue || isNaN(numericValue)) return price;
      const formatted = Math.round(numericValue).toLocaleString('en-US');
      return `${formatted} ден`;
    };

    row.innerHTML = `
        <td data-label="ID">
          <span class="id-number">#${escapeHtml(String(product.id))}</span>
        </td>
        <td data-label="Name"><strong>${escapeHtml(product.name)}</strong></td>
        <td data-label="Type"><span class="badge">${escapeHtml(product.type)}</span></td>
        <td data-label="Price">${formatPrice(product.priceMKD || product.price)}</td>
        <td data-label="Sizes">
          <span class="size-range">${product.availableSizes && product.availableSizes.length > 0 ? product.availableSizes[0] + ' - ' + product.availableSizes[product.availableSizes.length - 1] : 'N/A'}</span>
        </td>
        <td data-label="Colors">
          <div class="color-preview">
            ${product.availableColors
              .slice(0, 3)
              .map((c) => `<span class="color-dot" style="background:${c}"></span>`)
              .join('')}
            ${product.availableColors.length > 3 ? `<span class="color-more">+${product.availableColors.length - 3}</span>` : ''}
          </div>
        </td>
        <td class="actions">
          <button class="btn-icon btn-qr" data-id="${escapeHtml(String(product.id))}" title="Generate QR Code PDF">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
            </svg>
          </button>
          <button class="btn-icon btn-edit" data-id="${escapeHtml(String(product.id))}" title="Edit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="btn-icon btn-delete" data-id="${escapeHtml(String(product.id))}" title="Delete">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </td>
      `;

    const qrBtn = row.querySelector('.btn-qr');
    const editBtn = row.querySelector('.btn-edit');
    const deleteBtn = row.querySelector('.btn-delete');

    qrBtn.addEventListener('click', () => generateProductQRPDF(product));
    editBtn.addEventListener('click', () => openModal(admin, container, product));
    deleteBtn.addEventListener(
      'click',
      async () => await handleDelete(admin, container, product.id)
    );

    tbody.appendChild(row);
  });

  // Update sort indicators
  updateSortIndicators(admin, container);
}

export function sortProducts(admin) {
  admin.filteredProducts.sort((a, b) => {
    let aValue, bValue;

    switch (admin.sortField) {
      case 'id':
        aValue = a.id;
        bValue = b.id;
        break;
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'price':
        aValue = parseFloat((a.priceMKD || a.price || '0').toString().replace(/[^0-9]/g, '')) || 0;
        bValue = parseFloat((b.priceMKD || b.price || '0').toString().replace(/[^0-9]/g, '')) || 0;
        break;
      default:
        return 0;
    }

    if (admin.sortDirection === 'asc') {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    } else {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    }
  });
}

export function updateSortIndicators(admin, container) {
  const headers = container.querySelectorAll('.sortable');
  headers.forEach((header) => {
    const sortIcon = header.querySelector('.sort-icon');
    const field = header.dataset.sort;

    if (field === admin.sortField) {
      header.classList.add('active');
      sortIcon.style.opacity = '1';
      sortIcon.style.transform = admin.sortDirection === 'asc' ? 'rotate(0deg)' : 'rotate(180deg)';
    } else {
      header.classList.remove('active');
      sortIcon.style.opacity = '0.3';
      sortIcon.style.transform = 'rotate(0deg)';
    }
  });
}

export function updatePaginationControls(admin, container, totalItems, totalPages) {
  const paginationControls = container.querySelector('#pagination-controls');
  const paginationInfo = container.querySelector('#pagination-info');
  const pageNumbers = container.querySelector('#page-numbers');
  const prevBtn = container.querySelector('#prev-page');
  const nextBtn = container.querySelector('#next-page');

  if (totalItems <= admin.itemsPerPage) {
    paginationControls.style.display = 'none';
    return;
  }

  paginationControls.style.display = 'flex';

  // Update info text
  const startItem = (admin.currentPage - 1) * admin.itemsPerPage + 1;
  const endItem = Math.min(admin.currentPage * admin.itemsPerPage, totalItems);
  paginationInfo.textContent = `Showing ${startItem}-${endItem} of ${totalItems} products`;

  // Update buttons
  prevBtn.disabled = admin.currentPage === 1;
  nextBtn.disabled = admin.currentPage === totalPages;

  // Generate page numbers
  pageNumbers.innerHTML = '';
  const maxVisiblePages = 5;
  let startPage = Math.max(1, admin.currentPage - Math.floor(maxVisiblePages / 2));
  const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = document.createElement('button');
    pageBtn.className = `btn btn-sm ${i === admin.currentPage ? 'btn-primary' : 'btn-secondary'}`;
    pageBtn.textContent = i;
    pageBtn.addEventListener('click', async () => {
      admin.currentPage = i;
      await renderProductsTable(admin, container);
    });
    pageNumbers.appendChild(pageBtn);
  }
}

export function openModal(admin, container, product = null) {
  const modal = container.querySelector('#product-modal');
  const modalTitle = container.querySelector('#modal-title');
  const form = container.querySelector('#product-form');
  const colorsContainer = container.querySelector('#colors-container');

  modalTitle.textContent = product ? 'Edit Product' : 'Add Product';

  // Clear colors container
  colorsContainer.innerHTML = '';

  if (product) {
    container.querySelector('#product-id').value = product.id;
    container.querySelector('#product-name').value = product.name;

    // Format price with commas
    const price = product.priceMKD || product.price;
    const priceValue = typeof price === 'string' ? price.replace(/[^0-9]/g, '') : price;
    const formattedPrice = priceValue ? new Intl.NumberFormat('en-US').format(priceValue) : '';
    container.querySelector('#product-price').value = formattedPrice;

    // Store original price for comparison
    container.querySelector('#product-price').dataset.originalPrice = priceValue;

    // Format old price with commas
    const oldPrice = product.oldPriceMKD || product.oldPrice;
    const oldPriceValue =
      oldPrice && typeof oldPrice === 'string' ? oldPrice.replace(/[^0-9]/g, '') : oldPrice;
    container.querySelector('#product-old-price').value = oldPriceValue
      ? new Intl.NumberFormat('en-US').format(oldPriceValue)
      : '';

    container.querySelector('#product-type').value = product.type;
    container.querySelector('#product-description').value = product.description;
    container.querySelector('#product-tags').value = product.tags.join(', ');

    // Trigger discount calculation
    const event = new Event('input');
    container.querySelector('#product-price').dispatchEvent(event);

    // Add existing colors
    product.availableColors.forEach((color) => {
      addColorField(colorsContainer, color, product.images[color] || []);
    });

    // Check existing sizes
    if (product.availableSizes && product.availableSizes.length > 0) {
      const sizeCheckboxes = container.querySelectorAll('#sizes-container input[name="size"]');
      sizeCheckboxes.forEach((checkbox) => {
        if (product.availableSizes.includes(checkbox.value)) {
          checkbox.checked = true;
        }
      });
    }

    // Check unavailable sizes
    if (product.unavailableSizes && product.unavailableSizes.length > 0) {
      const unavailableSizeCheckboxes = container.querySelectorAll(
        '#unavailable-sizes-container input[name="unavailableSize"]'
      );
      unavailableSizeCheckboxes.forEach((checkbox) => {
        if (product.unavailableSizes.includes(checkbox.value)) {
          checkbox.checked = true;
        }
      });
    }
  } else {
    form.reset();
    container.querySelector('#product-id').value = '';
    container.querySelector('#product-old-price').value = '';
    // Add one empty color field
    addColorField(colorsContainer);

    // Uncheck all size checkboxes for new product
    const sizeCheckboxes = container.querySelectorAll('#sizes-container input[name="size"]');
    sizeCheckboxes.forEach((checkbox) => {
      checkbox.checked = false;
    });

    // Uncheck all unavailable size checkboxes for new product
    const unavailableSizeCheckboxes = container.querySelectorAll(
      '#unavailable-sizes-container input[name="unavailableSize"]'
    );
    unavailableSizeCheckboxes.forEach((checkbox) => {
      checkbox.checked = false;
    });
  }

  // Product form validation removed - admin has full control

  modal.style.display = 'flex';
}

export function closeModal(container) {
  const modal = container.querySelector('#product-modal');
  modal.style.display = 'none';
}

export async function handleSaveProduct(admin, container) {
  // Import validation functions
  const { validateProductName, validatePrice, validateRequired } =
    await import('../../utils/helpers.js');

  // Clear previous errors
  container.querySelectorAll('.form-error').forEach((el) => el.remove());
  container.querySelectorAll('.error').forEach((el) => el.classList.remove('error'));

  const idValue = container.querySelector('#product-id').value;
  const id = idValue ? parseInt(idValue) : null;
  const priceInput = container.querySelector('#product-price');
  const oldPriceInput = container.querySelector('#product-old-price');

  // Collect form data
  const formData = {
    name: container.querySelector('#product-name').value.trim(),
    description: container.querySelector('#product-description').value.trim(),
    type: container.querySelector('#product-type').value.trim(),
    priceMKD: priceInput.value.replace(/,/g, ''),
    oldPriceMKD: oldPriceInput.value.replace(/,/g, '') || null,
    tags: container
      .querySelector('#product-tags')
      .value.split(',')
      .map((t) => t.trim())
      .filter(Boolean),
  };

  // Validate form data
  const validationErrors = [];

  if (!validateRequired(formData.name, 'Product Name')) {
    validationErrors.push('Product Name is required');
  } else if (!validateProductName(formData.name)) {
    validationErrors.push('Product Name contains invalid characters');
  }

  if (!validateRequired(formData.priceMKD, 'Price')) {
    validationErrors.push('Price is required');
  } else if (!validatePrice(formData.priceMKD)) {
    validationErrors.push('Price format is invalid');
  }

  if (!validateRequired(formData.type, 'Product Type')) {
    validationErrors.push('Product Type is required');
  }

  if (validationErrors.length > 0) {
    if (window.toastService) {
      window.toastService.error('Validation errors: ' + validationErrors.join(', '));
    }
    return;
  }

  // Validation passed - admin has full control for other fields
  const sanitizedData = formData;

  // Get current and original prices
  const originalPrice = priceInput.dataset.originalPrice;
  const currentPrice = sanitizedData.priceMKD;
  const currentOldPrice = sanitizedData.oldPriceMKD;

  // If editing and price has changed, automatically set old price to original price
  let finalOldPrice = currentOldPrice;
  if (id && originalPrice && currentPrice !== originalPrice && !currentOldPrice) {
    finalOldPrice = originalPrice;
    // Update the UI to show the transferred old price
    oldPriceInput.value = new Intl.NumberFormat('en-US').format(originalPrice);
  }

  // Collect colors and images from dynamic fields
  const colorFields = container.querySelectorAll('.color-field-group');
  const colors = [];
  const images = {};

  colorFields.forEach((field) => {
    const colorInput = field.querySelector('.color-input');
    const imageDataInputs = field.querySelectorAll('.image-data');
    const color = colorInput.value.trim();

    if (color) {
      colors.push(color);
      images[color] = Array.from(imageDataInputs)
        .map((input) => input.value.trim())
        .filter(Boolean);
    }
  });

  // Validate that at least one color with image exists
  if (colors.length === 0 || Object.keys(images).every((key) => images[key].length === 0)) {
    if (window.toastService) {
      window.toastService.warning('Please add at least one color with an image');
    }
    return;
  }

  // Collect selected sizes
  const sizeCheckboxes = container.querySelectorAll('#sizes-container input[name="size"]:checked');
  const sizes = Array.from(sizeCheckboxes).map((cb) => cb.value);

  // Collect unavailable sizes
  const unavailableSizeCheckboxes = container.querySelectorAll(
    '#unavailable-sizes-container input[name="unavailableSize"]:checked'
  );
  const unavailableSizes = Array.from(unavailableSizeCheckboxes).map((cb) => cb.value);

  const productData = {
    name: sanitizedData.name,
    priceMKD: currentPrice + ' ден',
    price: '€' + Math.round(currentPrice / 61.5),
    oldPriceMKD: finalOldPrice ? finalOldPrice + ' ден' : null,
    oldPrice: finalOldPrice ? '€' + Math.round(finalOldPrice / 61.5) : null,
    type: sanitizedData.type,
    description: sanitizedData.description,
    tags: sanitizedData.tags,
    colors: colors,
    sizes: sizes,
    unavailableSizes: unavailableSizes,
    images: images,
  };

  let result;
  if (id) {
    result = admin.productService.update(id, productData);
  } else {
    result = admin.productService.create(productData);
  }

  if (result.success) {
    closeModal(container);
    await renderProductsTable(admin, container);
    if (window.toastService) {
      window.toastService.success(
        id ? 'Product updated successfully!' : 'Product created successfully!'
      );
    }
  } else {
    if (window.toastService) {
      window.toastService.error('Error: ' + result.error);
    }
  }
}

export async function handleDelete(admin, container, id) {
  if (!confirm('Are you sure you want to delete this product?')) {
    return;
  }

  const result = await admin.productService.delete(id);
  if (result.success) {
    await renderProductsTable(admin, container);
    if (window.toastService) {
      window.toastService.success('Product deleted successfully!');
    }
  } else {
    if (window.toastService) {
      window.toastService.error('Error: ' + result.error);
    }
  }
}

export async function handleSearch(admin, container, query) {
  admin.currentPage = 1; // Reset to first page when searching
  if (!query.trim()) {
    await renderProductsTable(admin, container);
    return;
  }

  const results = await admin.productService.search(query);
  await renderProductsTable(admin, container, results, query);
}
