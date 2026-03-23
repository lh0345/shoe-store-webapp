/* Admin PDF export + QR single-product PDF — loaded dynamically */

export function hexToRgb(hex) {
  // Convert hex color to RGB
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 217, g: 119, b: 6 }; // Default to orange
}

export function loadJSPDF() {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.jsPDF || window.jspdf) {
      resolve();
      return;
    }

    // Load jsPDF locally - no CDN issues!
    const timestamp = Date.now();
    const script = document.createElement('script');
    script.src = `/public/libs/jspdf.min.js?v=${timestamp}&t=${Math.random()}`;
    script.onload = () => {
      // jsPDF should be available as window.jsPDF or window.jspdf
      if (window.jsPDF || window.jspdf) {
        resolve();
      } else {
        console.warn('jsPDF library loaded but not found in global scope');
        reject(new Error('jsPDF not found'));
      }
    };
    script.onerror = (error) => {
      console.error('Failed to load local jsPDF library:', error);
      reject(error);
    };
    document.head.appendChild(script);
  });
}

export function loadQRCodeGenerator() {
  console.log('loadQRCodeGenerator called - UPDATED VERSION WITH CACHE BUSTING');
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.qrcodegen) {
      resolve();
      return;
    }

    // Load QR library locally - no CDN issues!
    const timestamp = Date.now();
    const script = document.createElement('script');
    script.src = `/public/libs/qrcode.min.js?v=${timestamp}&t=${Math.random()}`;
    script.onload = () => {
      // Wait for qrcode to be available
      const checkQRCode = () => {
        if (window.qrcode) {
          // Create wrapper to match expected API
          window.qrcodegen = {
            QrCode: {
              Ecc: { LOW: 0, MEDIUM: 1, QUARTILE: 2, HIGH: 3 },
              encodeText: function (text) {
                let cleanText = ''; // Declare outside try block
                try {
                  console.log('QR encodeText called with text length:', text.length);
                  console.log('Original text:', text);

                  // Validate input
                  if (!text || typeof text !== 'string') {
                    throw new Error('Invalid text input for QR code');
                  }

                  // Sanitize and limit text length to prevent issues
                  cleanText = text.trim();
                  // Remove any non-printable characters
                  // eslint-disable-next-line no-control-regex
                  cleanText = cleanText.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
                  // Limit text length - QR codes have limits
                  const maxLength = 100; // Conservative limit
                  if (cleanText.length > maxLength) {
                    cleanText = cleanText.substring(0, maxLength);
                    console.log('Text truncated to:', cleanText);
                  }

                  // Validate the cleaned text
                  if (!cleanText || cleanText.length === 0) {
                    throw new Error('Empty text after cleaning');
                  }

                  console.log('About to create QR with text:', cleanText);

                  // Create QR code with standard qrcode-generator API
                  let qr;
                  try {
                    // Try the standard API: create, addData, make
                    qr = qrcode();
                    qr.addData(cleanText);
                    qr.make();
                    console.log('QR created successfully with standard API');
                  } catch (e) {
                    console.log('Standard API failed, trying with type number:', e.message);
                    try {
                      qr = qrcode(0); // Type number 0 (auto)
                      qr.addData(cleanText);
                      qr.make();
                      console.log('QR created successfully with type number 0');
                    } catch (e2) {
                      console.log(
                        'Type number 0 failed, trying with explicit parameters:',
                        e2.message
                      );
                      try {
                        qr = qrcode(4, 'L'); // Type 4, Low ECC
                        qr.addData(cleanText);
                        qr.make();
                        console.log('QR created successfully with type 4, ECC L');
                      } catch (e3) {
                        console.error('All QR creation attempts failed:', e3.message);
                        throw new Error('Unable to create QR code: ' + e3.message);
                      }
                    }
                  }

                  // QR code is already made in the creation block above
                  console.log('QR make() completed during creation');

                  // Convert to expected format - return the qr object directly with correct API
                  const result = {
                    size: qr.getModuleCount(),
                    getModule: function (x, y) {
                      return qr.isDark(x, y); // Correct coordinate order
                    },
                  };

                  console.log('QR object created successfully, size:', result.size);
                  return result;
                } catch (error) {
                  console.error('QR Code generation failed:', error);
                  console.error('Error details:', {
                    message: error.message,
                    stack: error.stack,
                    text: text,
                    textLength: text ? text.length : 'undefined',
                    cleanText: cleanText || 'undefined',
                  });
                  throw error;
                }
              },
            },
          };
          resolve();
        } else {
          // Retry after a short delay
          setTimeout(checkQRCode, 10);
        }
      };
      checkQRCode();
    };
    script.onerror = (error) => {
      console.error('Failed to load local QR library:', error);
      reject(error);
    };
    document.head.appendChild(script);
  });
}

