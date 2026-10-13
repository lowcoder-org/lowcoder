import {
  AppTypeEnum,
  ApplicationCategoriesEnum,
} from "constants/applicationConstants";

export type MarketplaceSource = "community" | "local";

// Marketplace responses are deliberately smaller than an editable ApplicationMeta.
export interface MarketplaceApp {
  applicationId: string;
  applicationType: AppTypeEnum;
  applicationStatus?: string;
  name: string;
  title?: string;
  description?: string;
  category?: string;
  image?: string; // Legacy API name for the app icon, not a screenshot.
  icon?: string;
  creatorEmail?: string; // Legacy API name for the creator's display name.
  createBy: string;
  createAt: number;
  orgName?: string;
}

export const appTitle = (app: MarketplaceApp) => app.title?.trim() || app.name;
export const appCreator = (app: MarketplaceApp) =>
  app.creatorEmail?.trim() || "";
export const appCategory = (app: MarketplaceApp) => {
  const value = app.category?.trim() || "";
  return (
    ApplicationCategoriesEnum[
      value as keyof typeof ApplicationCategoriesEnum
    ] || value
  );
};

export function filterMarketplaceApps(
  apps: MarketplaceApp[],
  filters: {
    query: string;
    category: string;
    type: string;
    creator: string;
    sort: string;
  },
) {
  const words = filters.query
    .trim()
    .toLocaleLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  return apps
    .filter((app) => {
      const text = [
        appTitle(app),
        app.name,
        app.description,
        appCategory(app),
        appCreator(app),
        app.orgName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase();
      return (
        words.every((word) => text.includes(word)) &&
        (!filters.category || appCategory(app) === filters.category) &&
        (!filters.type || String(app.applicationType) === filters.type) &&
        (!filters.creator || app.createBy === filters.creator)
      );
    })
    .sort(
      (a, b) =>
        (filters.sort === "newest"
          ? (b.createAt || 0) - (a.createAt || 0)
          : 0) ||
        appTitle(a).localeCompare(appTitle(b)) ||
        a.applicationId.localeCompare(b.applicationId),
    );
}

export function marketplaceCategories(apps: MarketplaceApp[]) {
  const counts = new Map<string, number>();
  apps.forEach((app) => {
    const category = appCategory(app);
    if (category) counts.set(category, (counts.get(category) || 0) + 1);
  });
  return Array.from(counts, ([value, count]) => ({ value, count })).sort(
    (a, b) => a.value.localeCompare(b.value),
  );
}

export function marketplaceAppUrl(
  appId: string,
  source: MarketplaceSource,
  communityOrigin: string,
) {
  const path = `/apps/${encodeURIComponent(appId)}/view_marketplace`;
  return source === "local"
    ? path
    : `${communityOrigin.replace(/\/$/, "")}${path}`;
}
