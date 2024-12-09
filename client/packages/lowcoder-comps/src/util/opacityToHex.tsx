export default function opacityToHex(opacity) {
  opacity = Math.max(0, Math.min(1, opacity));
  const decimalValue = Math.round(opacity * 255);
  const hexValue = decimalValue.toString(16).toUpperCase();
  return hexValue.padStart(2, '0');
}
