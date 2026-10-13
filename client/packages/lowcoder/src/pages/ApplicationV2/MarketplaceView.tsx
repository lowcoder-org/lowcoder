import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Button,
  Input,
  Pagination,
  Select,
  Skeleton,
  Tooltip,
} from "antd";
import {
  AppstoreOutlined,
  ArrowLeftOutlined,
  ArrowUpOutlined,
  GlobalOutlined,
  LinkOutlined,
  SearchOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { Link, useHistory, useLocation, useRouteMatch } from "react-router-dom";
import { Helmet } from "react-helmet";
import axios from "axios";
import copy from "copy-to-clipboard";
import { useSelector } from "react-redux";
import { getUser } from "redux/selectors/usersSelectors";
import ApplicationApi from "api/applicationApi";
import { trans } from "i18n";
import { APPLICATION_MARKETPLACE_URL } from "constants/routesURL";
import { AppTypeEnum } from "constants/applicationConstants";
import { HomeResInfo } from "util/homeResUtils";
import { HomeResTypeEnum } from "types/homeRes";
import { messageInstance } from "lowcoder-design/src/components/GlobalInstances";
import { MarketplacePreview } from "./marketplace/MarketplacePreview";
import {
  MarketplaceGrid,
  MarketplaceShell,
} from "./marketplace/marketplaceStyles";
import {
  appCategory,
  appCreator,
  appTitle,
  filterMarketplaceApps,
  MarketplaceApp,
  marketplaceAppUrl,
  marketplaceCategories,
  MarketplaceSource,
} from "./marketplace/marketplaceUtils";

type Feed = { apps: MarketplaceApp[]; loading: boolean; error: boolean };
const initialFeed: Feed = { apps: [], loading: true, error: false };
const typeName = (app: MarketplaceApp) =>
  HomeResInfo[app.applicationType as unknown as HomeResTypeEnum]?.name ||
  trans("home.app");
const creatorName = (app: MarketplaceApp) =>
  appCreator(app) || trans("marketplace.communityCreator");
const initials = (name: string) =>
  name
    .trim()
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

export function MarketplaceView() {
  const workspaceId = useSelector(getUser).currentOrgId;
  const history = useHistory();
  const location = useLocation();
  const detail = useRouteMatch<{ source: string; appId: string }>(
    "/marketplace/:source/:appId",
  );
  const params = new URLSearchParams(location.search);
  const communityOrigin = new URL(APPLICATION_MARKETPLACE_URL).origin;
  const communityApiOrigin = new URL(trans("home.marketplaceURL")).origin;
  const isCommunityHost = window.location.origin === communityOrigin;
  const source: MarketplaceSource =
    (detail?.params.source || params.get("source")) === "local" &&
    !isCommunityHost
      ? "local"
      : "community";
  const [local, setLocal] = useState<Feed>(initialFeed);
  const [community, setCommunity] = useState<Feed>(initialFeed);
  const [revision, setRevision] = useState(0);
  const feed = source === "local" || isCommunityHost ? local : community;
  const query = params.get("q") || "";
  const category = params.get("category") || "";
  const type = params.get("type") || "";
  const creator = params.get("creator") || "";
  const sort = params.get("sort") === "newest" ? "newest" : "name";
  const list = params.get("view") === "list";
  const requestedPage = Math.max(1, Number(params.get("page")) || 1);
  const pageSize = [12, 24, 48].includes(Number(params.get("size")))
    ? Number(params.get("size"))
    : 12;
  const [searchInput, setSearchInput] = useState(query);
  const shellRef = useRef<HTMLDivElement>(null);
  const scrollPositions = useRef(new Map<string, number>());
  const scrollParams = new URLSearchParams(location.search);
  source === "local"
    ? scrollParams.set("source", "local")
    : scrollParams.delete("source");
  scrollParams.sort();
  const scrollKey = `${location.pathname}?${scrollParams}`;

  useLayoutEffect(() => {
    const container = shellRef.current?.closest("main");
    if (!container || feed.loading) return;
    container.scrollTop = scrollPositions.current.get(scrollKey) || 0;
    const positions = scrollPositions.current;
    const rememberPosition = () => {
      if (positions.size >= 100)
        positions.delete(positions.keys().next().value!);
      positions.set(scrollKey, container.scrollTop);
    };
    container.addEventListener("scroll", rememberPosition, { passive: true });
    return () => container.removeEventListener("scroll", rememberPosition);
  }, [scrollKey, feed.loading]);

  useEffect(() => {
    setSearchInput(query);
  }, [query]);
  useEffect(() => {
    if (searchInput === query) return;
    const timer = setTimeout(() => {
      const next = new URLSearchParams(location.search);
      searchInput ? next.set("q", searchInput) : next.delete("q");
      next.delete("page");
      history.replace({ pathname: "/marketplace", search: next.toString() });
    }, 250);
    return () => clearTimeout(timer);
  }, [searchInput, query, history, location.search]);

  useEffect(() => {
    let active = true;
    setLocal(initialFeed);
    setCommunity(initialFeed);
    const read = async (
      request: Promise<any>,
      update: (feed: Feed) => void,
    ) => {
      try {
        const response = await request;
        if (!response.data?.success || !Array.isArray(response.data.data))
          throw new Error("Marketplace unavailable");
        if (active)
          update({ apps: response.data.data, loading: false, error: false });
      } catch {
        if (active) update({ apps: [], loading: false, error: true });
      }
    };
    read(ApplicationApi.fetchAllMarketplaceApps(), setLocal);
    if (!isCommunityHost)
      read(
        axios.get(
          `${communityApiOrigin}/api/v1/applications/marketplace-apps`,
          { withCredentials: false },
        ),
        setCommunity,
      );
    return () => {
      active = false;
    };
  }, [workspaceId, revision, communityApiOrigin, isCommunityHost]);

  const apps = useMemo(
    () =>
      filterMarketplaceApps(feed.apps, {
        query,
        category,
        type,
        creator,
        sort,
      }),
    [feed.apps, query, category, type, creator, sort],
  );
  const categories = useMemo(
    () => marketplaceCategories(feed.apps),
    [feed.apps],
  );
  const page = Math.min(
    Math.floor(requestedPage),
    Math.max(1, Math.ceil(apps.length / pageSize)),
  );
  const visibleApps = apps.slice((page - 1) * pageSize, page * pageSize);
  const selected =
    detail &&
    feed.apps.find((app) => app.applicationId === detail.params.appId);
  const backParams = new URLSearchParams(location.search);
  source === "local"
    ? backParams.set("source", "local")
    : backParams.delete("source");
  const backUrl = `/marketplace${backParams.toString() ? `?${backParams}` : ""}`;
  const actualSource: MarketplaceSource = isCommunityHost ? "local" : source;
  const appUrl = (app: MarketplaceApp) =>
    marketplaceAppUrl(app.applicationId, actualSource, communityOrigin);
  const detailUrl = (app: MarketplaceApp) =>
    `/marketplace/${source}/${encodeURIComponent(app.applicationId)}${location.search}`;
  const updateFilters = (changes: Record<string, string>, replace = false) => {
    const next = new URLSearchParams(location.search);
    if (detail) next.set("source", source);
    next.delete("page");
    Object.entries(changes).forEach(([key, value]) =>
      value ? next.set(key, value) : next.delete(key),
    );
    history[replace ? "replace" : "push"]({
      pathname: "/marketplace",
      search: next.toString(),
    });
  };
  const clearFilters = () =>
    updateFilters({ q: "", category: "", type: "", creator: "" });
  const filtered = Boolean(query || category || type || creator);
  const creatorApps = (app: MarketplaceApp) =>
    updateFilters({ creator: app.createBy, q: "", category: "", type: "" });
  const creatorDisplay = (app: MarketplaceApp) => (
    <>
      <span className="avatar" aria-hidden="true">
        {initials(creatorName(app))}
      </span>
      <span className="creator-name">{creatorName(app)}</span>
    </>
  );
  const tags = (app: MarketplaceApp) => (
    <div className="tags">
      <span className="tag">{typeName(app)}</span>
      {appCategory(app) && <span className="tag">{appCategory(app)}</span>}
    </div>
  );
  const openApp = (app: MarketplaceApp, primary = false) => (
    <Button
      type={primary ? "primary" : "default"}
      href={appUrl(app)}
      target="_blank"
      rel="noopener noreferrer"
      icon={<ArrowUpOutlined rotate={45} />}
    >
      {trans("marketplace.openApp")}
    </Button>
  );

  return (
    <MarketplaceShell ref={shellRef}>
      <Helmet>
        <title>
          {selected
            ? `${appTitle(selected)} · ${trans("home.marketplace")}`
            : trans("home.marketplace")}
        </title>
      </Helmet>
      {detail ? (
        <>
          <Link className="back-link" to={backUrl}>
            <ArrowLeftOutlined />
            {trans("marketplace.backToMarketplace")}
          </Link>
          {feed.loading ? (
            <Skeleton active paragraph={{ rows: 8 }} />
          ) : selected ? (
            <>
              <div className="marketplace-heading">
                <div>
                  <div className="eyebrow">
                    {trans(
                      source === "community"
                        ? "marketplace.community"
                        : "marketplace.local",
                    )}
                  </div>
                  <h1>{appTitle(selected)}</h1>
                  <div className="detail-tags">{tags(selected)}</div>
                </div>
                {openApp(selected, true)}
              </div>
              <div className="detail-grid">
                <div>
                  <div className="detail-preview">
                    <MarketplacePreview
                      key={`${actualSource}:${selected.applicationId}`}
                      appId={selected.applicationId}
                      source={actualSource}
                      title={appTitle(selected)}
                    />
                    <div className="preview-caption">
                      <span>{trans("marketplace.previewCaption")}</span>
                      <a
                        href={appUrl(selected)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {trans("marketplace.openFullApp")} ↗
                      </a>
                    </div>
                  </div>
                  <section className="detail-body">
                    <h2>{trans("marketplace.aboutApp")}</h2>
                    <p className="description">
                      {selected.description?.trim() ||
                        trans("marketplace.noDescription")}
                    </p>
                  </section>
                </div>
                <aside className="creator-panel">
                  <h2>{trans("marketplace.createdBy")}</h2>
                  <div className="creator-row">{creatorDisplay(selected)}</div>
                  {selected.createBy && (
                    <Button
                      type="link"
                      style={{ padding: "12px 0 0", textAlign: "left" }}
                      onClick={() => creatorApps(selected)}
                    >
                      {trans("marketplace.moreFromCreator")}
                    </Button>
                  )}
                  <dl>
                    <dt>{trans("marketplace.category")}</dt>
                    <dd>
                      {appCategory(selected) ||
                        trans("marketplace.uncategorized")}
                    </dd>
                    <dt>{trans("marketplace.appType")}</dt>
                    <dd>{typeName(selected)}</dd>
                    {selected.orgName && (
                      <>
                        <dt>{trans("marketplace.workspace")}</dt>
                        <dd>{selected.orgName}</dd>
                      </>
                    )}
                    <dt>{trans("marketplace.source")}</dt>
                    <dd>
                      {trans(
                        source === "community"
                          ? "marketplace.community"
                          : "marketplace.local",
                      )}
                    </dd>
                  </dl>
                  <Button
                    block
                    icon={<LinkOutlined />}
                    onClick={() => {
                      if (copy(window.location.href))
                        messageInstance.success(
                          trans("marketplace.linkCopied"),
                        );
                    }}
                  >
                    {trans("marketplace.copyLink")}
                  </Button>
                </aside>
              </div>
            </>
          ) : (
            <div className="empty">
              <h2>
                {trans(
                  feed.error ? "admin.loadError" : "marketplace.appUnavailable",
                )}
              </h2>
              <p>{trans("marketplace.appUnavailableDescription")}</p>
              {feed.error && (
                <Button onClick={() => setRevision((value) => value + 1)}>
                  {trans("admin.retry")}
                </Button>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="marketplace-heading">
            <div>
              <div className="eyebrow">{trans("marketplace.eyebrow")}</div>
              <h1>{trans("marketplace.title")}</h1>
              <p className="intro">{trans("marketplace.description")}</p>
            </div>
            <Tooltip title={trans("marketplace.shareHint")}>
              <Button href="/apps">{trans("marketplace.shareApp")}</Button>
            </Tooltip>
          </div>
          <div
            className="tabs"
            role="tablist"
            aria-label={trans("marketplace.source")}
          >
            {(
              [
                "community",
                ...(!isCommunityHost ? ["local"] : []),
              ] as MarketplaceSource[]
            ).map((tab) => {
              const data =
                tab === "community" && !isCommunityHost ? community : local;
              return (
                <button
                  key={tab}
                  id={`marketplace-tab-${tab}`}
                  role="tab"
                  aria-selected={source === tab}
                  aria-controls="marketplace-results"
                  tabIndex={source === tab ? 0 : -1}
                  onClick={() =>
                    updateFilters({ source: tab, category: "", creator: "" })
                  }
                  onKeyDown={(event) => {
                    if (
                      !isCommunityHost &&
                      ["ArrowLeft", "ArrowRight", "Home", "End"].includes(
                        event.key,
                      )
                    ) {
                      event.preventDefault();
                      const next =
                        event.key === "Home"
                          ? "community"
                          : event.key === "End"
                            ? "local"
                            : tab === "community"
                              ? "local"
                              : "community";
                      updateFilters({
                        source: next,
                        category: "",
                        creator: "",
                      });
                      document
                        .getElementById(`marketplace-tab-${next}`)
                        ?.focus();
                    }
                  }}
                >
                  {trans(
                    tab === "community"
                      ? "marketplace.community"
                      : "marketplace.local",
                  )}
                  {!data.loading && !data.error && (
                    <span className="tab-count">{data.apps.length}</span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="toolbar">
            <Input
              className="search"
              size="large"
              aria-label={trans("marketplace.search")}
              placeholder={trans("marketplace.search")}
              prefix={
                <SearchOutlined style={{ color: "#a38eaf", marginRight: 6 }} />
              }
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              allowClear
            />
            <Select
              className="filter"
              size="large"
              aria-label={trans("marketplace.appType")}
              value={type}
              onChange={(value) => updateFilters({ type: value })}
              options={[
                { value: "", label: trans("marketplace.allTypes") },
                ...[
                  AppTypeEnum.Application,
                  AppTypeEnum.Module,
                  AppTypeEnum.NavLayout,
                  AppTypeEnum.MobileTabLayout,
                ].map((value) => ({
                  value: String(value),
                  label: typeName({ applicationType: value } as MarketplaceApp),
                })),
              ]}
            />
            <Select
              className="filter"
              size="large"
              aria-label={trans("marketplace.category")}
              value={category}
              onChange={(value) => updateFilters({ category: value })}
              style={{ minWidth: 190 }}
              options={[
                { value: "", label: trans("marketplace.allCategories") },
                ...categories.map((item) => ({
                  value: item.value,
                  label: `${item.value} (${item.count})`,
                })),
              ]}
            />
          </div>
          {categories.length > 0 && (
            <div
              className="categories"
              aria-label={trans("marketplace.categories")}
            >
              <button
                aria-pressed={!category}
                onClick={() => updateFilters({ category: "" })}
              >
                {trans("marketplace.allCategories")}
              </button>
              {categories
                .slice()
                .sort((a, b) => b.count - a.count)
                .slice(0, 5)
                .map((item) => (
                  <button
                    key={item.value}
                    aria-pressed={category === item.value}
                    onClick={() =>
                      updateFilters({
                        category: category === item.value ? "" : item.value,
                      })
                    }
                  >
                    {item.value} <span>· {item.count}</span>
                  </button>
                ))}
            </div>
          )}
          <div className="results-bar">
            <span aria-live="polite">
              {feed.loading
                ? trans("marketplace.loading")
                : apps.length === 1
                  ? trans("marketplace.oneResult")
                  : trans("marketplace.results", { count: apps.length })}
              {creator &&
                ` · ${creatorName(feed.apps.find((app) => app.createBy === creator) || ({ creatorEmail: "" } as MarketplaceApp))}`}
            </span>
            <div className="results-actions">
              {filtered && (
                <Button size="small" type="link" onClick={clearFilters}>
                  {trans("admin.clearFilters")}
                </Button>
              )}
              <Select
                aria-label={trans("marketplace.sort")}
                variant="borderless"
                value={sort}
                style={{ minWidth: 140 }}
                onChange={(value) => updateFilters({ sort: value })}
                options={[
                  { value: "name", label: trans("marketplace.nameSort") },
                  { value: "newest", label: trans("marketplace.newest") },
                ]}
              />
              <div className="view-switch">
                <Button
                  aria-label={trans("admin.cardView")}
                  aria-pressed={!list}
                  type={!list ? "primary" : "text"}
                  icon={<AppstoreOutlined />}
                  onClick={() => updateFilters({ view: "" })}
                />
                <Button
                  aria-label={trans("admin.listView")}
                  aria-pressed={list}
                  type={list ? "primary" : "text"}
                  icon={<UnorderedListOutlined />}
                  onClick={() => updateFilters({ view: "list" })}
                />
              </div>
            </div>
          </div>
          <div
            id="marketplace-results"
            role="tabpanel"
            aria-labelledby={`marketplace-tab-${source}`}
          >
            {feed.error ? (
              <Alert
                type="error"
                showIcon
                message={trans("admin.loadError")}
                action={
                  <Button onClick={() => setRevision((value) => value + 1)}>
                    {trans("admin.retry")}
                  </Button>
                }
              />
            ) : feed.loading ? (
              <Skeleton active paragraph={{ rows: 10 }} />
            ) : apps.length === 0 ? (
              <div className="empty">
                <GlobalOutlined style={{ fontSize: 32, color: "#ad8abd" }} />
                <h2>
                  {trans(
                    filtered
                      ? "marketplace.noMatches"
                      : source === "local"
                        ? "marketplace.localEmpty"
                        : "marketplace.communityEmpty",
                  )}
                </h2>
                <p>
                  {trans(
                    filtered
                      ? "admin.noResults"
                      : source === "local"
                        ? "marketplace.localEmptyDescription"
                        : "marketplace.communityEmptyDescription",
                  )}
                </p>
                {filtered ? (
                  <Button onClick={clearFilters}>
                    {trans("admin.clearFilters")}
                  </Button>
                ) : (
                  <Button href="/apps">{trans("marketplace.goToApps")}</Button>
                )}
              </div>
            ) : (
              <>
                <MarketplaceGrid $list={list}>
                  {visibleApps.map((app) => (
                    <article
                      className="marketplace-card"
                      key={`${source}:${app.applicationId}`}
                    >
                      <Link
                        className="cover-link"
                        to={detailUrl(app)}
                        aria-label={trans("marketplace.exploreApp", {
                          title: appTitle(app),
                        })}
                      >
                        <MarketplacePreview
                          appId={app.applicationId}
                          source={actualSource}
                          title={appTitle(app)}
                        />
                      </Link>
                      <div className="card-body">
                        {tags(app)}
                        <Link className="title-link" to={detailUrl(app)}>
                          {appTitle(app)}
                        </Link>
                        <p className="card-description">
                          {app.description?.trim() ||
                            trans("marketplace.noDescription")}
                        </p>
                        <div className="card-footer">
                          <button
                            className="creator-button"
                            disabled={!app.createBy}
                            onClick={() => creatorApps(app)}
                            title={trans("marketplace.moreFromCreator")}
                          >
                            {creatorDisplay(app)}
                          </button>
                          <a
                            className="open-link"
                            href={appUrl(app)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {trans("marketplace.openApp")}{" "}
                            <ArrowUpOutlined rotate={45} />
                          </a>
                        </div>
                      </div>
                    </article>
                  ))}
                </MarketplaceGrid>
                <Pagination
                  style={{
                    marginTop: 28,
                    display: "flex",
                    justifyContent: "center",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                  current={page}
                  pageSize={pageSize}
                  total={apps.length}
                  pageSizeOptions={[12, 24, 48]}
                  showSizeChanger
                  responsive
                  showTotal={(total, range) =>
                    trans("admin.resultCount", {
                      start: range[0],
                      end: range[1],
                      total,
                    })
                  }
                  onChange={(nextPage, size) =>
                    updateFilters({
                      page: String(size !== pageSize ? 1 : nextPage),
                      size: String(size),
                    })
                  }
                />
              </>
            )}
          </div>
        </>
      )}
    </MarketplaceShell>
  );
}
