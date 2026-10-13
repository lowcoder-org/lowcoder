import { colord } from "colord";
import { getAdminAppearance } from "./adminAppearance";

describe("Admin branding", () => {
  it("uses Lowcoder defaults when no company brand is configured", () => {
    const appearance = getAdminAppearance();
    expect(appearance.colors.accent).toBe("#8050a0");
    expect(appearance.fontFamily).toContain("Lowcoder Ubuntu");
    expect(getAdminAppearance({ mainBrandingColor: "invalid" })).toEqual(appearance);
  });

  it.each(["#007f68", "#2356c4", "#ffdc00", "#888888"])("carries %s into controls, links and page decoration", (mainBrandingColor) => {
    const { colors, theme, variables } = getAdminAppearance({ mainBrandingColor });
    expect(theme.token?.colorPrimary).toBe(mainBrandingColor);
    expect(variables["--admin-accent"]).toBe(mainBrandingColor);
    expect(colors.tint).not.toBe(getAdminAppearance().colors.tint);
    expect(theme.components?.Menu?.itemSelectedColor).toBe(colors.link);
    expect(theme.components?.Table?.rowHoverBg).toBe(colors.hover);
    expect(colord(colors.link).contrast("#fff")).toBeGreaterThanOrEqual(4.5);
    expect(colord(colors.onAccent).contrast(mainBrandingColor)).toBeGreaterThanOrEqual(4.5);
    expect(colord(colors.onAccent).contrast(colors.accentHover)).toBeGreaterThanOrEqual(4.5);
    expect(colord(colors.linkHover).contrast("#fff")).toBeGreaterThanOrEqual(4.5);
  });

  it("honors every explicit Admin navigation color independently of the accent", () => {
    const { colors } = getAdminAppearance({
      mainBrandingColor: "#007f68", appHeaderColor: "#ffffff",
      adminSidebarColor: "#101928", adminSidebarFontColor: "#eeeeee",
      adminSidebarActiveBgColor: "#ffdc00", adminSidebarActiveFontColor: "#222222",
    });
    expect(colors).toMatchObject({
      accent: "#007f68", header: "#ffffff", headerText: "#000000",
      sidebar: "#101928", sidebarText: "#eeeeee",
      sidebarActive: "#ffdc00", sidebarActiveText: "#222222",
    });
  });

  it.each(["Open+Sans", "Playfair+Display"])("normalizes the saved font %s", (font) => {
    const { fontFamily, theme } = getAdminAppearance({ font });
    expect(fontFamily).toBe(`"${font.replace(/\+/g, " ")}", sans-serif`);
    expect(theme.token?.fontFamily).toBe(fontFamily);
  });
});
