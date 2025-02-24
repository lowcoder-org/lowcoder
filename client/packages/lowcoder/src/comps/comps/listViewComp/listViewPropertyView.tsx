import { trans, transToNode } from "i18n";
import { Section, sectionNames } from "lowcoder-design";
import { ListViewImplComp } from "./listViewComp";
import { ListCompType } from "./listViewUtils";
import { useContext } from "react";
import { EditorContext } from "comps/editorState";
import { disabledPropertyView, hiddenPropertyView, showDataLoadingIndicatorsPropertyView } from "comps/utils/propertyUtils";

type Props = {
  comp: InstanceType<typeof ListViewImplComp>;
};

export function listPropertyView(compType: ListCompType) {
  return (props: Props) => {
    const { comp } = props;
    const children = comp.children;
    return (
      <>
        <Section name={sectionNames.basic}>
          {children.noOfRows.propertyView({
            label: trans("listView.dataDesc"),
            tooltip: trans("listView.dataTooltip"),
          })}
          {compType === "grid" &&
            children.noOfColumns.propertyView({
              label: trans("listView.noOfColumns"),
            })}
          {children.itemIndexName.propertyView({
            label: trans("listView.itemIndexName"),
            tooltip: transToNode("listView.itemIndexNameDesc", {
              default: (
                <b>
                  <i>i</i>
                </b>
              ),
            }),
          })}
          {children.itemDataName.propertyView({
            label: trans("listView.itemDataName"),
            tooltip: transToNode("listView.itemDataNameDesc", {
              default: (
                <b>
                  <i>currentItem</i>
                </b>
              ),
            }),
          })}
        </Section>

        {(useContext(EditorContext).editorModeStatus === "logic" || useContext(EditorContext).editorModeStatus === "both") && (
          <Section name={trans("prop.pagination")}>
            {comp.children.pagination.getPropertyView()}
          </Section>
        )}

        {(useContext(EditorContext).editorModeStatus === "logic" || useContext(EditorContext).editorModeStatus === "both") && (
          <Section name={sectionNames.interaction}>
            {hiddenPropertyView(children)}
            {showDataLoadingIndicatorsPropertyView(children)}
          </Section>
        )}

        {(useContext(EditorContext).editorModeStatus === "layout" || useContext(EditorContext).editorModeStatus === "both") && (
          <><Section name={sectionNames.layout}>
              {children.horizontalGridCells.propertyView({
                label: trans('prop.horizontalGridCells'),
              })}
              {children.autoHeight.getPropertyView()}
              {(!children.autoHeight.getView()) && !children.horizontal.getView()&&
                children.showVerticalScrollbar.propertyView({
                label: trans("prop.showVerticalScrollbar"),
               }  
              )}
              {(children.horizontal.getView()) && 
                children.showHorizontalScrollbar.propertyView({
                label: trans("prop.showHorizontalScrollbar"),
               }  
              )}
              {children.horizontal.propertyView({
                label: trans("prop.horizontal"),
              })}
              {children.horizontal.getView() && (
                children.minHorizontalWidth.propertyView({
                  label: trans("prop.minHorizontalWidth"),
                  placeholder: '100px',
                })
              )}
            </Section>
            <Section name={sectionNames.style}>
              {children.style.getPropertyView()}
            </Section>
            <Section name={sectionNames.animationStyle} hasTooltip={true}>
              {children.animationStyle.getPropertyView()}
            </Section></>
        )}
   
      </>
    );
  };
}
