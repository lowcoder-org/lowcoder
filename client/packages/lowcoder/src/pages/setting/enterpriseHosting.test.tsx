import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { useSelector } from "react-redux";
import { getDeploymentId } from "redux/selectors/configSelectors";
import { initTranslator } from "i18n";
import Api from "api/api";
import { submitLicenseRequest, LicenseRequestData } from "api/licenseRequestApi";
import { isPublicLowcoderCloud } from "util/enterpriseHosting";
import { useEnterpriseLicenseSync } from "util/enterpriseLicenseSync";
import { EnterpriseLicenses } from "./subscriptions/EnterpriseLicenses";
import { LicenseRequestModal } from "./licenseRequestModal";

jest.mock("api/api", () => ({ __esModule: true, default: { post: jest.fn() } }));
jest.mock("react-redux", () => ({ useSelector: jest.fn() }));
jest.mock("redux/selectors/usersSelectors", () => ({ getUser: jest.fn(), getCurrentUser: jest.fn() }));
jest.mock("redux/selectors/orgSelectors", () => ({ getCurrentOrg: jest.fn() }));
jest.mock("redux/selectors/configSelectors", () => ({ getDeploymentId: jest.fn() }));
jest.mock("util/permissionUtils", () => ({ currentOrgAdmin: () => true }));

const post = Api.post as jest.Mock;
const location = window.location;
const testLocation = { hostname: "", origin: "" };
const setHost = (hostname: string) => {
  Object.assign(testLocation, { hostname, origin: `https://${hostname}` });
  Object.defineProperty(window, "location", { configurable: true, value: testLocation });
};

beforeEach(() => {
  setHost("app.lowcoder.cloud");
  Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
  (useSelector as jest.Mock).mockImplementation(selector => selector === getDeploymentId ? "deployment-1" :
    { currentOrgId: "org", id: "admin", name: "Admin" });
  window.matchMedia = jest.fn().mockImplementation(() => ({
    matches: false, addListener: jest.fn(), removeListener: jest.fn(),
    addEventListener: jest.fn(), removeEventListener: jest.fn(),
  }));
});
afterEach(() => {
  Object.defineProperty(window, "location", { configurable: true, value: location });
  jest.useRealTimers();
  initTranslator("en");
});

test.each(["app.lowcoder.cloud", "APP.LOWCODER.CLOUD", "app.lowcoder.cloud."])("public service %s is restricted", hostname => {
  expect(isPublicLowcoderCloud(hostname)).toBe(true);
});
test.each(["localhost", "lowcoder.cloud", "staging.lowcoder.cloud", "private.app.lowcoder.cloud", "app.lowcoder.cloud.example", "lowcoder.example"])(
  "other host %s keeps Enterprise purchasing", hostname => {
    expect(isPublicLowcoderCloud(hostname)).toBe(false);
  }
);

test("cloud subscription section explains self-hosting without purchase controls or admin data", () => {
  render(<EnterpriseLicenses />);
  expect(screen.getByText(/We do not offer hosted Enterprise Edition/)).toBeInTheDocument();
  expect(screen.getByText(/Settings → Subscription → Enterprise licenses/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Open the self-hosting guide" })).toHaveAttribute("href",
    "https://docs.lowcoder.cloud/lowcoder-documentation/setup-and-run/self-hosting");
  expect(screen.queryByRole("button", { name: /Request Enterprise licenses|Continue payment|Manage billing|Refresh licenses/ })).not.toBeInTheDocument();
  expect(useSelector).not.toHaveBeenCalled();
  expect(post).not.toHaveBeenCalled();
});

test("opening the purchase modal on the public cloud shows guidance without a checkout form", () => {
  render(<LicenseRequestModal open onClose={jest.fn()} orgId="org" />);
  expect(screen.getByRole("dialog")).toHaveTextContent("Enterprise Edition is self-hosted");
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Continue/ })).not.toBeInTheDocument();
  expect(post).not.toHaveBeenCalled();
});

test.each(["en", "de", "es", "it", "pt", "ru", "zh"])("self-hosting guidance is available in %s", language => {
  initTranslator(language);
  render(<EnterpriseLicenses />);
  expect(screen.getByRole("link")).toHaveAttribute("href", "https://docs.lowcoder.cloud/lowcoder-documentation/setup-and-run/self-hosting");
  expect(screen.getByText(/app.lowcoder.cloud/)).toBeInTheDocument();
  expect(document.body).not.toHaveTextContent("enterprise.selfHosted");
});

test("self-hosted administrators can still open the purchase form", () => {
  setHost("private.lowcoder.cloud");
  expect(isPublicLowcoderCloud()).toBe(false);
  render(<EnterpriseLicenses />);
  fireEvent.click(screen.getByRole("button", { name: "Request Enterprise licenses" }));
  expect(screen.getByRole("dialog")).toHaveTextContent("Enterprise License Request");
  expect(screen.getByLabelText("Company name")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();
});

test("cloud API calls cannot create checkout even if the form is bypassed", async () => {
  await expect(submitLicenseRequest({ orgId: "org" } as LicenseRequestData)).rejects.toThrow("self-hosted");
  expect(post).not.toHaveBeenCalled();
});

test("cloud skips licensing and an empty self-hosted account stops after status", async () => {
  jest.useFakeTimers();
  post.mockResolvedValue({ data: { data: { success: true, orders: [], licenses: [] } } });
  const cloud = renderHook(() => useEnterpriseLicenseSync("org", "admin", true));
  await act(async () => {
    jest.advanceTimersByTime(120000);
    window.dispatchEvent(new Event("focus"));
  });
  expect(post).not.toHaveBeenCalled();
  cloud.unmount();
  setHost("lowcoder.example");
  const selfHosted = renderHook(() => useEnterpriseLicenseSync("org", "admin", true));
  await act(async () => {});
  expect(post).toHaveBeenCalledWith("/enterprise-licenses/status", { orgId: "org", returnOrigin: "https://lowcoder.example" }, undefined, { timeout: 120000 });
  await act(async () => { jest.advanceTimersByTime(3600000); });
  expect(post).toHaveBeenCalledTimes(1);
  selfHosted.unmount();
});
