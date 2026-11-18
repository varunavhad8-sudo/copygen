export const formatValue = (value) => Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumSignificantDigits: 3,
  notation: 'compact',
}).format(value);

export const formatThousands = (value) => Intl.NumberFormat('en-US', {
  maximumSignificantDigits: 3,
  notation: 'compact',
}).format(value);

export const getCssVariable = (variable) => {
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
};

const adjustHexOpacity = (hexColor, opacity) => {
  // Remove the '#' if it exists
  hexColor = hexColor.replace('#', '');

  // Convert hex to RGB
  const r = parseInt(hexColor.substring(0, 2), 16);
  const g = parseInt(hexColor.substring(2, 4), 16);
  const b = parseInt(hexColor.substring(4, 6), 16);

  // Return RGBA string
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const adjustHSLOpacity = (hslColor, opacity) => {
  // Convert HSL to HSLA
  return hslColor.replace('hsl(', 'hsla(').replace(')', `, ${opacity})`);
};

const adjustOKLCHOpacity = (oklchColor, opacity) => {
  // Add alpha value to OKLCH color
  return oklchColor.replace(/oklch\((.*?)\)/, (match, p1) => `oklch(${p1} / ${opacity})`);
};

export const adjustColorOpacity = (color, opacity) => {
  if (!color) {
    return `rgba(128, 128, 128, ${opacity})`; // fallback
  }
  
  if (color.startsWith('var(')) {
    // If it's literally a var() string, we can't easily parse it synchronously without a DOM element,
    // but typically getCssVariable resolves it unless it's missing.
    return `rgba(128, 128, 128, ${opacity})`;
  }
  
  // Clean up any extra spaces
  color = color.trim();

  if (color.startsWith('#')) {
    return adjustHexOpacity(color, opacity);
  } else if (color.startsWith('hsl')) {
    return adjustHSLOpacity(color, opacity);
  } else if (color.startsWith('oklch')) {
    return adjustOKLCHOpacity(color, opacity);
  } else if (color.startsWith('color(') || color.startsWith('rgb')) {
    // Basic fallback for rgb/rgba or color()
    return `rgba(128, 128, 128, ${opacity})`;
  } else if (/^\d/.test(color)) {
    // If it's just raw numbers (e.g. from tailwind v4 raw variables)
    // we can assume it's OKLCH space if using Tailwind v4 default
    return `oklch(${color} / ${opacity})`;
  } else {
    console.warn(`Unsupported color format: "${color}"`);
    return `rgba(128, 128, 128, ${opacity})`;
  }
};

export const oklchToRGBA = (oklchColor) => {
  // Create a temporary div to use for color conversion
  const tempDiv = document.createElement('div');
  tempDiv.style.color = oklchColor;
  document.body.appendChild(tempDiv);
  
  // Get the computed style and convert to RGB
  const computedColor = window.getComputedStyle(tempDiv).color;
  document.body.removeChild(tempDiv);
  
  return computedColor;
};