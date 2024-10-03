// file examples: en, enGB, zh, zhHK
// fallback example: current locale is zh-HK, fallback order is zhHK => zh => en
export const de = async ():Promise<object> => await import("./de").then(module => (module.de));
export const en = async ():Promise<object> => await import("./en").then(module => (module.en));
export const it = async ():Promise<object> => await import("./it").then(module => (module.it));
export const pt = async ():Promise<object> => await import("./pt").then(module => (module.pt));
export const es = async ():Promise<object> => await import("./es").then(module => (module.es));
export const zh = async ():Promise<object> => await import("./zh").then(module => (module.zh));
export const ru = async ():Promise<object> => await import("./ru").then(module => (module.ru));

export const enObj = async ():Promise<object> => await import("./enObj").then(module => (module.enObj));
export const deObj = async ():Promise<object | undefined> => await import("./deObj").then(module => (module.deObj));
export const itObj = async ():Promise<object> => await import("./itObj").then(module => (module.itObj));
export const zhObj = async ():Promise<object | undefined> => await import("./zhObj").then(module => (module.zhObj));