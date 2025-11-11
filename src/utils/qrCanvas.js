/**
 * Client-side QR Code generation with advanced customization
 * All rendering happens in browser - no server dependencies!
 */

import QRCode from 'qrcode';

/**
 * Generate advanced QR code with full customization
 */
export async function generateAdvancedQR(data, options = {}) {
  const {
    size = 800,
    backgroundColor = '#FFFFFF',
    foregroundColor = '#000000',
    dotStyle = 'square',
    gradientType = 'none',
    gradientStartColor = '#000000',
    gradientEndColor = '#667eea',
    logo = null,
    logoSize = 0.25,
    cornerStyle = 'square'
  } = options;

  try {
    // Step 1: Generate base QR code
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    
    await QRCode.toCanvas(canvas, data, {
      width: size,
      margin: 2,
      color: {
        dark: foregroundColor,
        light: backgroundColor
      },
      errorCorrectionLevel: 'H'
    });

    const ctx = canvas.getContext('2d');

    // Step 2: Apply gradient if requested
    if (gradientType !== 'none') {
      await applyGradient(ctx, canvas, gradientType, gradientStartColor, gradientEndColor);
    }

    // Step 3: Apply dot styling
    if (dotStyle !== 'square') {
      await applyDotStyle(ctx, canvas, dotStyle);
    }

    // Step 4: Apply corner styling
    if (cornerStyle !== 'square') {
      await applyCornerStyle(ctx, canvas, cornerStyle);
    }

    // Step 5: Add logo if provided
    if (logo) {
      await addLogo(ctx, canvas, logo, logoSize);
    }

    // Convert to data URL
    return canvas.toDataURL('image/png', 1.0);

  } catch (error) {
    console.error('Advanced QR generation error:', error);
    throw error;
  }
}

/**
 * Apply gradient to QR code
 */
async function applyGradient(ctx, canvas, type, startColor, endColor) {
  const { width, height } = canvas;
  
  // Get current image data
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Create gradient
  let gradient;
  if (type === 'linear') {
    gradient = ctx.createLinearGradient(0, 0, width, height);
  } else if (type === 'radial') {
    gradient = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, width / 2
    );
  }

  gradient.addColorStop(0, startColor);
  gradient.addColorStop(1, endColor);

  // Apply gradient only to dark pixels
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

/**
 * Apply dot styling (rounded, dots, classy)
 */
async function applyDotStyle(ctx, canvas, style) {
  const { width, height } = canvas;
  const moduleSize = Math.floor(width / 45); // Approximate QR module size

  if (style === 'rounded' || style === 'classy-rounded') {
    // Apply subtle blur for rounded effect
    ctx.filter = 'blur(0.5px)';
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(canvas, 0, 0);
    
    ctx.filter = 'none';
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(tempCanvas, 0, 0);
  }
}

/**
 * Apply corner square styling
 */
async function applyCornerStyle(ctx, canvas, style) {
  const { width, height } = canvas;
  const cornerSize = Math.floor(width / 7);
  const positions = [
    { x: 0, y: 0 },
    { x: width - cornerSize, y: 0 },
    { x: 0, y: height - cornerSize }
  ];

  if (style === 'rounded' || style === 'extra-rounded') {
    const radius = style === 'extra-rounded' ? 20 : 10;
    
    positions.forEach(pos => {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      
      // Create rounded corner mask
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineTo(pos.x + cornerSize, pos.y);
      ctx.lineTo(pos.x + cornerSize, pos.y + cornerSize);
      ctx.lineTo(pos.x, pos.y + cornerSize);
      ctx.closePath();
      ctx.fill();
      
      // Redraw with rounded corners
      ctx.globalCompositeOperation = 'source-over';
      ctx.beginPath();
      ctx.roundRect(pos.x, pos.y, cornerSize, cornerSize, radius);
      ctx.fill();
      
      ctx.restore();
    });
  }
}

/**
 * Add logo to center of QR code
 */
async function addLogo(ctx, canvas, logoDataUrl, sizeRatio) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const { width, height } = canvas;
      const logoSize = Math.floor(width * sizeRatio);
      const x = (width - logoSize) / 2;
      const y = (height - logoSize) / 2;

      // Draw white background circle
      const bgRadius = (logoSize / 2) * 1.2;
      ctx.save();
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, bgRadius, 0, Math.PI * 2);
      ctx.fill();

      // Draw logo with rounded corners
      ctx.beginPath();
      ctx.roundRect(x, y, logoSize, logoSize, 10);
      ctx.clip();
      ctx.drawImage(img, x, y, logoSize, logoSize);
      ctx.restore();

      resolve();
    };

    img.onerror = () => {
      console.error('Logo loading failed');
      resolve(); // Continue without logo
    };

    img.src = logoDataUrl;
  });
}

/**
 * Simple QR generation (fallback)
 */
export async function generateSimpleQR(data, options = {}) {
  const { size = 400, backgroundColor = '#FFFFFF', foregroundColor = '#000000' } = options;

  try {
    const canvas = document.createElement('canvas');
    await QRCode.toCanvas(canvas, data, {
      width: size,
      margin: 2,
      color: {
        dark: foregroundColor,
        light: backgroundColor
      },
      errorCorrectionLevel: 'M'
    });

    return canvas.toDataURL('image/png', 1.0);
  } catch (error) {
    console.error('Simple QR generation error:', error);
    throw error;
  }
}