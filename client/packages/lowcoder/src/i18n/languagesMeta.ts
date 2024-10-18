
import { es, ru } from "./locales";
import {MultiIcon} from "@lowcoder-ee/comps/comps/multiIconDisplay";


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
      flag: MultiIcon("/icon:svg/Flag_gb")
    },
    zh: {
      languageName: "中文",
      flag: MultiIcon("/icon:svg/Flag_cn")
    },
    de: {
      languageName: "Deutsch",
      flag: MultiIcon("/icon:svg/Flag_de")
    },
    pt: {
      languageName: "Português",
      flag: MultiIcon("/icon:svg/Flag_br")
    },
    it: {
      languageName: "Italiano",
      flag: MultiIcon("/icon:svg/Flag_it")
    },
    es: {
      languageName: "Español",
      flag: MultiIcon("/icon:svg/Flag_es")
    },
    ru: {
      languageName: "Русский",
      flag: MultiIcon("/icon:svg/Flag_ru")
    },
  };
}