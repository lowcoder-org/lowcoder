import { JSONValue } from "util/jsonTypes";
import { AutoHeightControl } from "comps/controls/autoHeightControl";
import { BoolControl } from "comps/controls/boolControl";
import { styleControl } from "comps/controls/styleControl";
import {
  ContainerStyle,
  ContainerHeaderStyle,
  ContainerBodyStyle,
  ContainerSiderStyle,
  ContainerFooterStyle,
} from "comps/controls/styleControlConstants";
import { MultiCompBuilder, sameTypeMap, withDefault } from "comps/generators";
import { migrateOldData } from "comps/generators/simpleGenerators";
import { NameGenerator } from "comps/utils";
import { fromRecord, Node } from "lowcoder-core";
import { nodeIsRecord } from "lowcoder-core";
import _ from "lodash";
import { lastValueIfEqual } from "util/objectUtils";
import {
  CompTree,
  fixOldStyleData,
  IContainer,
  mergeCompTrees,
  traverseCompTree,
} from "../containerBase";
import { SimpleContainerComp } from "../containerBase/simpleContainerComp";
import { ContainerBodyChildComp } from "./containerBodyChildComp";
import { trans } from "i18n";
import { ControlNode } from "lowcoder-design";
import { StringControl } from "comps/controls/codeControl";

const childrenMap = {
  header: SimpleContainerComp,
  sider: SimpleContainerComp,
  body: withDefault(sameTypeMap(ContainerBodyChildComp), {
    0: { view: { layout: {}, items: {} } },
  }),
  showApp: BoolControl,
  contentApp: StringControl,
  baseUrl: StringControl,
  footer: SimpleContainerComp,
  showHeader: BoolControl.DEFAULT_TRUE,
  showSider: BoolControl.DEFAULT_TRUE,
  innerSider: BoolControl.DEFAULT_TRUE,
  siderCollapsible: withDefault(BoolControl, false),
  siderCollapsed : withDefault(BoolControl, false),
  siderRight: withDefault(BoolControl, false),
  siderWidth: withDefault(StringControl, "20%"),
  siderCollapsedWidth: withDefault(StringControl, "0"),
  showFooter: BoolControl,
  autoHeight: AutoHeightControl,
  siderScrollbars: withDefault(BoolControl, false),
  contentScrollbars: withDefault(BoolControl, false),
  style: withDefault(styleControl(ContainerStyle),{borderWidth:'1px'}),
  headerStyle: styleControl(ContainerHeaderStyle),
  siderStyle: styleControl(ContainerSiderStyle),
  bodyStyle: styleControl(ContainerBodyStyle),
  footerStyle: styleControl(ContainerFooterStyle),
};

// Compatible with old style data 2022-8-15
const layoutBaseComp = migrateOldData(
  new MultiCompBuilder(childrenMap, (props, dispatch) => {
    return { ...props, dispatch };
  }).build(),
  fixOldStyleData
);

export class PageLayoutComp extends layoutBaseComp implements IContainer {
  // scrollbars: any;
  private allContainers() {
    return [
      this.children.header,
      this.children.sider,
      ...Object.values(this.children.body.getView()).map((c) => c.children.view),
      this.children.footer,
    ];
  }
  realSimpleContainer(key?: string): SimpleContainerComp | undefined {
    if (_.isNil(key)) return this.children.body.getView()["0"].children.view;
    return this.allContainers().find((container) => container.realSimpleContainer(key));
  }
  getCompTree(): CompTree {
    return mergeCompTrees(this.allContainers().map((c) => c.getCompTree()));
  }
  findContainer(key: string): IContainer | undefined {
    for (const container of this.allContainers()) {
      const foundContainer = container.findContainer(key);
      if (foundContainer) {
        return foundContainer === container ? this : foundContainer;
      }
    }
    return undefined;
  }
  getPasteValue(nameGenerator: NameGenerator): JSONValue {
    return {
      ...this.toJsonValue(),
      header: this.children.header.getPasteValue(nameGenerator),
      sider: this.children.sider.getPasteValue(nameGenerator),
      body: _.mapValues(this.children.body.getView(), (comp) => {
        return {
          ...comp.toJsonValue(),
          view: comp.children.view.getPasteValue(nameGenerator),
        };
      }),
      footer: this.children.footer.getPasteValue(nameGenerator),
    };
  }
  override autoHeight(): boolean {
    return this.children.autoHeight.getView();
  }

