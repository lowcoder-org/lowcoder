import { act, render, screen, waitFor } from "@testing-library/react";
import App from "antd/es/app";
import ConfigProvider from "antd/es/config-provider";
import theme from "antd/es/theme";
import { createPortal } from "react-dom";
import { Provider } from "react-redux";
import { createStore } from "redux";
import GlobalInstances, { modalInstance } from "lowcoder-design/src/components/GlobalInstances";
import { TacoButton } from "lowcoder-design/src/components/button";
import { AdminTheme } from "./adminTheme";
import { AdminBrand } from "./AdminBrand";

const company = {
  id: "company", orgId: "a",
  config_set: { mainBrandingColor: "#007f68", font: "Open+Sans", standardTitle: "Acme Operations" },
};
const store = createStore(() => ({
  ui: { users: { user: { currentOrgId: "a" } }, enterprise: { workspaceBranding: company } },
}));
function Tokens({ label }: { label: string }) {
  const { token } = theme.useToken();
  return <output aria-label={label}>{token.colorPrimary}|{token.fontFamily}</output>;
}
function Shell({ admin }: { admin: boolean }) {
  return <Provider store={store}>
    <ConfigProvider theme={{ token: { colorPrimary: "#123456", fontFamily: "Outer font" } }}>
      <App>
        <GlobalInstances />
        {admin ? <AdminTheme>
          <AdminBrand branding={company} showName />
          {createPortal(<><Tokens label="portal" /><TacoButton buttonType="primary">Portal action</TacoButton></>, document.body)}
        </AdminTheme> : <Tokens label="editor" />}
      </App>
    </ConfigProvider>
  </Provider>;
}

it("brands portaled controls and imperative dialogs, then restores the outer theme on exit", async () => {
  const view = render(<Shell admin />);
  expect(screen.getByText("Acme Operations")).toBeInTheDocument();
  expect(screen.queryByText("Lowcoder")).not.toBeInTheDocument();
  expect(screen.getByLabelText("portal")).toHaveTextContent('#007f68|"Open Sans", sans-serif');
  expect(getComputedStyle(screen.getByRole("button", { name: "Portal action" })).getPropertyValue("--admin-accent")).toBe("#007f68");
  let dialog: ReturnType<typeof modalInstance.confirm>;
  act(() => { dialog = modalInstance.confirm({ title: "Company dialog", content: <Tokens label="dialog" /> }); });
  await waitFor(() => expect(screen.getByLabelText("dialog")).toHaveTextContent('#007f68|"Open Sans", sans-serif'));
  act(() => dialog.destroy());
  view.rerender(<Shell admin={false} />);
  expect(screen.getByLabelText("editor")).toHaveTextContent("#123456|Outer font");
  act(() => { dialog = modalInstance.confirm({ title: "Outer dialog", content: <Tokens label="outer-dialog" /> }); });
  await waitFor(() => expect(screen.getByLabelText("outer-dialog")).toHaveTextContent("#123456|Outer font"));
  act(() => dialog.destroy());
});

it("resolves workspace material logos and global URL logos without mixing their origins", () => {
  const view = render(<AdminBrand showName branding={{ ...company, config_set: { logo: "material-id" } }} />);
  expect(screen.getByRole("img")).toHaveAttribute("src", expect.stringContaining("/api/materials/material-id?type=preview"));
  view.rerender(<AdminBrand showName branding={{ config_set: { logo: "https://example.com/logo.svg" } }} />);
  expect(screen.getByRole("img")).toHaveAttribute("src", "https://example.com/logo.svg");
});
