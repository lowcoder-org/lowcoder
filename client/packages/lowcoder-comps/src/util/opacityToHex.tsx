export default function opacityToHex(opacity: any) {
  if (opacity === undefined)
    return 'FF'
  try {
    // Ensure opacity is clamped between 0 and 1
    opacity = Math.max(0, Math.min(1, opacity));
    const decimalValue = Math.round(opacity * 255);
    const hexValue = decimalValue.toString(16).toUpperCase();
    return hexValue.padStart(2, '0');
  } catch (error) {
    // Return 'FF' if an exception occurs
    return 'FF';
  }
}

