import { BoolControl } from "comps/controls/boolControl";
import { ColorOrBoolCodeControl, NumberControl, RadiusControl, StringControl } from "comps/controls/codeControl";
import { dropdownControl, HorizontalAlignmentControl } from "comps/controls/dropdownControl";
import { MultiCompBuilder, stateComp, valueComp, withContext, withDefault } from "comps/generators";
import { withSelectedMultiContext } from "comps/generators/withSelectedMultiContext";
import { genRandomKey } from "comps/utils/idGenerator";
import { trans } from "i18n";
import _ from "lodash";
import {
  changeChildAction,
  changeValueAction,
  CompAction,
  CompActionTypes,
  ConstructorToComp,
  ConstructorToDataType,
  ConstructorToNodeType,
  ConstructorToView,
  deferAction,
  fromRecord,
  multiChangeAction,
  withFunction,
  wrapChildAction,
} from "lowcoder-core";
import { AlignClose, AlignLeft, AlignRight, IconRadius, BorderWidthIcon, TextSizeIcon, FontFamilyIcon, TextWeightIcon, ImageCompIcon, controlItem, Dropdown, OptionType } from "lowcoder-design";
import { ColumnTypeComp, ColumnTypeCompMap } from "./columnTypeComp";
import { ColorControl } from "comps/controls/colorControl";
import { JSONValue } from "util/jsonTypes";
import styled from "styled-components";
import { TextOverflowControl } from "comps/controls/textOverflowControl";
import { default as Divider } from "antd/es/divider";
export type Render = ReturnType<ConstructorToComp<typeof RenderComp>["getOriginalComp"]>;
export const RenderComp = withSelectedMultiContext(ColumnTypeComp);

const columnWidthOptions = [
  {
    label: trans("table.auto"),
    value: "auto",
  },
  {
    label: trans("table.fixed"),
    value: "fixed",
  },
] as const;

const columnFixOptions = [
  {
    label: <AlignLeft />,
    value: "left",
  },
  {
    label: <AlignClose />,
    value: "close",
  },
  {
    label: <AlignRight />,
    value: "right",
  },
] as const;

const cellColorLabel = trans("table.cellColor");
const CellColorTempComp = withContext(
  new MultiCompBuilder({ color: ColorOrBoolCodeControl }, (props) => props.color)
    .setPropertyViewFn((children) =>
      children.color.propertyView({
        label: cellColorLabel,
        tooltip: trans("table.cellColorDesc"),
      })
    )
    .build(),
  ["currentCell"] as const
);

// @ts-ignore
export class CellColorComp extends CellColorTempComp {
  override getPropertyView() {
    return controlItem({ filterText: cellColorLabel }, super.getPropertyView());
  }
}

// fixme, should be infer from RowColorComp, but withContext type incorrect
export type CellColorViewType = (param: {
  currentCell: JSONValue | undefined; //number | string;
}) => string;

export const columnChildrenMap = {
  // column title
  title: StringControl,
  showTitle: withDefault(BoolControl, true),
  // a custom column or a data column
  isCustom: valueComp<boolean>(false),
  // If it is a data column, it must be the name of the column and cannot be duplicated as a react key
  dataIndex: valueComp<string>(""),
  hide: BoolControl,
  sortable: BoolControl,
  width: NumberControl,
  autoWidth: dropdownControl(columnWidthOptions, "auto"),
  render: RenderComp,
  align: HorizontalAlignmentControl,
  tempHide: stateComp<boolean>(false),
  fixed: dropdownControl(columnFixOptions, "close"),
  editable: BoolControl,
  background: withDefault(ColorControl, ""),
  margin: withDefault(RadiusControl, ""),
  text: withDefault(ColorControl, ""),
  border: withDefault(ColorControl, ""),
  borderWidth: withDefault(RadiusControl, ""),
  radius: withDefault(RadiusControl, ""),
  textSize: withDefault(RadiusControl, ""),
  textWeight: withDefault(StringControl, "normal"),
  fontFamily: withDefault(StringControl, "sans-serif"),
  fontStyle: withDefault(StringControl, 'normal'),
  cellColor: CellColorComp,
  textOverflow: withDefault(TextOverflowControl, "ellipsis"),
  linkColor: withDefault(ColorControl, "#3377ff"),
  linkHoverColor: withDefault(ColorControl, ""),
  linkActiveColor: withDefault(ColorControl, ""),
};

