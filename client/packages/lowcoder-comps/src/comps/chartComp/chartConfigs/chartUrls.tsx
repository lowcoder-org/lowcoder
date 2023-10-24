import { language } from "i18n/comps";

const echartsUrlLocale = language === "zh" ? "zh" : "en";
export const optionUrl = `https://echarts.apache.org/${echartsUrlLocale}/option.html`;
export const examplesUrl = `https://echarts.apache.org/examples/${echartsUrlLocale}/index.html`;
export const xAxisTypeUrl = `${optionUrl}#xAxis.type`;
export const googleMapsApiUrl = `https://maps.googleapis.com/maps/api/js?v=3.exp`;
export const mapOptionUrl = `https://github.com/plainheart/echarts-extension-gmap`;
export const mapExamplesUrl = `https://codepen.io/plainheart/pen/VweLGbR`;