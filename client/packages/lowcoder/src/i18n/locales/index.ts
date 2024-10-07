import { isEditor } from "util/editor"
export const en = async ():Promise<object> => await import(isEditor() === "edit" ? "./enEditor" : isEditor() === "view" ? "./enViewer" : "./en").then(module => module.en);
export const de = async ():Promise<object> => await import(isEditor() === "edit" ? "./deEditor" : isEditor() === "view" ? "./deViewer" : "./de").then(module => module.de);
export const it = async ():Promise<object> => await import(isEditor() === "edit" ? "./itEditor" : isEditor() === "view" ? "./itViewer" : "./it").then(module => module.it);
export const pt = async ():Promise<object> => await import(isEditor() === "edit" ? "./ptEditor" : isEditor() === "view" ? "./ptViewer" : "./pt").then(module => module.pt);
export const es = async ():Promise<object> => await import(isEditor() === "edit" ? "./esEditor" : isEditor() === "view" ? "./esViewer" : "./es").then(module => module.es);
export const zh = async ():Promise<object> => await import(isEditor() === "edit" ? "./zhEditor" : isEditor() === "view" ? "./zhViewer" : "./zh").then(module => module.zh);
export const ru = async ():Promise<object> => await import(isEditor() === "edit" ? "./ruEditor" : isEditor() === "view" ? "./ruViewer" : "./ru").then(module => module.ru);


export const enObj = async ():Promise<object> => await import("./enObj").then(module => (module.enObj));
export const deObj = async ():Promise<object | undefined> => await import("./deObj").then(module => (module.deObj));
export const itObj = async ():Promise<object> => await import("./itObj").then(module => (module.itObj));
export const zhObj = async ():Promise<object | undefined> => await import("./zhObj").then(module => (module.zhObj));
