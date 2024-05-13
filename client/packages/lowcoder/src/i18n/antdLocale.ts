import en_US from "antd/es/locale/en_US";
import zh_CN from "antd/es/locale/zh_CN";
import zh_HK from "antd/es/locale/zh_HK";
import zh_TW from "antd/es/locale/zh_TW";
import es_ES from "antd/es/locale/es_ES";
import fr_CA from "antd/es/locale/fr_CA";
import fr_FR from "antd/es/locale/fr_FR";
import de_DE from "antd/es/locale/de_DE";
import it_IT from "antd/es/locale/it_IT";
import ar_EG from "antd/es/locale/ar_EG";
import th_TH from "antd/es/locale/th_TH";
import vi_VN from "antd/es/locale/vi_VN";
import ms_MY from "antd/es/locale/ms_MY";
import id_ID from "antd/es/locale/id_ID";
import hi_IN from "antd/es/locale/hi_IN";
import ta_IN from "antd/es/locale/ta_IN";
import kn_IN from "antd/es/locale/kn_IN";
import ml_IN from "antd/es/locale/ml_IN";
import ru_RU from "antd/es/locale/ru_RU";
import pl_PL from "antd/es/locale/pl_PL";
import cs_CZ from "antd/es/locale/cs_CZ";
import uk_UA from "antd/es/locale/uk_UA";
import bg_BG from "antd/es/locale/bg_BG";
import sr_RS from "antd/es/locale/sr_RS";
import hr_HR from "antd/es/locale/hr_HR";
import sk_SK from "antd/es/locale/sk_SK";
import sl_SI from "antd/es/locale/sl_SI";
import mk_MK from "antd/es/locale/mk_MK";
import pt_PT from "antd/es/locale/pt_PT";

import { getValueByLocale } from "lowcoder-core";

export function getAntdLocale(language?: string) {

  if (language) {
    return selectAntdLocale(language, "");
  }
  return getValueByLocale(en_US, (locale) => selectAntdLocale(locale.language, locale.region));
}

function selectAntdLocale(language: string, region?: string) {
  
  switch (language) {
    case "zh":
      switch (region) {
        case "HK":
          return zh_HK;
        case "TW":
          return zh_TW;
        default:
          return zh_CN;
      }
    case "es":
      switch (region) {
        case "ES":
          return es_ES;
        default:
          return es_ES; 
      }
    case "pt":
      switch (region) {
        case "PT":
          return pt_PT;
        default:
          return pt_PT; 
      }
    case "fr":
      switch (region) {
        case "CA":
          return fr_CA;
        case "FR":
          return fr_FR;
        default:
          return fr_FR; 
      }
    case "it":
      return it_IT;
    case "de":
      switch (region) {
        case "DE":
          return de_DE;
        default:
          return de_DE; 
      }
    case "ru": // Russian
      return ru_RU; 
    case "pl": // Polish
      return pl_PL; 
    case "cs": // Czech
      return cs_CZ; 
    case "uk": // Ukrainian
      return uk_UA; 
    case "bg": // Bulgarian
      return bg_BG; 
    case "sr": // Serbian
      return sr_RS;
    case "hr": // Croatian
      return hr_HR; 
    case "sk": // Slovak
      return sk_SK; 
    case "sl": // Slovenian
      return sl_SI; 
    case "mk": // Macedonian
      return mk_MK; 
    case "ar":
      switch (region) {
        case "SA":
          return ar_EG;
        case "EG":
          return ar_EG;
        default:
          return ar_EG;
      }
    case "th": // Thai
      return th_TH;
    case "vi": 
      return vi_VN; // Vietnamese (Vietnam)
    case "ms": 
      return ms_MY; // Malay (Malaysia)
    case "id": 
      return id_ID; // Indonesian (Indonesia)
    case "hi": // Hindi
      return hi_IN; // Hindi (India)
    case "ta": // Tamil
      return ta_IN; // Tamil (India)
    case "kn": // Kannada
      return kn_IN; // Kannada (India)
    case "ml": // Malayalam
      return ml_IN; // Malayalam (India)

    // Additional languages would follow this pattern
    default:
      return en_US; // Fallback to English (US) if language is not recognized
  }
}
