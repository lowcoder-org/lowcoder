import { expect, type Locator, type Page } from "@playwright/test";
import { TABLE_LABELS } from "../constants";

/** Where the text that shows a table's pending change set is, and what it must hold before the next step. */
export interface ChangeSetOracle {
  /** A text component bound to `{{JSON.stringify(<table>.changeSet)}}`. */
  text: Locator;
  /** What that text must contain once the edit has arrived, e.g. `{"0":{"body":"edited"}}`. */
  contains: string;
}

/**
 * One `table` component of a published app, scoped to the element that carries its `data-comp-name`. The scope
 * matters: a page with two tables has two toolbars and two pagination bars, so an unscoped `.ant-pagination-item`
 * counts both. That the grid item wrapping the whole component carries `data-comp-name` is a
 * testability hook of the e2e image (not in 3.0.0); the scoped locators here are [R] from that source, and
 * `tests/foundation/table-view.spec.ts` runs them.
 *
 * Rows are `tr.ant-table-row`, not `tbody tr`, whose first match is antd's hidden measure row.
 */
export class TableView {
  constructor(
    private readonly page: Page,
    readonly compName: string,
  ) {}

  /** Everything the table renders: rows, header, toolbar, pagination. */
  get scope(): Locator {
    return this.page.locator(`[data-comp-name="${this.compName}"]`);
  }

  /** The data rows of the current page (not the measure row). */
  get rows(): Locator {
    return this.scope.locator("tr.ant-table-row");
  }

  /** This table's own pagination bar. */
  get pagination(): Locator {
    return this.scope.locator(".ant-pagination");
  }

  /** The page-number items of this table's bar (not the prev / next arrows). */
  get pageItems(): Locator {
    return this.pagination.locator(".ant-pagination-item");
  }

  /** The cell at a zero-based row of the current page and a zero-based column. */
  cell(rowIndex: number, columnIndex: number): Locator {
    return this.rows.nth(rowIndex).locator("td").nth(columnIndex);
  }

  /** The header cell whose title text is exactly `title` ("Name" does not match "Full Name"). */
  headerCell(title: string): Locator {
    return this.scope.locator("th").filter({ has: this.page.getByText(title, { exact: true }) });
  }

  /** Goes to page `pageNumber` (1-based) with the item of this table's bar. */
  async goToPage(pageNumber: number): Promise<void> {
    await this.pagination.locator(`.ant-pagination-item-${pageNumber}`).click();
  }

  /** Clicks the header of a sortable column once; ascending first, descending on the second click. */
  async clickHeader(title: string): Promise<void> {
    await this.scope.locator(".ant-table-thead").getByText(title, { exact: true }).click();
  }

  /**
   * Filters a `filterable` column to one value of its menu: opens the filter menu of the header, ticks the value,
   * confirms. Filtering does not reset the page: go to page 1 first when the filtered rows would start there
   * (tableUtils.tsx:572-580). The menu is a portal outside the table, so the value and the confirm button are found
   * on the page; the last match is the open menu.
   */
  async filterColumn(title: string, value: string): Promise<void> {
    await this.headerCell(title).locator(".ant-table-filter-trigger").click();
    await this.page.getByText(value, { exact: true }).last().click();
    await this.page.getByRole("button", { name: TABLE_LABELS.FILTER_CONFIRM }).last().click();
  }

  /**
   * Edits a cell of an `editable` column in place: double-click, select all, type, Enter. The change set fills
   * asynchronously (a read right after Enter still shows `{}`), so the step returns only once the oracle text
   * shows the edit; the caller then saves or edits the next cell.
   */
  async editCell(rowIndex: number, columnIndex: number, value: string, oracle: ChangeSetOracle): Promise<void> {
    await this.cell(rowIndex, columnIndex).dblclick();
    await this.page.keyboard.press("ControlOrMeta+A");
    await this.page.keyboard.type(value);
    await this.page.keyboard.press("Enter");
    await expect(oracle.text, `the change set shows the edit ${oracle.contains}`).toContainText(oracle.contains);
  }

  /** The toolbar button that saves edited cells; it exists only while a change is pending. */
  get saveChangesButton(): Locator {
    return this.scope.getByRole("button", { name: TABLE_LABELS.SAVE_CHANGES });
  }

  async saveChanges(): Promise<void> {
    await this.saveChangesButton.click();
  }
}
