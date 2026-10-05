import { ThemeDetail, ThemeType } from "api/commonSettingApi";
import { genQueryId } from "comps/utils/idGenerator";
import { trans } from "i18n";
import { saveDataAsFile } from "util/fileUtils";

export const THEME_EXPORT_VERSION = 1;
export const THEME_EXPORT_TYPE = "lowcoder-theme";

export interface ThemeExportPayload {
  version: number;
  type: typeof THEME_EXPORT_TYPE;
  theme: ThemeType;
}

function isThemeDetail(value: unknown): value is ThemeDetail {
  return typeof value === "object" && value !== null;
}

function isThemeType(value: unknown): value is ThemeType {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const theme = value as ThemeType;
  return typeof theme.name === "string" && isThemeDetail(theme.theme);
}

export function parseThemeImport(content: string): ThemeType {
  let data: unknown;
  try {
    data = JSON.parse(content);
  } catch {
    throw new Error(trans("theme.importParseError"));
  }

  if (typeof data !== "object" || data === null) {
    throw new Error(trans("theme.importFormatError"));
  }

  const payload = data as Record<string, unknown>;

  if (payload.type === THEME_EXPORT_TYPE && isThemeType(payload.theme)) {
    return payload.theme;
  }

  if (isThemeType(data)) {
    return data;
  }

  throw new Error(trans("theme.importFormatError"));
}

export function resolveUniqueThemeName(baseName: string, existingNames: Set<string>): string {
  const trimmed = baseName.trim();
  if (!trimmed) {
    throw new Error(trans("theme.importNameRequired"));
  }
  if (!existingNames.has(trimmed)) {
    return trimmed;
  }

  const importSuffix = trans("theme.importSuffix");
  let candidate = trimmed + importSuffix;
  if (!existingNames.has(candidate)) {
    return candidate;
  }

  let index = 1;
  while (existingNames.has(candidate + index)) {
    index += 1;
  }
  return candidate + index;
}

export function prepareImportedTheme(
  source: ThemeType,
  existingThemes: ThemeType[],
  fallbackName?: string
): ThemeType {
  const existingNames = new Set(existingThemes.map((theme) => theme.name));
  const name = resolveUniqueThemeName(
    source.name || fallbackName || trans("theme.importDefaultName"),
    existingNames
  );

  return {
    name,
    id: genQueryId(),
    updateTime: Date.now(),
    theme: source.theme,
  };
}

export function exportThemeAsJSONFile(theme: ThemeType) {
  const exportObj: ThemeExportPayload = {
    version: THEME_EXPORT_VERSION,
    type: THEME_EXPORT_TYPE,
    theme,
  };
  void saveDataAsFile({
    data: exportObj,
    filename: `${theme.name}.json`,
    fileType: "json",
  });
}

export function readThemeFile(file: File): Promise<ThemeType> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsText(file, "UTF-8");
    reader.onload = (event) => {
      try {
        if (!event.target?.result) {
          throw new Error(trans("theme.importFileError"));
        }
        resolve(parseThemeImport(event.target.result.toString()));
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error(trans("theme.importFileError")));
  });
}
