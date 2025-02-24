/**
 * Converts a CSS gradient string (linear-gradient or radial-gradient) or solid color
 * into an ECharts-compatible background configuration.
 *
 * @param {string} background - A solid color or CSS gradient string
 * @returns {string|object} A string or object that can be used in ECharts' `backgroundColor`
 */
export default function parseBackground(background: any) {
  if (background.startsWith("linear-gradient")) {
    // Parse linear-gradient
    return parseLinearGradient(background);
  } else if (background.startsWith("radial-gradient")) {
    // Parse radial-gradient
    return parseRadialGradient(background);
  } else {
    // Assume it's a solid color
    return background;
  }
}

/**
 * Parses a linear-gradient CSS string into an ECharts-compatible object.
 *
 * @param {string} gradient - The linear-gradient CSS string
 * @returns {object} An ECharts-compatible linear gradient object
 */
function parseLinearGradient(gradient: any) {
  const linearGradientRegex = /linear-gradient\((\d+deg),\s*(.+)\)/;
  const match = gradient.match(linearGradientRegex);

  if (!match) {
    throw new Error("Invalid linear-gradient format");
  }

  const angle = parseFloat(match[1]); // Extract the angle in degrees
  const colorStops = parseColorStops(match[2]); // Extract the color stops

  // Convert angle to x2 and y2 using trigonometry
  const x2 = Math.sin((angle * Math.PI) / 180);
  const y = Math.cos((angle * Math.PI) / 180);

  return {
    type: "linear",
    x: 0,
    y2: 0,
    x2,
    y,
    colorStops,
  };
}

/**
 * Parses a radial-gradient CSS string into an ECharts-compatible object.
 *
 * @param {string} gradient - The radial-gradient CSS string
 * @returns {object} An ECharts-compatible radial gradient object
 */
function parseRadialGradient(gradient: any) {
  const radialGradientRegex = /radial-gradient\(([^,]+),\s*(.+)\)/;
  const match = gradient.match(radialGradientRegex);

  if (!match) {
    throw new Error("Invalid radial-gradient format");
  }

  const shape = match[1].trim(); // Extract the shape (e.g., "circle")
  const colorStops = parseColorStops(match[2]); // Extract the color stops

  // ECharts radial gradient assumes a circular gradient centered at (0.5, 0.5)
  return {
    type: "radial",
    x: 0.5,
    y: 0.5,
    r: 0.8, // Default radius
    colorStops,
  };
}

/**
 * Parses color stops from a gradient string into an array of objects.
 *
 * @param {string} colorStopsString - The color stops part of the gradient string
 * @returns {Array} An array of color stop objects { offset, color }
 */
function parseColorStops(colorStopsString: any) {
  const colorStopRegex =
    /((?:rgba?|hsla?)\([^)]+\)|#[0-9a-fA-F]{3,8}|[a-zA-Z]+)\s+([\d.]+%)/g;
  const colorStops = [];
  let match;

  while (
    (match = colorStopRegex.exec(colorStopsString.toLowerCase())) !== null
    ) {
    const color = match[1].trim().toLowerCase(); // Convert color to lowercase
    const offset = parseFloat(match[2]) / 100; // Convert percentage to 0-1
    colorStops.push({ offset, color });
  }

  return colorStops;
}
