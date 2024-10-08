
import { es, ru } from "./locales";


// Define the structure for a single language's metadata
export interface LanguageMeta {
  languageName: string;
  flag: React.FC<React.SVGProps<SVGSVGElement>>;
}
export let languagesMetadata : LanguagesMetadata = {};
// Define the structure for the container of all language metadatas
export interface LanguagesMetadata {
  [key: string]: LanguageMeta;
}

let Flag_de:any = null;
let Flag_gb:any = null;
let Flag_it:any = null;
let Flag_cn:any = null;
let Flag_ru:any = null;
let Flag_es:any = null;
let Flag_br:any = null;
export const initlanguageMeta = async () => {
  Flag_de = await import("lowcoder-design").then(module => module.Flag_de);
  Flag_gb = await import("lowcoder-design").then(module => module.Flag_gb);
  Flag_it = await import("lowcoder-design").then(module => module.Flag_it);
  Flag_cn = await import("lowcoder-design").then(module => module.Flag_cn);
  Flag_ru = await import("lowcoder-design").then(module => module.Flag_ru);
  Flag_es = await import("lowcoder-design").then(module => module.Flag_es);
  Flag_br = await import("lowcoder-design").then(module => module.Flag_br);
  languagesMetadata = {
    en: {
      languageName: "English",
        flag: Flag_gb
    },
    zh: {
      languageName: "中文",
      flag: Flag_cn
    },
    de: {
      languageName: "Deutsch",
      flag: Flag_de
    },
    pt: {
      languageName: "Português",
      flag: Flag_br
    },
    it: {
      languageName: "Italiano",
      flag: Flag_it
    },
    es: {
      languageName: "Español",
      flag: Flag_es
    },
    ru: {
      languageName: "Русский",
      flag: Flag_ru
    },
  };
}
