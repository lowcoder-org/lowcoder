import { getI18nObjects, Translator } from "lowcoder-core";
import * as localeData from "./locales";
// import { I18nObjects } from "./locales/types";
// import { languagesMetadata } from "./languagesMeta";
import { ReactNode } from "react";
// import { getLanguage } from "util/editor"
// import {string} from "sql-formatter/lib/src/lexer/regexFactory";

type transType = (key: any, variables?: any) => string;
type transToNodeType = (key: any, variables?: any) => ReactNode;

let trans: transType;
let transToNode: transToNodeType;
let language: string = localStorage.getItem('lowcoder_uiLanguage') || 'en' ;

export const initTranslator = async () => {
    const lang = localStorage.getItem('lowcoder_uiLanguage');
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



await initTranslator();

export { language, trans, transToNode };
