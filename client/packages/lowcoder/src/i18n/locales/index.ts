import { viewModeTriple } from "util/editor"
export const en = async ():Promise<object> => await import(viewModeTriple() === "edit" ? "./enEditor" : viewModeTriple() === "view" ? "./enViewer" : "./en").then(module => module.en);
export const de = async ():Promise<object> => await import(viewModeTriple() === "edit" ? "./deEditor" : viewModeTriple() === "view" ? "./deViewer" : "./de").then(module => module.de);
export const it = async ():Promise<object> => await import(viewModeTriple() === "edit" ? "./itEditor" : viewModeTriple() === "view" ? "./itViewer" : "./it").then(module => module.it);
export const pt = async ():Promise<object> => await import(viewModeTriple() === "edit" ? "./ptEditor" : viewModeTriple() === "view" ? "./ptViewer" : "./pt").then(module => module.pt);
export const es = async ():Promise<object> => await import(viewModeTriple() === "edit" ? "./esEditor" : viewModeTriple() === "view" ? "./esViewer" : "./es").then(module => module.es);
export const zh = async ():Promise<object> => await import(viewModeTriple() === "edit" ? "./zhEditor" : viewModeTriple() === "view" ? "./zhViewer" : "./zh").then(module => module.zh);
export const ru = async ():Promise<object> => await import(viewModeTriple() === "edit" ? "./ruEditor" : viewModeTriple() === "view" ? "./ruViewer" : "./ru").then(module => module.ru);


export const enObj = async ():Promise<object | undefined> => await import("./enObj").then(module => (module.enObj));
export const deObj = async ():Promise<object | undefined> => await import("./deObj").then(module => (module.deObj));
export const itObj = async ():Promise<object | undefined> => await import("./itObj").then(module => (module.itObj));
export const ptObj = async ():Promise<object | undefined> => await import("./ptObj").then(module => (module.ptObj));
export const esObj = async ():Promise<object | undefined> => await import("./esObj").then(module => (module.esObj));
export const zhObj = async ():Promise<object | undefined> => await import("./zhObj").then(module => (module.zhObj));
export const ruObj = async ():Promise<object | undefined> => await import("./ruObj").then(module => (module.ruObj));
