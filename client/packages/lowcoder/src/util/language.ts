import {viewModeTriple} from "@lowcoder-ee/util/editor";

interface LangJsonType {
    [key: string]: any;
}

export const setLanguageJson = (lang : string, langObj: any) => {
    localStorage.setItem(`lowcoder_language_json_${lang}_${viewModeTriple()}`, JSON.stringify(langObj));
}

export const setLanguageObjJson = (lang : string, langObj: any) => {
    localStorage.setItem(`lowcoder_language_obj_json_${lang}_${viewModeTriple()}`, JSON.stringify(langObj));
}

export const getLanguageJson = (lang: string): LangJsonType | null => {
    const item = localStorage.getItem(`lowcoder_language_json_${lang}_${viewModeTriple()}`);

    // Check if the item is null
    if (item === null) {
        return null;
    }
    try {
        return JSON.parse(item)[lang];
    } catch {
        throw new Error("Stored data is not a valid JSON object");
    }
};

export const getLanguageObjJson = (lang: string): LangJsonType | null => {
    const item = localStorage.getItem(`lowcoder_language_obj_json_${lang}_${viewModeTriple()}`);

    // Check if the item is null
    if (item === null) {
        return null;
    }
    try {
        return JSON.parse(item)[lang];
    } catch {
        throw new Error("Stored data is not a valid JSON object");
    }
};