  exposingNode() {
    // The exposingNodes of the container subcomponents are put together
    const allNodes: Record<string, Node<unknown>> = {};
    traverseCompTree(this.getCompTree(), (item) => {
      const comp = item.children.comp;
      let node = comp.exposingNode();
      // plus formDataKey
      if (nodeIsRecord(node) && !node.children.hasOwnProperty("formDataKey")) {
        const formDataKey = comp.children["formDataKey"];
        if (formDataKey) {
          node = fromRecord({ ...node.children, formDataKey: formDataKey.exposingNode() });
        }
      }
      allNodes[item.children.name.getView()] = node;
      return true;
    });
    return lastValueIfEqual(this, "exposing_node", fromRecord(allNodes), checkEquals);
  }

  getPropertyView(): ControlNode {    
    return [this.areaPropertyView(), this.heightPropertyView()];
  }

  areaPropertyView() {
    return [
      this.children.showHeader.propertyView({ label: trans("prop.showHeader") }),
      this.children.showSider.propertyView({ label: trans("prop.showSider") }),
      this.children.siderRight.propertyView({ label: trans("prop.siderRight") }),
      this.children.innerSider.propertyView({ label: trans("prop.innerSider") }),
      this.children.siderCollapsible.propertyView({ label: trans("prop.siderCollapsible") }),
      this.children.siderCollapsed.propertyView({ label: trans("prop.siderCollapsed") }),
      this.children.showFooter.propertyView({ label: trans("prop.showFooter") }),
      this.children.siderWidth.propertyView({ label: trans("prop.siderWidth"), tooltip : trans("prop.siderWidthTooltip") }),
      this.children.siderCollapsedWidth.propertyView({ label: trans("prop.siderCollapsedWidth"), tooltip : trans("prop.siderCollapsedWidthTooltip") }),
    ];
  }

  heightPropertyView() {
    return [
      this.children.autoHeight.getPropertyView(),
      this.children.siderScrollbars.propertyView({ label: trans("prop.siderScrollbar")}),
      (!this.children.autoHeight.getView()) && this.children.contentScrollbars.propertyView({ label: trans("prop.contentScrollbar") }),
    ];
  }

  appSelectorPropertyView() {
    return [
      this.children.showApp.propertyView({ label: trans("prop.showApp"), tooltip: trans("prop.showAppTooltip") }),
      this.children.showApp.getView() && this.children.contentApp.propertyView({ label: trans("prop.appID") }), 
      this.children.showApp.getView() && this.children.baseUrl.propertyView({ label: trans("prop.baseURL") }),
    ];
  }

  stylePropertyView() {
    return this.children.style.getPropertyView();
  }

  headerStylePropertyView() {
    return this.children.headerStyle.getPropertyView();
  }

  siderStylePropertyView() {
    return this.children.siderStyle.getPropertyView();
  }

  bodyStylePropertyView() {
    return this.children.bodyStyle.getPropertyView();
  }

  footerStylePropertyView() {
    return this.children.footerStyle.getPropertyView();
  }
}

function checkEquals(node1: Node<unknown>, node2: Node<unknown>): boolean {
  if (node1 === node2) {
    return true;
  }
  if (node1 && node2 && nodeIsRecord(node1) && nodeIsRecord(node2)) {
    const a = node1.children;
    const b = node2.children;
    const keys = Object.keys(a);
    return (
      keys.length === Object.keys(b).length && keys.every((key) => checkEquals(a[key], b[key]))
    );
  }
  return false;
}
