import { viewMode } from "util/editor"
export const en = async ():Promise<object> => await import(viewMode() === "edit" ? "./enEditor" : viewMode() === "view" ? "./enViewer" : "./en").then(module => module.en);
export const de = async ():Promise<object> => await import(viewMode() === "edit" ? "./deEditor" : viewMode() === "view" ? "./deViewer" : "./de").then(module => module.de);
export const it = async ():Promise<object> => await import(viewMode() === "edit" ? "./itEditor" : viewMode() === "view" ? "./itViewer" : "./it").then(module => module.it);
export const pt = async ():Promise<object> => await import(viewMode() === "edit" ? "./ptEditor" : viewMode() === "view" ? "./ptViewer" : "./pt").then(module => module.pt);
export const es = async ():Promise<object> => await import(viewMode() === "edit" ? "./esEditor" : viewMode() === "view" ? "./esViewer" : "./es").then(module => module.es);
export const zh = async ():Promise<object> => await import(viewMode() === "edit" ? "./zhEditor" : viewMode() === "view" ? "./zhViewer" : "./zh").then(module => module.zh);
export const ru = async ():Promise<object> => await import(viewMode() === "edit" ? "./ruEditor" : viewMode() === "view" ? "./ruViewer" : "./ru").then(module => module.ru);


export const enObj = async ():Promise<object | undefined> => await import("./enObj").then(module => (module.enObj));
export const deObj = async ():Promise<object | undefined> => await import("./deObj").then(module => (module.deObj));
export const itObj = async ():Promise<object | undefined> => await import("./itObj").then(module => (module.itObj));
export const ptObj = async ():Promise<object | undefined> => await import("./ptObj").then(module => (module.ptObj));
export const esObj = async ():Promise<object | undefined> => await import("./esObj").then(module => (module.esObj));
export const zhObj = async ():Promise<object | undefined> => await import("./zhObj").then(module => (module.zhObj));
export const ruObj = async ():Promise<object | undefined> => await import("./ruObj").then(module => (module.ruObj));
