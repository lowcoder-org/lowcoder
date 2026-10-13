import { runSaga, stdChannel } from "redux-saga";
import { getBranding } from "api/enterpriseApi";
import { ReduxActionTypes } from "constants/reduxActionConstants";
import type { AppState } from "redux/reducers";
import { getBrandingSetting } from "redux/selectors/enterpriseSelectors";
import enterpriseSagas, { fetchBrandingSettingSaga } from "./enterpriseSagas";

jest.mock("api/enterpriseApi", () => ({ getBranding: jest.fn() }));
jest.mock("pages/setting/environments/services/environments.service", () => ({}));

const globalBranding = { id: "global", config_set: { logo: "https://example.com/logo.svg", mainBrandingColor: "#2356c4" } };
const workspaceBranding = { id: "workspace", orgId: "a", config_set: { logo: "material-id", mainBrandingColor: "#007f68", showDocumentation: false } };
const state = (orgId: string, workspace = workspaceBranding) => ({
  ui: { users: { user: { currentOrgId: orgId } }, enterprise: { globalBranding, workspaceBranding: workspace } },
}) as AppState;

it("keeps workspace precedence, explicit false settings and logo provenance", () => {
  expect(getBrandingSetting(state("a"))).toBe(workspaceBranding);
  expect(getBrandingSetting(state("a"))?.config_set?.showDocumentation).toBe(false);
});

it("uses the global identity immediately when switching workspace", () => {
  expect(getBrandingSetting(state("b"))).toBe(globalBranding);
  expect(getBrandingSetting(state("b"))?.orgId).toBeUndefined();
});

it("falls back after a workspace configuration is reset", () => {
  expect(getBrandingSetting(state("a", { ...workspaceBranding, config_set: {} } as typeof workspaceBranding))).toBe(globalBranding);
});

it.each([{}, { id: "reset", config_set: {} }])("clears unavailable branding and requests a global fallback", async (response) => {
  jest.mocked(getBranding).mockResolvedValue(response as any);
  const dispatched: any[] = [];
  await runSaga({ dispatch: (action) => dispatched.push(action) }, fetchBrandingSettingSaga, {
    type: ReduxActionTypes.FETCH_BRANDING_SETTING, payload: { orgId: "b" },
  }).toPromise();
  expect(dispatched).toEqual([
    { type: ReduxActionTypes.SET_WORKSPACE_BRANDING_SETTING, payload: undefined },
    { type: ReduxActionTypes.FETCH_BRANDING_SETTING, payload: {} },
  ]);
});

it("does not retain another company's branding after an API error", async () => {
  const error = jest.spyOn(console, "error").mockImplementation(() => {});
  jest.mocked(getBranding).mockRejectedValue(new Error("Unavailable"));
  const dispatched: any[] = [];
  await runSaga({ dispatch: (action) => dispatched.push(action) }, fetchBrandingSettingSaga, {
    type: ReduxActionTypes.FETCH_BRANDING_SETTING, payload: { orgId: "b", fallbackToGlobal: true },
  }).toPromise();
  expect(dispatched[0]).toEqual({ type: ReduxActionTypes.SET_WORKSPACE_BRANDING_SETTING, payload: undefined });
  error.mockRestore();
});

it("keeps the newest workspace response even when a global request overlaps it", async () => {
  const channel = stdChannel();
  const dispatched: any[] = [];
  const pending: Record<string, (value: any) => void> = {};
  jest.mocked(getBranding).mockImplementation((orgId) => new Promise((resolve) => { pending[orgId || "global"] = resolve; }));
  const task = runSaga({ channel, dispatch: (action) => dispatched.push(action) }, enterpriseSagas);
  try {
    channel.put({ type: ReduxActionTypes.FETCH_BRANDING_SETTING, payload: { orgId: "a" } });
    channel.put({ type: ReduxActionTypes.FETCH_BRANDING_SETTING, payload: {} });
    channel.put({ type: ReduxActionTypes.FETCH_BRANDING_SETTING, payload: { orgId: "b" } });
    pending.b({ ...workspaceBranding, orgId: "b" });
    pending.global(globalBranding);
    pending.a(workspaceBranding);
    await Promise.resolve();
    expect(dispatched.filter((action) => action.type === ReduxActionTypes.SET_WORKSPACE_BRANDING_SETTING))
      .toEqual([{ type: ReduxActionTypes.SET_WORKSPACE_BRANDING_SETTING, payload: { ...workspaceBranding, orgId: "b" } }]);
    expect(dispatched).toContainEqual({ type: ReduxActionTypes.SET_GLOBAL_BRANDING_SETTING, payload: globalBranding });
  } finally {
    task.cancel();
  }
});
