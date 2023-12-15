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
import { AlignClose, AlignLeft, AlignRight, IconRadius, TextSizeIcon, controlItem } from "lowcoder-design";
import { ColumnTypeComp, ColumnTypeCompMap } from "./columnTypeComp";
import { ColorControl } from "comps/controls/colorControl";
import { JSONValue } from "util/jsonTypes";
import styled from "styled-components";
import { TextOverflowControl } from "comps/controls/textOverflowControl";
import { TableColumnLinkStyle, styleControl } from "@lowcoder-ee/index.sdk";
import { Divider } from "antd";

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
  text: withDefault(ColorControl, ""),
  border: withDefault(ColorControl, ""),
  borderWidth: withDefault(RadiusControl, ""),
  radius: withDefault(RadiusControl, ""),
  textSize: withDefault(RadiusControl, ""),
  cellColor: CellColorComp,
  textOverflow: withDefault(TextOverflowControl, "ellipsis"),
  linkColor: withDefault(ColorControl, "#3377ff"),
  linkHoverColor: withDefault(ColorControl, ""),
  linkActiveColor: withDefault(ColorControl, ""),
};

const StyledIcon = styled.span`
  margin: 0 4px 0 14px;
`;

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
    return (
      <>
        {this.children.title.propertyView({
          label: trans("table.columnTitle"),
        })}
        {/* FIXME: cast type currently, return type of withContext should be corrected later */}
        {this.children.render.getPropertyView()}
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
            <Divider style={{margin: '12px 0'}} />
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
        <Divider style={{margin: '12px 0'}} />
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
          preInputNode: <StyledIcon as={IconRadius} title="" />,	
          placeholder: '1px',
        })}
        {this.children.radius.propertyView({
          label: trans('style.borderRadius'),
          preInputNode: <StyledIcon as={IconRadius} title="" />,	
          placeholder: '3px',
        })}
        {this.children.textSize.propertyView({
          label: trans('style.textSize'),
          preInputNode: <StyledIcon as={TextSizeIcon} title="" />,	
          placeholder: '14px',
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
