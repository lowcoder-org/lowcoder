import opacityToHex from "./opacityToHex";

const getBackgroundColor = (
  backgroundColor: any,
  gradientColor: any,
  opacity: any,
  direction: any,
) => {
  if (direction?.split(' ').length < 4)
    return gradientColor && backgroundColor
      ? {
        "type": 'radial',
        "x": direction?.split(' ')[0],
        "y": direction?.split(' ')[1],
        "r": direction?.split(' ')[2],
        "colorStops": [
          { "offset": 0, "color": backgroundColor + opacityToHex(opacity)},
          { "offset": 1, "color": gradientColor + opacityToHex(opacity)}
        ]
      }
      : backgroundColor + opacityToHex(opacity)
  else
    return gradientColor && backgroundColor
      ? {
        "type": 'linear',
        "x": direction?.split(' ')[0],
        "y": direction?.split(' ')[1],
        "x2": direction?.split(' ')[2],
        "y2": direction?.split(' ')[3],
        "colorStops": [
          { "offset": 0, "color": backgroundColor + opacityToHex(opacity)},
          { "offset": 1, "color": gradientColor + opacityToHex(opacity)}
        ]
      }
      : backgroundColor + opacityToHex(opacity)
}

export default getBackgroundColor;