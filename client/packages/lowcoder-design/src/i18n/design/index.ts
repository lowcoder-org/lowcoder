import { getI18nObjects, Translator } from "lowcoder-core";
import * as localeData from "./locales";
import { ReactNode } from "react";

type transType = (key: any, variables?: any) => string;
type transToNodeType = (key: any, variables?: any) => ReactNode;

let trans: transType;
let transToNode: transToNodeType;
let language = 'en';

export const initTranslator = async (lang?: string) => {
    let langJson = await (localeData as any)[lang || 'en']();
    langJson = {[lang || 'en']: langJson}
    const translator =  new Translator<typeof langJson>(
        langJson,
        REACT_APP_LANGUAGES,
        [lang || 'en']
    );

    language = translator.language;
    transToNode = (key: any, variables?: any) => translator.transToNode?.(key, variables);
    trans = (key: any, variables?: any) => translator.trans?.(key, variables);
}

const langJson = await (localeData as any)[REACT_APP_LANGUAGES || 'en']();

await initTranslator();

export { language, trans, transToNode };
