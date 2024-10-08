import { getI18nObjects, Translator } from "lowcoder-core";
import * as localeData from "./locales";
import { I18nObjects } from "./locales/types";
import {initlanguageMeta, languagesMetadata} from "./languagesMeta";
import { ReactNode } from "react";
import { getLanguage } from "util/editor"

type transType = (key: any, variables?: any) => string;
type transToNodeType = (key: any, variables?: any) => ReactNode;

let trans: transType;
let transToNode: transToNodeType;
let language: string = getLanguage();
export let languageList: any[];

export let i18nObjs : I18nObjects;
export const initTranslator = async (langs? : string) => {
  const lang = langs || language;
  const objFileName = (REACT_APP_LANGUAGES || language) + "Obj";
  let langJson = await (localeData as any)[lang]()
  let langObjJson = await (localeData as any)[objFileName]()
  langJson = {[lang]: langJson, [(REACT_APP_LANGUAGES || language) + "Obj"]: langObjJson}
  await initlanguageMeta();
  i18nObjs = getI18nObjects<I18nObjects>(langJson, REACT_APP_LANGUAGES || language);
  languageList = Object.keys(languagesMetadata).map(code => ({
    languageCode: code,
    languageName: languagesMetadata[code].languageName,
    flag: languagesMetadata[code].flag
  }));
  const translator =  new Translator<typeof langJson>(
      langJson,
      REACT_APP_LANGUAGES,
      [lang || language]
  );

  language = translator.language;
  transToNode = (key: any, variables?: any) => translator.transToNode?.(key, variables);
  trans = (key: any, variables?: any) => translator.trans?.(key, variables);
}

export { language, trans, transToNode };
