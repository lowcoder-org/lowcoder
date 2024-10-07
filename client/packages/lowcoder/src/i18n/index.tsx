import { getI18nObjects, Translator } from "lowcoder-core";
import * as localeData from "./locales";
import { I18nObjects } from "./locales/types";
import { languagesMetadata } from "./languagesMeta";
import { ReactNode } from "react";
import { getLanguage } from "util/editor"

type transType = (key: any, variables?: any) => string;
type transToNodeType = (key: any, variables?: any) => ReactNode;

let trans: transType;
let transToNode: transToNodeType;
let language: string = getLanguage();

export const initTranslator = async (langs : string) => {
  const lang = langs;
  let langJson = await (localeData as any)[lang || language]();
  langJson = {[lang || language]: langJson}
  const translator =  new Translator<typeof langJson>(
      langJson,
      REACT_APP_LANGUAGES,
      [lang || language]
  );

  language = translator.language;
  transToNode = (key: any, variables?: any) => translator.transToNode?.(key, variables);
  trans = (key: any, variables?: any) => translator.trans?.(key, variables);
}

const langJson = await (localeData as any)[REACT_APP_LANGUAGES || language]();
export const i18nObjs = getI18nObjects<I18nObjects>(langJson, REACT_APP_LANGUAGES || language);

export const languageList = Object.keys(languagesMetadata).map(code => ({
  languageCode: code,
  languageName: languagesMetadata[code].languageName,
  flag: languagesMetadata[code].flag
}));

await initTranslator(getLanguage());

export { language, trans, transToNode };
