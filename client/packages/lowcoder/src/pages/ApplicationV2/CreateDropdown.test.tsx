import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { Provider } from "react-redux";
import { createStore } from "redux";
import { MemoryRouter } from "react-router-dom";
import { CreateDropdown } from "./CreateDropdown";
import { useCreateHomeRes } from "./useCreateHomeRes";
import { HomeResTypeEnum } from "types/homeRes";
import { HomeResInfo } from "util/homeResUtils";
import { trans } from "i18n";

jest.mock("./useCreateHomeRes", () => ({ useCreateHomeRes: jest.fn() }));

const handleCreate = jest.fn();
const store = createStore(() => ({ ui: { users: { user: { currentOrgId: "workspace" } } } }));

function Example({ mode = "view", defaultVisible = false }: {
  mode?: "view" | "folder" | "module" | "folders"; defaultVisible?: boolean;
}) {
  return <Provider store={store}><MemoryRouter>
    <div data-testid="toolbar" style={{ overflow: "hidden", transform: "translateZ(0)" }}>
      <CreateDropdown mode={mode} defaultVisible={defaultVisible} setModify={jest.fn()} modify={false} />
    </div>
    <button>Outside the menu</button>
  </MemoryRouter></Provider>;
}

beforeEach(() => {
  jest.mocked(useCreateHomeRes).mockReturnValue([handleCreate, false]);
});

it("opens on click outside the toolbar's stacking context and supports repeated dismissal", async () => {
  render(<Example />);
  const trigger = screen.getByRole("button", { name: trans("newItem") });
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  fireEvent.click(trigger);
  const menu = await screen.findByRole("menu");
  await waitFor(() => expect(menu).toBeVisible());
  expect(screen.getByTestId("toolbar")).not.toContainElement(menu);
  expect(document.body).toContainElement(menu);
  expect(within(menu).getAllByRole("menuitem")).toHaveLength(5);
  expect(trigger).toHaveAttribute("aria-expanded", "true");

  fireEvent.click(trigger);
  await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  fireEvent.click(trigger);
  await screen.findByRole("menu");
  fireEvent.mouseDown(screen.getByRole("button", { name: "Outside the menu" }));
  await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "false"));
  fireEvent.click(trigger);
  await screen.findByRole("menu");
  fireEvent.keyDown(window, { key: "Escape", keyCode: 27 });
  await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "false"));
});

it.each([HomeResTypeEnum.Application, HomeResTypeEnum.Module, HomeResTypeEnum.Folder])(
  "keeps creation action %s and closes the menu after selection", async (type) => {
    render(<Example mode="folder" />);
    const trigger = screen.getByRole("button", { name: trans("newItem") });
    fireEvent.click(trigger);
    fireEvent.click(await screen.findByRole("menuitem", { name: HomeResInfo[type].name }));
    expect(handleCreate).toHaveBeenCalledTimes(1);
    expect(handleCreate).toHaveBeenCalledWith(type);
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "false"));
  }
);

it("keeps the navigation layout picker", async () => {
  render(<Example />);
  fireEvent.click(screen.getByRole("button", { name: trans("newItem") }));
  fireEvent.click(await screen.findByRole("menuitem", { name: HomeResInfo[HomeResTypeEnum.Navigation].name }));
  const dialog = await screen.findByRole("dialog");
  expect(handleCreate).not.toHaveBeenCalled();
  fireEvent.click(within(dialog).getByText(HomeResInfo[HomeResTypeEnum.NavLayout].name));
  expect(handleCreate).toHaveBeenCalledWith(HomeResTypeEnum.NavLayout);
});

it("keeps the JSON import file picker", async () => {
  render(<Example mode="module" />);
  const trigger = screen.getByRole("button", { name: trans("newItem") });
  fireEvent.click(trigger);
  const item = await screen.findByRole("menuitem", { name: trans("home.import") });
  const input = item.querySelector<HTMLInputElement>('input[type="file"]')!;
  const openPicker = jest.spyOn(input, "click").mockImplementation(() => {});
  expect(input).toHaveAttribute("accept", ".json");
  fireEvent.click(within(item).getByText(trans("home.import")));
  expect(openPicker).toHaveBeenCalledTimes(1);
  expect(handleCreate).not.toHaveBeenCalled();
  await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "false"));
  openPicker.mockRestore();
});

it("keeps folder-only mode and allows an initially open tutorial menu to close", async () => {
  render(<Example mode="folders" defaultVisible />);
  const menu = await screen.findByRole("menu");
  expect(within(menu).getAllByRole("menuitem")).toHaveLength(1);
  fireEvent.click(within(menu).getByRole("menuitem", { name: HomeResInfo[HomeResTypeEnum.Folder].name }));
  await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
});