const StyledBorderRadiusIcon = styled(IconRadius)` width: 24px; margin: 0 8px 0 -3px; padding: 3px;`;
const StyledBorderIcon = styled(BorderWidthIcon)` width: 24px; margin: 0 8px 0 -3px; padding: 3px;`;
const StyledTextSizeIcon = styled(TextSizeIcon)` width: 24px; margin: 0 8px 0 -3px; padding: 3px;`;
const StyledFontFamilyIcon = styled(FontFamilyIcon)` width: 24px; margin: 0 8px 0 -3px; padding: 3px;`;
const StyledTextWeightIcon = styled(TextWeightIcon)` width: 24px; margin: 0 8px 0 -3px; padding: 3px;`;
const StyledBackgroundImageIcon = styled(ImageCompIcon)` width: 24px; margin: 0 0px 0 -12px;`;

/**
 * export for test.
 * Put it here temporarily to avoid circular dependencies
 */
const ColumnInitComp = new MultiCompBuilder(columnChildrenMap, (props, dispatch) => {
  return {
    ...props,
    onWidthResize: (width: number) => {
      dispatch(
        multiChangeAction({
          width: changeValueAction(width, true),
          autoWidth: changeValueAction("fixed", true),
        })
      );
    },
  };
})
  .setPropertyViewFn(() => <></>)
  .build();

export class ColumnComp extends ColumnInitComp {
  override reduce(action: CompAction) {
    let comp = super.reduce(action);
    if (action.type === CompActionTypes.UPDATE_NODES_V2) {
      comp = comp.setChild(
        "cellColor",
        comp.children.cellColor.reduce(
          CellColorComp.changeContextDataAction({
            currentCell: undefined,
          })
        )
      );
    }
    if (action.type === CompActionTypes.CHANGE_VALUE) {
      const title = comp.children.title.unevaledValue;
      const dataIndex = comp.children.dataIndex.getView();
      if (!Boolean(title)) {
        comp.children.title.dispatchChangeValueAction(dataIndex);
      }
    }
    return comp;
  }

  override getView() {
    const superView = super.getView();
    const columnType = this.children.render.getSelectedComp().getComp().children.compType.getView();
    return {
      ...superView,
      editable: ColumnTypeCompMap[columnType].canBeEditable() && superView.editable,
    };
  }

  exposingNode() {
    const dataIndexNode = this.children.dataIndex.exposingNode();

    const renderNode = withFunction(this.children.render.node(), (render) => ({
      wrap: render.__comp__.wrap,
      map: _.mapValues(render.__map__, (value) => value.comp),
    }));
    return fromRecord({
      dataIndex: dataIndexNode,
      render: renderNode,
    });
  }

