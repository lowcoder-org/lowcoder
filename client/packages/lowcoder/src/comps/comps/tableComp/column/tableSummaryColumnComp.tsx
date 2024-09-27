import { RadiusControl, StringControl } from "comps/controls/codeControl";
import { HorizontalAlignmentControl } from "comps/controls/dropdownControl";
import { MultiCompBuilder, valueComp, withDefault } from "comps/generators";
import { withSelectedMultiContext } from "comps/generators/withSelectedMultiContext";
import { trans } from "i18n";
import _ from "lodash";
import {
  changeChildAction,
  CompAction,
  ConstructorToComp,
  deferAction,
  fromRecord,
  withFunction,
  wrapChildAction,
} from "lowcoder-core";
import { IconRadius, TextSizeIcon, FontFamilyIcon, TextWeightIcon, controlItem } from "lowcoder-design";
import { ColumnTypeComp } from "./columnTypeComp";
import { ColorControl } from "comps/controls/colorControl";
import styled from "styled-components";
import { TextOverflowControl } from "comps/controls/textOverflowControl";
import { default as Divider } from "antd/es/divider";
export type Render = ReturnType<ConstructorToComp<typeof RenderComp>["getOriginalComp"]>;
export const RenderComp = withSelectedMultiContext(ColumnTypeComp);

export const columnChildrenMap = {
  cellTooltip: StringControl,
  // a custom column or a data column
  isCustom: valueComp<boolean>(false),
  // If it is a data column, it must be the name of the column and cannot be duplicated as a react key
  dataIndex: valueComp<string>(""),
  render: RenderComp,
  align: HorizontalAlignmentControl,
  background: withDefault(ColorControl, ""),
  margin: withDefault(RadiusControl, ""),
  text: withDefault(ColorControl, ""),
  border: withDefault(ColorControl, ""),
  radius: withDefault(RadiusControl, ""),
  textSize: withDefault(RadiusControl, ""),
  textWeight: withDefault(StringControl, "normal"),
  fontFamily: withDefault(StringControl, "sans-serif"),
  fontStyle: withDefault(StringControl, 'normal'),
  cellColor: StringControl,
  textOverflow: withDefault(TextOverflowControl, "ellipsis"),
  linkColor: withDefault(ColorControl, "#3377ff"),
  linkHoverColor: withDefault(ColorControl, ""),
  linkActiveColor: withDefault(ColorControl, ""),
};

const StyledBorderRadiusIcon = styled(IconRadius)` width: 24px; margin: 0 8px 0 -3px; padding: 3px;`;
const StyledTextSizeIcon = styled(TextSizeIcon)` width: 24px; margin: 0 8px 0 -3px; padding: 3px;`;
const StyledFontFamilyIcon = styled(FontFamilyIcon)` width: 24px; margin: 0 8px 0 -3px; padding: 3px;`;
const StyledTextWeightIcon = styled(TextWeightIcon)` width: 24px; margin: 0 8px 0 -3px; padding: 3px;`;

/**
 * export for test.
 * Put it here temporarily to avoid circular dependencies
 */
const ColumnInitComp = new MultiCompBuilder(columnChildrenMap, (props, dispatch) => {
  return {
    ...props,
  };
})
  .setPropertyViewFn(() => <></>)
  .build();

export class SummaryColumnComp extends ColumnInitComp {
  override reduce(action: CompAction) {
    const comp = super.reduce(action);
    return comp;
  }

  override getView() {
    const superView = super.getView();
    const columnType = this.children.render.getSelectedComp().getComp().children.compType.getView();
    return {
      ...superView,
      columnType,
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
    const column = this.children.render.getSelectedComp().getComp().toJsonValue();
    let columnValue = '{{currentCell}}';
    if (column.comp?.hasOwnProperty('src')) {
      columnValue = (column.comp as any).src;
    } else if (column.comp?.hasOwnProperty('text')) {
      columnValue = (column.comp as any).text;
    }

    return (
      <>
        {this.children.cellTooltip.propertyView({
          label: trans("table.columnTooltip"),
        })}
        {this.children.render.getPropertyView()}
        {this.children.align.propertyView({
          label: trans("table.align"),
          radioButton: true,
        })}
        {(columnType === 'link' || columnType === 'links') && (
          <>
            <Divider style={{ margin: '12px 0' }} />
            {controlItem({}, (
              <div>
                <b>{"Link Style"}</b>
              </div>
            ))}
            {this.children.linkColor.propertyView({
              label: trans('text')
            })}
            {this.children.linkHoverColor.propertyView({
              label: "Hover text",
            })}
            {this.children.linkActiveColor.propertyView({
              label: "Active text",
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
        {/* {this.children.textOverflow.getPropertyView()} */}
        {this.children.cellColor.propertyView({
          label: trans("table.cellColor"),
        })}
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
