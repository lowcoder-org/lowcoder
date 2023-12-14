import { en } from "./en";
import { I18n } from "../../../common/i18n";

export default function getI18nTranslator(languages: string[]) {
  return new I18n<typeof en>({ en }, languages);
}

export type MinioI18nTranslator = ReturnType<typeof getI18nTranslator>;
