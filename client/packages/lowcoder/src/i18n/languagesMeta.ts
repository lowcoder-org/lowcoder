
import { es, ru } from "./locales";
import {MultiIcon} from "@lowcoder-ee/comps/comps/multiIconDisplay";
import {Flag_br, Flag_cn, Flag_de, Flag_es, Flag_gb, Flag_it, Flag_ru} from "icons";


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
export const initlanguageMeta = async () => {
  languagesMetadata = {
    en: {
      languageName: "English",
      flag: MultiIcon(Flag_gb)
    },
    zh: {
      languageName: "中文",
      flag: MultiIcon(Flag_cn)
    },
    de: {
      languageName: "Deutsch",
      flag: MultiIcon(Flag_de)
    },
    pt: {
      languageName: "Português",
      flag: MultiIcon(Flag_br)
    },
    it: {
      languageName: "Italiano",
      flag: MultiIcon(Flag_it)
    },
    es: {
      languageName: "Español",
      flag: MultiIcon(Flag_es)
    },
    ru: {
      languageName: "Русский",
      flag: MultiIcon(Flag_ru)
    },
  };
}