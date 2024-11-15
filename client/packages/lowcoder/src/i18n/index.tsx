import { getI18nObjects, Translator } from "lowcoder-core";
import * as localeData from "./locales";
import { I18nObjects } from "./locales/types";
import {initlanguageMeta, languagesMetadata} from "./languagesMeta";
import { ReactNode } from "react";
import { getLanguage } from "util/editor"
import {getLanguageJson, getLanguageObjJson, setLanguageJson, setLanguageObjJson} from "@lowcoder-ee/util/language";

type transType = (key: any, variables?: any) => string;
type transToNodeType = (key: any, variables?: any) => ReactNode;

let trans: transType;
let transToNode: transToNodeType;
let language: string = getLanguage();
export let languageList: any[];
export let i18nObjs : I18nObjects;
let langJson : object;

export const initTranslator = async (langs? : string) => {
  const lang = langs || language;
  const objFileName = (REACT_APP_LANGUAGES || language) + "Obj";
  if (!getLanguageJson(lang)) {
    langJson = await (localeData as any)[lang]();
    let langObjJson = await (localeData as any)[objFileName]();
    setLanguageJson(lang, { [lang] : langJson });
    setLanguageObjJson(objFileName, { [objFileName]: langObjJson });
    langJson = {[lang]: langJson, [objFileName]: langObjJson}
  }
  else {
    const langJson2  = getLanguageJson(lang);
    const langObjJson  = getLanguageObjJson(objFileName);
    langJson = {[lang]: langJson2, [objFileName]: langObjJson}
  }
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
  transToNode = (key: any, variables?: any) => translator.transToNode?.(key as never, variables);
  trans = (key: any, variables?: any) => translator.trans?.(key as never, variables);
}

export { language, trans, transToNode };
