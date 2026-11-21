import { expect, test } from "@playwright/test";
import { TableView } from "../../src/pages/TableView";

/** A table scope with the headers "Name" and "Full Name", each with a filter trigger that records its own title. */
const COMP_NAME = "table1";
const TABLE_HTML = `<div data-comp-name="${COMP_NAME}"><table><thead><tr>
  <th><span>Full Name</span><span class="ant-table-filter-trigger" data-title="Full Name" style="display:inline-block;width:10px;height:10px"></span></th>
  <th><span>Name</span><span class="ant-table-filter-trigger" data-title="Name" style="display:inline-block;width:10px;height:10px"></span></th>
</tr></thead></table><div id="clicked"></div></div>
<script>
  document.querySelectorAll(".ant-table-filter-trigger").forEach((trigger) =>
    trigger.addEventListener("click", () => { document.getElementById("clicked").textContent = trigger.dataset.title; }));
</script>`;

test.describe("TableView header lookup", () => {
  test("a header is found by its exact title, not by a title that merely contains it", async ({ page }) => {
    await page.setContent(TABLE_HTML);
    const table = new TableView(page, COMP_NAME);

    await expect(table.headerCell("Name"), "exactly one header matches \"Name\"").toHaveCount(1);
    await expect(table.headerCell("Name"), "it is the \"Name\" header").toContainText(/^Name$/);
    await table.headerCell("Name").locator(".ant-table-filter-trigger").click();

    await expect(page.locator("#clicked"), "the trigger of the header \"Name\", not of \"Full Name\", was clicked").toHaveText("Name");
    await expect(table.headerCell("Full Name"), "exactly one header matches \"Full Name\"").toHaveCount(1);
  });
});