export async function handleExport(admin) {
  try {
    // Load jsPDF if not available
    if (!window.jspdf && !window.jsPDF) {
      await loadJSPDF();
    }

    const products = await admin.productService.getAll();

    // Try different jsPDF constructors
    let pdf;
    if (window.jsPDF) {
      pdf = new window.jsPDF('p', 'mm', 'a4');
    } else if (window.jspdf.jsPDF) {
      pdf = new window.jspdf.jsPDF('p', 'mm', 'a4');
    } else {
      throw new Error('jsPDF constructor not found');
    }

    // Extract theme colors from CSS variables
    const rootStyles = getComputedStyle(document.documentElement);
    const accentColor = rootStyles.getPropertyValue('--accent').trim() || '#2563EB';
    const accentRgb = hexToRgb(accentColor) || { r: 37, g: 99, b: 235 };
    const accentLightColor = rootStyles.getPropertyValue('--accent-light').trim() || '#DBEAFE';
    const accentLightRgb = hexToRgb(accentLightColor) || { r: 219, g: 234, b: 254 };

    // Helper function to get color name
    const getColorName = (hex) => {
      const colorMap = {
        '#000000': 'Black',
        '#FFFFFF': 'White',
        '#FF0000': 'Red',
        '#00FF00': 'Green',
        '#0000FF': 'Blue',
        '#FFFF00': 'Yellow',
        '#FF00FF': 'Magenta',
        '#00FFFF': 'Cyan',
        '#FFA500': 'Orange',
        '#800080': 'Purple',
        '#FFC0CB': 'Pink',
        '#A52A2A': 'Brown',
        '#808080': 'Gray',
        '#C0C0C0': 'Silver',
        '#FFD700': 'Gold',
        '#E6E6FA': 'Lavender',
        '#F5F5DC': 'Beige',
        '#8B4513': 'Saddle Brown',
        '#D2691E': 'Chocolate',
        '#F0E68C': 'Khaki',
        '#F5DEB3': 'Wheat',
        '#B8860B': 'Dark Goldenrod',
        '#2F4F4F': 'Dark Slate Gray',
        '#008080': 'Teal',
        '#4682B4': 'Steel Blue',
        '#87CEEB': 'Sky Blue',
        '#191970': 'Midnight Blue',
        '#000080': 'Navy',
        '#8B0000': 'Dark Red',
        '#DC143C': 'Crimson',
        '#FF1493': 'Deep Pink',
        '#FF69B4': 'Hot Pink',
        '#FFB6C1': 'Light Pink',
        '#FFA07A': 'Light Salmon',
        '#FA8072': 'Salmon',
        '#E9967A': 'Dark Salmon',
        '#CD5C5C': 'Indian Red',
        '#9ACD32': 'Yellow Green',
        '#32CD32': 'Lime Green',
        '#00FF7F': 'Spring Green',
        '#228B22': 'Forest Green',
        '#006400': 'Dark Green',
        '#556B2F': 'Dark Olive Green',
        '#8FBC8F': 'Dark Sea Green',
        '#90EE90': 'Light Green',
        '#98FB98': 'Pale Green',
        '#ADFF2F': 'Green Yellow',
        '#7FFF00': 'Chartreuse',
        '#7CFC00': 'Lawn Green',
        '#00FA9A': 'Medium Spring Green',
        '#00CED1': 'Dark Turquoise',
        '#40E0D0': 'Turquoise',
        '#48D1CC': 'Medium Turquoise',
        '#AFEEEE': 'Pale Turquoise',
        '#E0FFFF': 'Light Cyan',
        '#B0E0E6': 'Powder Blue',
        '#ADD8E6': 'Light Blue',
        '#87CEFA': 'Light Sky Blue',
        '#6495ED': 'Cornflower Blue',
        '#4169E1': 'Royal Blue',
        '#0000CD': 'Medium Blue',
        '#00008B': 'Dark Blue',
        '#9370DB': 'Medium Purple',
        '#8A2BE2': 'Blue Violet',
        '#4B0082': 'Indigo',
        '#9400D3': 'Dark Violet',
        '#9932CC': 'Dark Orchid',
        '#BA55D3': 'Medium Orchid',
        '#DA70D6': 'Orchid',
        '#EE82EE': 'Violet',
        '#DDA0DD': 'Plum',
        '#D8BFD8': 'Thistle',
      };
      return colorMap[hex.toUpperCase()] || hex;
    };

    // Format price without decimals
    const formatPriceForPDF = (price) => {
      if (!price) return 'N/A';
      const numericValue = typeof price === 'string' ? price.replace(/[^0-9]/g, '') : price;
      if (!numericValue || isNaN(numericValue)) return 'N/A';
      const rounded = Math.round(Number(numericValue));
      return rounded.toLocaleString('en-US');
    };

    // Title page with store branding
    pdf.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
    pdf.rect(0, 0, 210, 50, 'F');

    pdf.setFontSize(32);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('Product Catalog', 105, 28, { align: 'center' });

    pdf.setFontSize(12);
    pdf.setFont(undefined, 'normal');
    pdf.text(
      `Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
      105,
      38,
      { align: 'center' }
    );

    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(11);
    pdf.text(`Total Products: ${products.length}`, 105, 60, { align: 'center' });

    let yPos = 80;
    const pageHeight = 280;
    const margin = 15;
    const rightMargin = 195;
    let productCount = 0;

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      productCount++;

      // Check if we need a new page (estimate space needed)
      const estimatedSpace = 70; // Base space for product info
      if (yPos > pageHeight - estimatedSpace) {
        pdf.addPage();
        yPos = 20;
      }

      // Product number badge
      pdf.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
      pdf.circle(margin + 5, yPos + 3, 5, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.setFont(undefined, 'bold');
      pdf.text(String(productCount), margin + 5, yPos + 4.5, { align: 'center' });

      // Product name
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      const nameLines = pdf.splitTextToSize(String(product.name), 165);
      pdf.text(nameLines, margin + 12, yPos + 5);
      yPos += nameLines.length * 7 + 6;

      // Brand and Type on same line
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(107, 103, 98);
      const brandText = product.brand ? `${product.brand}` : '';
      const typeText = product.type
        ? `${product.type.charAt(0).toUpperCase() + product.type.slice(1)}`
        : '';
      const separator = brandText && typeText ? ' • ' : '';
      pdf.text(`${brandText}${separator}${typeText}`, margin, yPos);
      yPos += 8;

      // Price section with highlight
      pdf.setTextColor(0, 0, 0);
      pdf.setFont(undefined, 'bold');
      const currentPrice = formatPriceForPDF(product.priceMKD || product.price);
      const priceText = currentPrice + ' MKD';

      pdf.text('Price: ', margin, yPos);

      pdf.setFillColor(accentLightRgb.r, accentLightRgb.g, accentLightRgb.b);
      const priceWidth = pdf.getTextWidth(priceText);
      pdf.rect(margin + 13, yPos - 4, priceWidth + 4, 6, 'F');
      pdf.text(priceText, margin + 15, yPos);

      // Old price (if discounted)
      if (product.oldPrice) {
        const oldPrice = formatPriceForPDF(product.oldPrice);
        const oldPriceText = oldPrice + ' MKD';
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(150, 150, 150);
        pdf.setFontSize(9);
        const oldPriceX = margin + 20 + priceWidth;
        pdf.text(oldPriceText, oldPriceX, yPos);
        pdf.line(oldPriceX, yPos - 1.5, oldPriceX + pdf.getTextWidth(oldPriceText), yPos - 1.5);
      }
      yPos += 7;

      // Additional details (gender, material, style)
      pdf.setTextColor(80, 80, 80);
      pdf.setFontSize(9);
      pdf.setFont(undefined, 'normal');
      const details = [];
      if (product.gender)
        details.push(`Gender: ${product.gender.charAt(0).toUpperCase() + product.gender.slice(1)}`);
      if (product.material)
        details.push(
          `Material: ${product.material.charAt(0).toUpperCase() + product.material.slice(1)}`
        );
      if (product.style)
        details.push(`Style: ${product.style.charAt(0).toUpperCase() + product.style.slice(1)}`);

      if (details.length > 0) {
        pdf.text(details.join(' • '), margin, yPos);
        yPos += 5;
      }

      // Available sizes
      if (product.sizes && product.sizes.length > 0) {
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(9);
        pdf.text('Sizes: ', margin, yPos);
        pdf.setTextColor(80, 80, 80);
        const sizesText = product.sizes.join(', ');
        const sizesLines = pdf.splitTextToSize(sizesText, 170);
        pdf.text(sizesLines, margin + 12, yPos);
        yPos += sizesLines.length * 4 + 2;
      }

      // Available colors with color names
      if (product.colors && product.colors.length > 0) {
        pdf.setTextColor(0, 0, 0);
        pdf.text('Colors: ', margin, yPos);
        pdf.setTextColor(80, 80, 80);
        const colorNames = product.colors.map((c) => getColorName(c)).join(', ');
        const colorLines = pdf.splitTextToSize(colorNames, 170);
        pdf.text(colorLines, margin + 14, yPos);
        yPos += colorLines.length * 4 + 2;
      }

      // Description
      if (product.description) {
        pdf.setTextColor(60, 60, 60);
        pdf.setFontSize(9);
        const descLines = pdf.splitTextToSize(String(product.description), 180);
        pdf.text(descLines, margin, yPos);
        yPos += descLines.length * 4 + 2;
      }

      // Tags
      if (product.tags && product.tags.length > 0) {
        pdf.setFontSize(8);
        pdf.setTextColor(120, 120, 120);
        let tagX = margin;
        product.tags.forEach((tag) => {
          const tagText = `#${tag}`;
          const tagWidth = pdf.getTextWidth(tagText);
          pdf.setFillColor(240, 240, 240);
          pdf.roundedRect(tagX, yPos - 3, tagWidth + 4, 4.5, 1, 1, 'F');
          pdf.text(tagText, tagX + 2, yPos);
          tagX += tagWidth + 6;
        });
        yPos += 6;
      }

      // Separator line
      yPos += 2;
      pdf.setDrawColor(220, 220, 220);
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPos, rightMargin, yPos);
      yPos += 10;
    }

    // Footer on last page
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`End of Catalog - ${products.length} products`, 105, pageHeight + 10, {
      align: 'center',
    });

    // Save PDF
    const timestamp = new Date().toISOString().slice(0, 10);
    try {
      pdf.save(`product-catalog-${timestamp}.pdf`);
      if (window.toastService) {
        window.toastService.success('Product catalog PDF exported successfully!');
      }
    } catch (saveError) {
      console.error('PDF save failed:', saveError);
      throw new Error('Failed to save PDF file');
    }
  } catch (error) {
    console.error('Export error:', error);
    if (window.showErrorNotification) {
      window.showErrorNotification('Failed to export products');
    }
  }
}

