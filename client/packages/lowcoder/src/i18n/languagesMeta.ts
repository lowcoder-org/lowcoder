import {
    Flag_de, 
    Flag_gb, 
    Flag_it, 
    Flag_cn
  } from "lowcoder-design";

// Define the structure for a single language's metadata
export interface LanguageMeta {
    languageName: string;
    flag: React.FC<React.SVGProps<SVGSVGElement>>;
  }
  
  // Define the structure for the container of all language metadatas
  export interface LanguagesMetadata {
    [key: string]: LanguageMeta;
  }
  
  // Example metadata object
  export const languagesMetadata: LanguagesMetadata = {
    en: {
      languageName: "English",
      flag: Flag_gb
    },
    de: {
      languageName: "Deutsch",
      flag: Flag_de
    },
    it: {
      languageName: "Italiano",
      flag: Flag_it
    },
    zh: {
      languageName: "中文",
      flag: Flag_cn
    }
  };
  