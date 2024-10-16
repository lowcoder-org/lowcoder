
export const en = async () : Promise<Object> => await import("./en").then(module => module.en);
export const zh = async () : Promise<Object> => await import("./zh").then(module => module.zh);
export const de = async () : Promise<Object> => await import("./de").then(module => module.de);
export const pt = async () : Promise<Object> => await import("./pt").then(module => module.pt);
