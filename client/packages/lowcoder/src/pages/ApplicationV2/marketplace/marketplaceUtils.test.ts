import { AppTypeEnum } from "constants/applicationConstants";
import {
  appCategory,
  filterMarketplaceApps,
  MarketplaceApp,
  marketplaceAppUrl,
  marketplaceCategories,
} from "./marketplaceUtils";
const apps: MarketplaceApp[] = [
  {
    applicationId: "1",
    applicationType: AppTypeEnum.Application,
    name: "Internal name",
    title: "Room Planner",
    description: "Plan meeting capacity",
    category: "BUSINESS",
    creatorEmail: "Jane Smith",
    createBy: "jane",
    createAt: 1,
  },
  {
    applicationId: "2",
    applicationType: AppTypeEnum.Module,
    name: "Order module",
    category: "Business",
    creatorEmail: "Alex",
    createBy: "alex",
    createAt: 3,
  },
  {
    applicationId: "3",
    applicationType: AppTypeEnum.Application,
    name: "Weather",
    createBy: "jane",
    createAt: 2,
  },
];
const filters = {
  query: "",
  category: "",
  type: "",
  creator: "",
  sort: "name",
};
test("searches published title, description and displayed creator together", () => {
  expect(
    filterMarketplaceApps(apps, { ...filters, query: "meeting Jane" }).map(
      (a) => a.applicationId,
    ),
  ).toEqual(["1"]);
  expect(
    filterMarketplaceApps(apps, { ...filters, query: "room" }),
  ).toHaveLength(1);
  expect(
    filterMarketplaceApps(apps, { ...filters, query: "   " }),
  ).toHaveLength(3);
});
test("normalizes legacy category codes without splitting category counts", () => {
  expect(appCategory(apps[0])).toBe("Business");
  expect(marketplaceCategories(apps)).toEqual([
    { value: "Business", count: 2 },
  ]);
  expect(
    filterMarketplaceApps(apps, {
      ...filters,
      category: "Business",
      type: "2",
    }).map((a) => a.applicationId),
  ).toEqual(["2"]);
});
test("creator filter and sorting preserve all entries and do not mutate the feed", () => {
  expect(
    filterMarketplaceApps(apps, {
      ...filters,
      creator: "jane",
      sort: "newest",
    }).map((a) => a.applicationId),
  ).toEqual(["3", "1"]);
  expect(apps.map((a) => a.applicationId)).toEqual(["1", "2", "3"]);
});
test("local apps keep their local viewer and community apps use the frontend origin", () => {
  expect(marketplaceAppUrl("1", "local", "https://app.lowcoder.cloud")).toBe(
    "/apps/1/view_marketplace",
  );
  expect(
    marketplaceAppUrl("1", "community", "https://app.lowcoder.cloud"),
  ).toBe("https://app.lowcoder.cloud/apps/1/view_marketplace");
});