export async function generateProductQRPDF(product) {
  console.log(
    'generateProductQRPDF called for product:',
    product.name,
    'at timestamp:',
    Date.now()
  );
  try {
    // Load jsPDF if not available
    if (!window.jspdf && !window.jsPDF) {
      await loadJSPDF();
    }

    // Load qrcode-generator library if needed
    if (!window.qrcodegen) {
      await loadQRCodeGenerator();
    }

    // Try different jsPDF constructors
    let pdf;
    if (window.jsPDF) {
      pdf = new window.jsPDF('p', 'mm', 'a4');
    } else if (window.jspdf.jsPDF) {
      pdf = new window.jspdf.jsPDF('p', 'mm', 'a4');
    } else {
      throw new Error('jsPDF constructor not found');
    }

    // Extract theme colors from CSS variables
    const rootStyles = getComputedStyle(document.documentElement);
    const accentColor = rootStyles.getPropertyValue('--accent').trim() || '#2563EB';
    const accentRgb = hexToRgb(accentColor) || { r: 37, g: 99, b: 235 };

    const pageWidth = 210;
    const pageHeight = 297;

    // Product URL using slug (customer-friendly URL) - use shorter ID for QR
    const productSlug = product.slug || product.id;
    const productUrl = `${window.location.origin}/product/${productSlug}`;
    // For QR codes, use the full product URL for better usability
    const qrData = productUrl;
    console.log('Product data for QR:', { id: product.id, slug: product.slug, qrData });

    // Clean background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    // Decorative accent bar at top
    pdf.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
    pdf.rect(0, 0, pageWidth, 10, 'F');

    // Center content vertically
    let yPos = 80;

    // Product name - Large and bold
    pdf.setFontSize(36);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(26, 24, 21);
    const productNameLines = pdf.splitTextToSize(product.name, 170);
    productNameLines.forEach((line) => {
      pdf.text(line, pageWidth / 2, yPos, { align: 'center' });
      yPos += 14;
    });

    // Product type - Below name
    yPos += 5;
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(107, 103, 98);
    pdf.text(product.type.toUpperCase(), pageWidth / 2, yPos, { align: 'center' });

    // Price - Below type
    yPos += 18;
    pdf.setFontSize(28);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(26, 24, 21);
    const formatPrice = (price) => {
      if (!price) return 'N/A';
      const numericValue = typeof price === 'string' ? price.replace(/[^0-9]/g, '') : price;
      if (!numericValue || isNaN(numericValue)) return 'N/A';
      return String(Math.floor(Number(numericValue)));
    };
    const priceText = formatPrice(product.priceMKD || product.price) + ' MKD';
    pdf.text(priceText, pageWidth / 2, yPos, { align: 'center' });

    // QR Code section - Large and centered using real QR code
    yPos += 40;
    const qrSize = 100;
    const qrX = (pageWidth - qrSize) / 2;

    // QR code white background with border
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(accentRgb.r, accentRgb.g, accentRgb.b);
    pdf.setLineWidth(2);
    pdf.roundedRect(qrX - 10, yPos - 10, qrSize + 20, qrSize + 20, 5, 5, 'FD');

    // Generate real QR code
    try {
      console.log('Generating QR for data:', qrData);
      const qr = window.qrcodegen.QrCode.encodeText(qrData, window.qrcodegen.QrCode.Ecc.MEDIUM);
      console.log('QR generated successfully, size:', qr.size);
      const scale = qrSize / qr.size;

      pdf.setFillColor(26, 24, 21);
      let modulesDrawn = 0;
      for (let y = 0; y < qr.size; y++) {
        for (let x = 0; x < qr.size; x++) {
          if (qr.getModule(x, y)) {
            pdf.rect(qrX + x * scale, yPos + y * scale, scale, scale, 'F');
            modulesDrawn++;
          }
        }
      }
      console.log('QR modules drawn:', modulesDrawn);
    } catch (qrError) {
      console.error('QR generation failed:', qrError);
      // Fallback: Display URL as text in a styled box
      pdf.setFillColor(248, 250, 252); // Light gray background
      pdf.setDrawColor(accentRgb.r, accentRgb.g, accentRgb.b);
      pdf.setLineWidth(1);
      pdf.roundedRect(qrX - 5, yPos - 5, qrSize + 10, qrSize + 10, 3, 3, 'FD');

      // Add "QR Code" label
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
      pdf.text('SCAN QR CODE', pageWidth / 2, yPos + 10, { align: 'center' });

      // Add URL text in the center
      pdf.setFontSize(8);
      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(26, 24, 21);

      // Display the short QR data
      pdf.text(`ID: ${qrData}`, pageWidth / 2, yPos + qrSize / 2, { align: 'center' });

      // Add small note at bottom
      pdf.setFontSize(6);
      pdf.setTextColor(107, 103, 98);
      pdf.text('(QR library unavailable)', pageWidth / 2, yPos + qrSize + 5, { align: 'center' });
    }

    // Decorative accent bar at bottom
    const footerY = pageHeight - 10;
    pdf.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
    pdf.rect(0, footerY, pageWidth, 10, 'F');

    // Save PDF
    const fileName = `${product.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-qr.pdf`;
    try {
      pdf.save(fileName);
      if (window.toastService) {
        window.toastService.success('QR code PDF generated successfully!');
      }
    } catch (saveError) {
      console.error('PDF save failed:', saveError);
      throw new Error('Failed to save PDF file');
    }
  } catch (error) {
    console.error('QR PDF generation error:', error);
    if (window.toastService) {
      window.toastService.error('Error generating QR code PDF. Please try again.');
    }
  }
}
