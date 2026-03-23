import { escapeHtml } from '../../utils/helpers.js';

export function addImageInput(imagesList, url = '') {
  const imageInput = document.createElement('div');
  imageInput.className = 'image-input-row';
  imageInput.innerHTML = `
      <div class="image-preview-wrapper">
        ${url ? `<img src="${escapeHtml(url)}" class="image-preview" alt="Product image">` : '<div class="image-placeholder">No image</div>'}
      </div>
      <input type="file" class="image-file-input" accept="image/*" style="display:none;" aria-label="Upload product image">
      <input type="hidden" class="image-data" value="${escapeHtml(url)}">
      <button type="button" class="btn-upload-image">📷 ${url ? 'Change' : 'Upload'}</button>
      <button type="button" class="btn-remove-image">×</button>
    `;

  imagesList.appendChild(imageInput);

  const fileInput = imageInput.querySelector('.image-file-input');
  const uploadBtn = imageInput.querySelector('.btn-upload-image');
  const removeBtn = imageInput.querySelector('.btn-remove-image');
  const imageData = imageInput.querySelector('.image-data');
  const previewWrapper = imageInput.querySelector('.image-preview-wrapper');

  uploadBtn.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target.result;
        imageData.value = base64;

        previewWrapper.innerHTML = `<img src="${base64}" class="image-preview" alt="Product image">`;
        uploadBtn.textContent = '📷 Change';
      };
      reader.readAsDataURL(file);
    }
  });

  removeBtn.addEventListener('click', () => {
    imageInput.remove();
  });
}

export function addColorField(colorsContainer, color = '', images = []) {
  if (!colorsContainer) {
    console.error('Colors container not found');
    return;
  }

  const fieldId = Date.now() + Math.random();
  const defaultColor = color || '#8B4513';

  const fieldGroup = document.createElement('div');
  fieldGroup.className = 'color-field-group';
  fieldGroup.innerHTML = `
      <div class="color-field-row">
        <div class="color-preview-thumb" style="background-color: ${defaultColor}"></div>
        <div class="color-input-wrapper">
          <input type="color" class="color-picker" value="${defaultColor}" aria-label="Pick color">
          <input type="text" class="color-input" placeholder="#8B4513" value="${defaultColor}" aria-label="Color hex code">
        </div>
        <button type="button" class="btn-secondary btn-sm btn-add-image" data-field="${escapeHtml(fieldId)}">+ Image</button>
        <button type="button" class="btn-icon btn-remove-field" title="Remove color">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="images-list" data-field="${fieldId}"></div>
    `;

  colorsContainer.appendChild(fieldGroup);

  const imagesList = fieldGroup.querySelector('.images-list');
  images.forEach((url) => addImageInput(imagesList, url));

  if (images.length === 0) {
    addImageInput(imagesList);
  }

  const colorPicker = fieldGroup.querySelector('.color-picker');
  const colorInput = fieldGroup.querySelector('.color-input');
  const colorThumb = fieldGroup.querySelector('.color-preview-thumb');
  const addImageBtn = fieldGroup.querySelector('.btn-add-image');
  const removeBtn = fieldGroup.querySelector('.btn-remove-field');

  colorPicker.addEventListener('input', (e) => {
    colorInput.value = e.target.value;
    colorThumb.style.backgroundColor = e.target.value;
  });

  colorInput.addEventListener('input', (e) => {
    if (e.target.value.match(/^#[0-9A-Fa-f]{6}$/)) {
      colorPicker.value = e.target.value;
      colorThumb.style.backgroundColor = e.target.value;
    }
  });

  addImageBtn.addEventListener('click', () => {
    addImageInput(imagesList);
  });

  removeBtn.addEventListener('click', () => {
    fieldGroup.remove();
  });
}
