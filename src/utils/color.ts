export function getContrastText(hexColor: string): string {
  if (!hexColor) return '#ffffff';
  
  // Handle simple color names or invalid hex
  if (!hexColor.startsWith('#')) return '#ffffff';

  const hex = hexColor.replace('#', '');
  
  // Parse r, g, b
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  if (isNaN(r) || isNaN(g) || isNaN(b)) return '#ffffff';

  // Calculate relative luminance
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  
  return (yiq >= 128) ? '#000000' : '#ffffff';
}

export function ensureVisibleOnDark(hexColor: string): string {
  if (!hexColor) return '#ffffff';
  if (!hexColor.startsWith('#')) return hexColor;

  const hex = hexColor.replace('#', '');
  let r = parseInt(hex.substr(0, 2), 16);
  let g = parseInt(hex.substr(2, 2), 16);
  let b = parseInt(hex.substr(4, 2), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) return hexColor;
  
  // Calculate luminance
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  
  // If too dark (threshold 100/255), lighten it
  if (yiq < 100) {
    // Increase brightness
    const factor = 150; 
    r = Math.min(255, r + factor);
    g = Math.min(255, g + factor);
    b = Math.min(255, b + factor);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
  
  return hexColor;
}
