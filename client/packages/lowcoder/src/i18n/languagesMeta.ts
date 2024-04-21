// Define the structure for a single language's metadata
export interface LanguageMeta {
    languageName: string;
    flag: string;
  }
  
  // Define the structure for the container of all language metadatas
  export interface LanguagesMetadata {
    [key: string]: LanguageMeta;
  }
  
  // Example metadata object
  export const languagesMetadata: LanguagesMetadata = {
    en: {
      languageName: "English",
      flag: "/flags/en.png"
    },
    de: {
      languageName: "Deutsch",
      flag: "/flags/de.png"
    },
    it: {
      languageName: "Italiano",
      flag: "/flags/it.png"
    },
    zh: {
      languageName: "中文",
      flag: "/flags/zh.png"
    }
  };
  