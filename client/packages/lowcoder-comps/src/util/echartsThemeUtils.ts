import { i18n } from "lowcoder-core";
import { styleWrapper } from "./styleWrapper";

const AXIS_THEME_KEY: Record<string, string> = {
  value: "valueAxis",
  category: "categoryAxis",
  time: "timeAxis",
  log: "logAxis",
};

/** Workspace theme JSON from Settings → Themes → eCharts Definition */
export type EChartsThemeJson = Record<string, unknown>;

export function getThemeAxisDefaults(theme: EChartsThemeJson | undefined, axisType?: string) {
  const key = AXIS_THEME_KEY[axisType || "value"] || "valueAxis";
  return (theme?.[key] as Record<string, unknown> | undefined) ?? {};
}

function createCompactAxisFormatter() {
  const numberFormat = new Intl.NumberFormat(i18n.locales, { notation: "compact" });
  return (value: string | number) =>
    typeof value === "number" ? numberFormat.format(value) : String(value);
}

function isValueOrLogAxis(axisType?: string) {
  return axisType === "value" || axisType === "log";
}

/**
 * Merge axisLabel in priority order:
 * 1. Workspace theme (eCharts Definition)
 * 2. Component layout (rotate, interval, etc. from calcXYConfig)
 * 3. Per-chart Properties panel styles (xAxisStyle / yAxisStyle)
 * 4. formatter: user → theme → compact fallback (value/log only)
 */
export function mergeAxisLabel(
  theme: EChartsThemeJson | undefined,
  axisType: string | undefined,
  axisConfigAxisLabel: Record<string, unknown> | undefined,
  componentStyle: Record<string, unknown> | undefined,
  defaultFontSize = 11
) {
  const themeAxisLabel = (getThemeAxisDefaults(theme, axisType).axisLabel ?? {}) as Record<
    string,
    unknown
  >;
  const { formatter: userFormatter, ...layout } = axisConfigAxisLabel ?? {};

  const axisLabel: Record<string, unknown> = {
    ...themeAxisLabel,
    ...layout,
    ...styleWrapper(
      componentStyle,
      undefined,
      defaultFontSize,
      (themeAxisLabel.color as string | undefined) ?? "#000000"
    ),
  };

  if (userFormatter) {
    axisLabel.formatter = userFormatter;
  } else if (axisLabel.formatter == null && isValueOrLogAxis(axisType)) {
    axisLabel.formatter = createCompactAxisFormatter();
  }

  return axisLabel;
}

/**
 * Build a cartesian xAxis/yAxis option from:
 * - component axis config (type, name, data, layout from calcXYConfig)
 * - per-chart Properties panel label styles
 * - formatter priority (user > theme > compact fallback)
 *
 * Note: axisLine, splitLine, axisTick, etc. from the workspace theme are
 * applied automatically by ECharts via the `theme` prop on ReactECharts.
 * We only handle axisLabel here because styleWrapper needs the theme color
 * default, and the formatter priority logic is Lowcoder-specific.
 */
export function mergeCartesianAxis(
  theme: EChartsThemeJson | undefined,
  axisType: string | undefined,
  axisConfig: Record<string, unknown>,
  componentStyle: Record<string, unknown> | undefined,
  defaultFontSize = 11,
  extra: Record<string, unknown> = {}
) {
  const { axisLabel: configAxisLabel, ...axisConfigRest } = axisConfig;
  return {
    ...axisConfigRest,
    axisLabel: mergeAxisLabel(theme, axisType, configAxisLabel as Record<string, unknown>, componentStyle, defaultFontSize),
    ...extra,
  };
}
