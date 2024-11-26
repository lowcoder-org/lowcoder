type ApplicationType = {
    [key: number]: string; // This allows numeric indexing
};

// Define the const with explicit type
export const ApplicationPaginationType: ApplicationType = {
    0: "",
    1: "APPLICATION",
    2: "MODULE",
    3: "NAVLAYOUT",
    4: "FOLDER",
    6: "MOBILETABLAYOUT",
    7: "NAVIGATION",
};