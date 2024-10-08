
import {  Translator } from "lowcoder-core";
import * as localeData from "./locales";
import { ReactNode } from "react";
import {getLanguage} from "lowcoder/src/util/editor";

type transType = (key: any, variables?: any) => string;
type transToNodeType = (key: any, variables?: any) => ReactNode;

let trans: transType;
let transToNode: transToNodeType;
const availableLanguages = ['en', 'zh', 'de', 'pt'];
let language: string = getLanguage() || 'en' ;

export const initTranslator = async (lang?: string) => {
    let langJson = await (localeData as any)[lang || availableLanguages.includes(language) ? language : 'en']();
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

export { language, trans, transToNode };
