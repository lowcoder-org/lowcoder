export const viewMode = () =>  REACT_APP_VIEW_MODE;
export const viewModeTriple = () => viewMode() === "view" ? "view" : window.location.href.includes("edit") ? "edit" : "admin";
export const getLanguage = (): string => {
    return localStorage.getItem('lowcoder_uiLanguage') || 'en';
}