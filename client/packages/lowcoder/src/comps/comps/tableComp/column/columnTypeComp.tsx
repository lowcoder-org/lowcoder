import { CellProps } from "components/table/EditableCell";
import { DateTimeComp } from "comps/comps/tableComp/column/columnTypeComps/columnDateTimeComp";
import { TimeComp } from "./columnTypeComps/columnTimeComp";
import { ButtonComp } from "comps/comps/tableComp/column/simpleColumnTypeComps";
import { withType } from "comps/generators";
import { trans } from "i18n";
import { Dropdown } from "lowcoder-design/src/components/Dropdown";
import { BooleanComp } from "./columnTypeComps/columnBooleanComp";
import { SwitchComp } from "./columnTypeComps/columnSwitchComp";
import { DateComp } from "./columnTypeComps/columnDateComp";
import { ImageComp } from "./columnTypeComps/columnImgComp";
import { LinkComp } from "./columnTypeComps/columnLinkComp";
import { ColumnLinksComp } from "./columnTypeComps/columnLinksComp";
import { ColumnMarkdownComp } from "./columnTypeComps/columnMarkdownComp";
import { ProgressComp } from "./columnTypeComps/columnProgressComp";
import { RatingComp } from "./columnTypeComps/columnRatingComp";
import { BadgeStatusComp } from "./columnTypeComps/columnStatusComp";
import { ColumnTagsComp } from "./columnTypeComps/columnTagsComp";
import { ColumnSelectComp } from "./columnTypeComps/columnSelectComp";
import { SimpleTextComp } from "./columnTypeComps/simpleTextComp";
import { ColumnNumberComp } from "./columnTypeComps/ColumnNumberComp";

import { ColumnAvatarsComp } from "./columnTypeComps/columnAvatarsComp";
import { ColumnDropdownComp } from "./columnTypeComps/columnDropdownComp";

const actionOptions = [
  {
    label: trans("table.avatars"),
    value: "avatars",
  },
  {
    label: trans("table.text"),
    value: "text",
  },
  {
    label: trans("table.number"),
    value: "number",
  },
  {
    label: trans("table.link"),
    value: "link",
  },
  {
    label: trans("table.links"),
    value: "links",
  },
  {
    label: trans("table.tag"),
    value: "tag",
  },
  {
    label: trans("table.select"),
    value: "select",
  },
  {
    label: trans("table.dropdown"),
    value: "dropdown",
  },
  {
    label: trans("table.badgeStatus"),
    value: "badgeStatus",
  },
  {
    label: trans("table.button"),
    value: "button",
  },
  {
    label: trans("table.image"),
    value: "image",
  },
  {
    label: trans("table.time"),
    value: "time",
  },

  {
    label: trans("table.date"),
    value: "date",
  },
  {
    label: trans("table.dateTime"),
    value: "dateTime",
  },
  {
    label: "Markdown",
    value: "markdown",
  },
  {
    label: trans("table.boolean"),
    value: "boolean",
  },
  {
    label: trans("table.switch"),
    value: "switch",
  },
  {
    label: trans("table.rating"),
    value: "rating",
  },
  {
    label: trans("table.progress"),
    value: "progress",
  },
] as const;

export const ColumnTypeCompMap = {
  avatars: ColumnAvatarsComp,
  text: SimpleTextComp,
  number: ColumnNumberComp,
  button: ButtonComp,
  badgeStatus: BadgeStatusComp,
  link: LinkComp,
  tag: ColumnTagsComp,
  select: ColumnSelectComp,
  dropdown: ColumnDropdownComp,
  links: ColumnLinksComp,
  image: ImageComp,
  markdown: ColumnMarkdownComp,
  dateTime: DateTimeComp,
  boolean: BooleanComp,
  switch: SwitchComp,
  rating: RatingComp,
  progress: ProgressComp,
  date: DateComp,
  time: TimeComp,
};

type ColumnTypeMapType = typeof ColumnTypeCompMap;
export type ColumnTypeKeys = keyof ColumnTypeMapType;

const TypedColumnTypeComp = withType(ColumnTypeCompMap, "text");

export class ColumnTypeComp extends TypedColumnTypeComp {
  override getView() {
    const childView = this.children.comp.getView();
    return {
      view: (cellProps: CellProps) => {
        return childView(cellProps);
      },
      value: this.children.comp.getDisplayValue(),
    };
  }

  private handleTypeChange: (value: ColumnTypeKeys) => void = (value) => {
    // Keep the previous text value, some components do not have text, the default value is currentCell
    let textRawData = "{{currentCell}}";
    if (this.children.comp.children.hasOwnProperty("text")) {
      textRawData = (this.children.comp.children as any).text.toJsonValue();
    }
    this.dispatchChangeValueAction({
      compType: value,
      comp: { text: textRawData },
    } as any);
  }

  override getPropertyView() {
    return (
      <>
        <Dropdown
          showSearch={true}
          value={this.children.compType.getView()}
          options={actionOptions}
          label={trans("table.columnType")}
          onChange={this.handleTypeChange}
        />
        {this.children.comp.getPropertyView()}
      </>
    );
  }
}
