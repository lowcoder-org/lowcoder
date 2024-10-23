export const viewMode = () => window.location.href.includes("edit") ? "edit" : window.location.href.includes("view") ? "view" : "admin"
export const getLanguage = (): string => {
    return localStorage.getItem('lowcoder_uiLanguage') || 'en';
}