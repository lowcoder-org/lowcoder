# Lowcoder 3.0.0 issue audit

Snapshot: 11 October 2026, Europe/Madrid. Repository: lowcoder-org/lowcoder.

The exact [Awaiting Release filter](https://github.com/lowcoder-org/lowcoder/issues?q=is%3Aissue%20label%3A%22Awaiting%20Release%22) returned **46 issues across all states: 25 open and 21 closed**. The label description is “Ticket is Dev Complete. Awaiting for the Release.” Per the release owner's instruction, these are the completed-ticket inventory.

**21 are already represented in main; 25 remain candidates for the 3.0.0 change list.** The latter include an additional fix for #1868. These are issue counts, not a benchmark or a count of independently tested bugs. Feature requests are included. The public announcement deliberately avoids “46 new bug fixes.”

Checked refs:
- main: db7aae37ded3c4bf64bfa21042aa8787b984fd9c, also release 2.7.6.
- dev: 2d9317fc3afb1faedb1acc26112b113f63a2f9e7.
- dev contains main and has 339 additional commits.

## Candidates associated with 3.0.0

The label is the release owner's completion signal. Evidence below distinguishes commits and reporter confirmations from label-only entries. Issue reproduction tests were not run in this preparation.

| Issue | User-facing change | Evidence or remaining check |
| --- | --- | --- |
| [#1077](https://github.com/lowcoder-org/lowcoder/issues/1077) | Create nested folders in the app browser. | ff4f94695; maintainer comment 2026-10-04 |
| [#1291](https://github.com/lowcoder-org/lowcoder/issues/1291) | Improve tab overflow/menu alignment and spacing; the issue also requests sticky headers and full-height tabs, which were not separately verified. | ba382c7f4, 667f2405e |
| [#1658](https://github.com/lowcoder-org/lowcoder/issues/1658) | Add searchable table column filters. | 28c86f0d1; maintainer comment 2026-07-01 |
| [#1755](https://github.com/lowcoder-org/lowcoder/issues/1755) | Copy modals and other hook components, including nested content. | 668c989da, ff79f0763, 17402785c |
| [#1758](https://github.com/lowcoder-org/lowcoder/issues/1758) | Improve spacing and formatting for vertical tabs. | 48383377b |
| [#1868](https://github.com/lowcoder-org/lowcoder/issues/1868) | Preserve cell styling when a row is selected; additional fix after the earlier main-branch implementation. | cd3d68ab7; maintainer comment 2026-10-04 |
| [#1938](https://github.com/lowcoder-org/lowcoder/issues/1938) | Resizable script and styles editor windows. | f59557ac1; maintainer comment 2026-10-04 |
| [#2099](https://github.com/lowcoder-org/lowcoder/issues/2099) | Remove an individual uploaded file with clearValueAt; implemented API differs from the originally requested clearValue argument. | b9122be74 |
| [#2100](https://github.com/lowcoder-org/lowcoder/issues/2100) | Validate uploaded filenames. | a2b4c12f5 |
| [#2101](https://github.com/lowcoder-org/lowcoder/issues/2101) | ListView item component access. Marked complete by label; a commit mentioning #2101 changes Transfer instead, so that commit is not evidence for this request. | Awaiting Release label only for the requested behavior; inspect ListView reproduction before certifying it |
| [#2107](https://github.com/lowcoder-org/lowcoder/issues/2107) | Expose programmatic table rowClick. | 6f4f34f33; maintainer comment 2026-10-04 |
| [#2111](https://github.com/lowcoder-org/lowcoder/issues/2111) | Gantt chart setData with an array of tasks (the issue title says setDate, but its reproduction uses setData). External plugin version needs confirmation. | Awaiting Release label; Gantt is supplied by lowcoder-comp-gantt-chart, outside this repository |
| [#2113](https://github.com/lowcoder-org/lowcoder/issues/2113) | Toast dismissal events and query actions. | 3d77e54bf |
| [#2118](https://github.com/lowcoder-org/lowcoder/issues/2118) | Allow a custom table download handler to override the default CSV download. | 8018b12e4 |
| [#2119](https://github.com/lowcoder-org/lowcoder/issues/2119) | Honor Hide Column in Column Layout. | 0ec710af4 |
| [#2123](https://github.com/lowcoder-org/lowcoder/issues/2123) | Correct Step Control icon/label formatting. | 00dbb72fb, 12786bb1d |
| [#2124](https://github.com/lowcoder-org/lowcoder/issues/2124) | Custom labels for Progress Circle. | 616d61e33 |
| [#2133](https://github.com/lowcoder-org/lowcoder/issues/2133) | Correct datasource access control. | a18f62179 |
| [#2134](https://github.com/lowcoder-org/lowcoder/issues/2134) | Control which table columns can be used in filters. | Awaiting Release label; table filtering change 28c86f0d1 |
| [#2135](https://github.com/lowcoder-org/lowcoder/issues/2135) | Honor date display/input formats. | bbe7f746c; maintainer confirmation 2026-03-24 |
| [#2145](https://github.com/lowcoder-org/lowcoder/issues/2145) | Theme and canvas settings for Navigation Apps. | 4164f3360, 29abe9029 |
| [#2149](https://github.com/lowcoder-org/lowcoder/issues/2149) | Start embedded apps containing Navigation; reporter confirmed the dev SDK fix. | Reporter confirmation 2026-06-10; SDK deployment PR #2152 |
| [#2153](https://github.com/lowcoder-org/lowcoder/issues/2153) | Run timers in embedded apps; reporter confirmed the dev SDK fix. | Reporter confirmation 2026-06-10; SDK deployment PR #2152 |
| [#2172](https://github.com/lowcoder-org/lowcoder/issues/2172) | Honor form default values across controls. | 4d536622c; maintainer comment 2026-10-04 |
| [#2177](https://github.com/lowcoder-org/lowcoder/issues/2177) | Fix JavaScript Prepared Data Query execution. | 8be2fa052; maintainer comment 2026-10-04 |

## Already included in main

These 21 issues still carry the label, but their referenced changes are already ancestors of the 2.7.6 main commit. They are retained here for completeness and excluded from claims about new 3.0.0 fixes. Many are explicitly mentioned in the [2.7.6](https://github.com/lowcoder-org/lowcoder/releases/tag/2.7.6) or [2.7.5](https://github.com/lowcoder-org/lowcoder/releases/tag/2.7.5) announcements.

| Issue | Original title | Evidence in main |
| --- | --- | --- |
| [#1060](https://github.com/lowcoder-org/lowcoder/issues/1060) | [Bug]: Scanner component opens wrong URL on scanning a QR code. | 022cd512b |
| [#1065](https://github.com/lowcoder-org/lowcoder/issues/1065) | [Bug]: Continuous Scanning doesn't ignore duplicate QR code/data on Scanner component | 46599c4f6 |
| [#1289](https://github.com/lowcoder-org/lowcoder/issues/1289) | [Feat]:An option to customize the close icon in the Drawer Component. | 99ce13d1b |
| [#1290](https://github.com/lowcoder-org/lowcoder/issues/1290) | [Bug]: Drawer component is not visible all the time; the Z-index property needs to be implemented | e8bc8815a |
| [#1795](https://github.com/lowcoder-org/lowcoder/issues/1795) | [Feat]: Table Download Options | 7c17a4852 |
| [#1827](https://github.com/lowcoder-org/lowcoder/issues/1827) | [Feat]:Support Markdown in Query Notification Message | 507efa65e |
| [#1837](https://github.com/lowcoder-org/lowcoder/issues/1837) | [Feat]: Missing Border Color for Header Column and Background Color for Pagination Box and Text Color in Tolbox in Component Table | dd7fb61f8 / 984eaa56e |
| [#1840](https://github.com/lowcoder-org/lowcoder/issues/1840) | [Bug]: The theme gets lost when sorting a sortable column in a table | a1828453d |
| [#1866](https://github.com/lowcoder-org/lowcoder/issues/1866) | [Feat]: Need custom CSS Styling for tables. | e74e078eb |
| [#1867](https://github.com/lowcoder-org/lowcoder/issues/1867) | [Feat]: Button Column in Table needs to have customizable color | 32b706f20 |
| [#1937](https://github.com/lowcoder-org/lowcoder/issues/1937) | [Feat]: Tooltip for Module event Handler | 507efa65e |
| [#1979](https://github.com/lowcoder-org/lowcoder/issues/1979) | [Feat]: Expose data accessors and methods for controlling table column visibility | adccc1621 |
| [#2010](https://github.com/lowcoder-org/lowcoder/issues/2010) | [Feat]: Need a On Page Size Change Event from tables | f205a1ba5 |
| [#2012](https://github.com/lowcoder-org/lowcoder/issues/2012) | [Bug]: Action doesn't listen to the menu item "hide" attribute in Nav Menu component | e52dae8fc |
| [#2020](https://github.com/lowcoder-org/lowcoder/issues/2020) | [Bug]: Dynamic Layers in Modules messes with parent App | 8851f94a0 |
| [#2021](https://github.com/lowcoder-org/lowcoder/issues/2021) | [Bug]: Navigation and Dropdown Component inconsistencies | 30f292334 / 18fadd684 |
| [#2022](https://github.com/lowcoder-org/lowcoder/issues/2022) | [Bug]: All Editing has Tab Weird Behavior. | b16f6c2a4 |
| [#2039](https://github.com/lowcoder-org/lowcoder/issues/2039) | [Bug]: Copy to Clipboard includes Color Information | 7cfa888cf |
| [#2041](https://github.com/lowcoder-org/lowcoder/issues/2041) | [Bug]: Default value isn't working for radio boxes in a form | a4980bb0e |
| [#2063](https://github.com/lowcoder-org/lowcoder/issues/2063) | [Feat]:Add On Click/Double Click Events to Lottie Animations | beccb4d91 |
| [#2076](https://github.com/lowcoder-org/lowcoder/issues/2076) | [Bug]: URL parameters not passed when opening an App from the navigation menu. | f4109c652 |

## Publication checks

- Confirm the intended ListView behavior for #2101; the commit with that number concerns Transfer and cannot establish the ListView fix.
- Confirm the published Gantt plugin version containing the #2111 fix. The reproduction is about `setData`, not `setDate`.
- Describe #1291 as tab alignment/spacing improvements unless sticky headers and full-height behavior are separately demonstrated.
- Ship the updated embedded SDK bundle for #2149 and #2153; merging application changes alone does not prove the public bundle is current.
- After publication, reconcile the Awaiting Release labels against delivered artifacts. No issues or labels were changed during preparation.