  propertyView(key: string) {
    const columnType = this.children.render.getSelectedComp().getComp().children.compType.getView();
    const initialColumns = this.children.render.getSelectedComp().getParams()?.initialColumns as OptionType[] || [];
    const column = this.children.render.getSelectedComp().getComp().toJsonValue();
    let columnValue = '{{currentCell}}';
    if (column.comp?.hasOwnProperty('src')) {
      columnValue = (column.comp as any).src;
    } else if (column.comp?.hasOwnProperty('text')) {
      columnValue = (column.comp as any).text;
    }

    return (
      <>
        {this.children.title.propertyView({
          label: trans("table.columnTitle"),
          placeholder: this.children.dataIndex.getView(),
        })}
        <Dropdown
          showSearch={true}
          defaultValue={columnValue}
          options={initialColumns}
          label={trans("table.dataMapping")}
          onChange={(value) => {
            // Keep the previous text value, some components do not have text, the default value is currentCell
            const compType = columnType;
            let comp: Record<string, string> = { text: value};
            if(columnType === 'image') {
              comp = { src: value };
            }
            this.children.render.dispatchChangeValueAction({
              compType,
              comp,
            } as any);
          }}
        />
        {/* FIXME: cast type currently, return type of withContext should be corrected later */}
        {this.children.render.getPropertyView()}
        {this.children.showTitle.propertyView({
          label: trans("table.showTitle"),
          tooltip: trans("table.showTitleTooltip"),
        })}
        {ColumnTypeCompMap[columnType].canBeEditable() &&
          this.children.editable.propertyView({ label: trans("table.editable") })}
        {this.children.sortable.propertyView({
          label: trans("table.sortable"),
        })}
        {this.children.hide.propertyView({
          label: trans("prop.hide"),
        })}
        {this.children.align.propertyView({
          label: trans("table.align"),
          radioButton: true,
        })}
        {this.children.fixed.propertyView({
          label: trans("table.fixedColumn"),
          radioButton: true,
        })}
        {this.children.autoWidth.propertyView({
          label: trans("table.autoWidth"),
          radioButton: true,
        })}
        {this.children.autoWidth.getView() === "fixed" &&
          this.children.width.propertyView({ label: trans("prop.width") })}

        {(columnType === 'link' || columnType === 'links') && (
          <>
            <Divider style={{ margin: '12px 0' }} />
            {controlItem({}, (
              <div>
                <b>{"Link Style"}</b>
              </div>
            ))}
            {this.children.linkColor.propertyView({
              label: trans('text') // trans('style.background'),
            })}
            {this.children.linkHoverColor.propertyView({
              label: "Hover text", // trans('style.background'),
            })}
            {this.children.linkActiveColor.propertyView({
              label: "Active text", // trans('style.background'),
            })}
          </>
        )}
        <Divider style={{ margin: '12px 0' }} />
        {controlItem({}, (
          <div>
            <b>{"Column Style"}</b>
          </div>
        ))}
        {this.children.background.propertyView({
          label: trans('style.background'),
        })}
        {columnType !== 'link' && this.children.text.propertyView({
          label: trans('text'),
        })}
        {this.children.border.propertyView({
          label: trans('style.border')
        })}
        {this.children.borderWidth.propertyView({
          label: trans('style.borderWidth'),
          preInputNode: <StyledBorderIcon as={BorderWidthIcon} title="" />,
          placeholder: '1px',
        })}
        {this.children.radius.propertyView({
          label: trans('style.borderRadius'),
          preInputNode: <StyledBorderRadiusIcon as={IconRadius} title="" />,
          placeholder: '3px',
        })}
        {this.children.textSize.propertyView({
          label: trans('style.textSize'),
          preInputNode: <StyledTextSizeIcon as={TextSizeIcon} title="" />,
          placeholder: '14px',
        })}
        {this.children.textWeight.propertyView({
          label: trans('style.textWeight'),
          preInputNode: <StyledTextWeightIcon as={TextWeightIcon} title="" />,
          placeholder: 'normal',
        })}
        {this.children.fontFamily.propertyView({
          label: trans('style.fontFamily'),
          preInputNode: <StyledFontFamilyIcon as={FontFamilyIcon} title="" />,
          placeholder: 'sans-serif',
        })}
        {this.children.fontStyle.propertyView({
          label: trans('style.fontStyle'),
          preInputNode: <StyledFontFamilyIcon as={FontFamilyIcon} title="" />,
          placeholder: 'normal'
        })}
        {this.children.textOverflow.getPropertyView()}
        {this.children.cellColor.getPropertyView()}
      </>
    );
  }

  getChangeSet() {
    const dataIndex = this.children.dataIndex.getView();
    const changeSet = _.mapValues(this.children.render.getMap(), (value) =>
      value.getComp().children.comp.children.changeValue.getView()
    );
    return { [dataIndex]: changeSet };
  }

  dispatchClearChangeSet() {
    this.children.render.dispatch(
      deferAction(
        RenderComp.forEachAction(
          wrapChildAction(
            "comp",
            wrapChildAction("comp", changeChildAction("changeValue", null, false))
          )
        )
      )
    );
  }

  static setSelectionAction(key: string) {
    return wrapChildAction("render", RenderComp.setSelectionAction(key));
  }
}

export type RawColumnType = ConstructorToView<typeof ColumnComp>;
export type ColumNodeType = ConstructorToNodeType<typeof ColumnComp>;
export type ColumnCompType = ConstructorToComp<typeof ColumnComp>;

/**
 * Custom column initialization data
 */
export function newCustomColumn(): ConstructorToDataType<typeof ColumnComp> {
  return {
    title: trans("table.customColumn"),
    dataIndex: genRandomKey(),
    isCustom: true,
  };
}

/**
 * Initialization data of primary column
 */
export function newPrimaryColumn(
  key: string,
  width: number,
  title?: string,
  isTag?: boolean
): ConstructorToDataType<typeof ColumnComp> {
  return {
    title: title ?? key,
    dataIndex: key,
    isCustom: false,
    autoWidth: "fixed",
    width: width + "",
    render: { compType: isTag ? "tag" : "text", comp: { text: "{{currentCell}}" } },
  };
}
