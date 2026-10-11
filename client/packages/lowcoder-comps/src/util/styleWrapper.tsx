export const styleWrapper = (styleContainer: any, themeContainer: any, defaultFontSize=18, defaultFontColor='#000000', detailBorderWidth = 0, defaultBackgroundColor = "" ) => {

  return {
    "fontFamily": styleContainer?.chartFontFamily || themeContainer?.fontFamily || 'Arial, sans-serif',
    "fontSize": styleContainer?.chartTextSize || themeContainer?.fontSize || defaultFontSize,
    "fontWeight": styleContainer?.chartTextWeight || themeContainer?.fontWeight,
    "color": styleContainer?.chartTextColor || themeContainer?.fontColor || defaultFontColor,
    "fontStyle": styleContainer?.chartFontStyle || themeContainer?.fontStyle,
    "textShadowColor": styleContainer?.chartShadowColor || themeContainer?.shadowColor,
    "textShadowBlur": styleContainer?.chartBoxShadow?.split('px')[0] || themeContainer?.boxShadow && themeContainer?.boxShadow?.split('px')[0],
    "textShadowOffsetX": styleContainer?.chartBoxShadow?.split('px')[1] || themeContainer?.boxShadow && themeContainer?.boxShadow?.split('px')[1],
    "textShadowOffsetY": styleContainer?.chartBoxShadow?.split('px')[2] || themeContainer?.boxShadow && themeContainer?.boxShadow?.split('px')[2],
    "borderColor": styleContainer?.chartBorderColor || themeContainer?.borderColor || 'inherit',
    "borderWidth": styleContainer?.chartBorderWidth || themeContainer?.borderWidth || detailBorderWidth,
    "borderType": styleContainer?.chartBorderStyle || themeContainer?.borderType,
    "borderRadius": Number(styleContainer?.chartBorderRadius || themeContainer?.borderRadius),
    "backgroundColor": styleContainer?.chartBackgroundColor || themeContainer?.backgroundColor || defaultBackgroundColor,
    "width": styleContainer?.detailSize?.split('px')[0] || themeContainer?.detailSize && themeContainer?.detailSize.split('px')[0],
    "height": styleContainer?.detailSize?.split('px')[1] || themeContainer?.detailSize && themeContainer?.detailSize.split('px')[1],
    "padding": styleContainer?.padding?.split('px').filter(Boolean).map(Number) || themeContainer?.padding && themeContainer?.padding?.split('px').filter(Boolean).map(Number) || [0,0,0,0]
  }
}

export const chartStyleWrapper = (styleContainer: any, themeContainer: any, detailBorderWidth = 0) => {

  return {
    "shadowColor": styleContainer?.chartShadowColor || themeContainer?.shadowColor,
    "shadowBlur": styleContainer?.chartBoxShadow?.split('px')[0] || themeContainer?.boxShadow && themeContainer?.boxShadow?.split('px')[0],
    "shadowOffsetX": styleContainer?.chartBoxShadow?.split('px')[1] || themeContainer?.boxShadow && themeContainer?.boxShadow?.split('px')[1],
    "shadowOffsetY": styleContainer?.chartBoxShadow?.split('px')[2] || themeContainer?.boxShadow && themeContainer?.boxShadow?.split('px')[2],
    "borderColor": styleContainer?.chartBorderColor || themeContainer?.borderColor || 'inherit',
    "borderWidth": styleContainer?.chartBorderWidth || themeContainer?.borderWidth || detailBorderWidth,
    "borderType": styleContainer?.chartBorderStyle || themeContainer?.borderType,
    "borderRadius": Number(styleContainer?.chartBorderRadius || themeContainer?.borderRadius),
  }
}