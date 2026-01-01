import { BoolCodeControl, StringControl } from "comps/controls/codeControl";
import { clickEvent, eventHandlerControl } from "comps/controls/eventHandlerControl";
import { valueComp } from "comps/generators";
import { list } from "comps/generators/list";
import { parseChildrenFromValueAndChildrenMap, ToViewReturn } from "comps/generators/multi";
import { migrateOldData, withDefault } from "comps/generators/simpleGenerators";
import { disabledPropertyView, hiddenPropertyView } from "comps/utils/propertyUtils";
import { genRandomKey } from "comps/utils/idGenerator";
import { trans } from "i18n";
import _ from "lodash";
import { fromRecord, MultiBaseComp, Node, RecordNode, RecordNodeToValue } from "lowcoder-core";
import { ReactNode } from "react";
import { IconControl } from "comps/controls/iconControl";

const events = [clickEvent];

const childrenMap = {
  label: StringControl,
  icon: IconControl,
  hidden: BoolCodeControl,
  disabled: BoolCodeControl,
  active: BoolCodeControl,
  itemKey: valueComp<string>(""),
  onEvent: withDefault(eventHandlerControl(events), [
    {
      // name: "click",
      name: "click",
      handler: {
        compType: "openAppPage",
      },
    },
  ]),
};

type ChildrenType = {
  label: InstanceType<typeof StringControl>;
  icon: InstanceType<typeof IconControl>;
  hidden: InstanceType<typeof BoolCodeControl>;
  disabled: InstanceType<typeof BoolCodeControl>;
  active: InstanceType<typeof BoolCodeControl>;
  itemKey: InstanceType<ReturnType<typeof valueComp<string>>>;
  onEvent: InstanceType<ReturnType<typeof eventHandlerControl>>;
  items: InstanceType<ReturnType<typeof navListComp>>;
};

export class NavItemComp extends MultiBaseComp<ChildrenType> {
  override getView() {
    return _.mapValues(this.children, (c) => c.getView()) as ToViewReturn<ChildrenType>;
  }

  override getPropertyView(): ReactNode {
    return (
      <>
        {this.children.label.propertyView({ label: trans("label") })}
        {this.children.icon.propertyView({ label: trans("icon") })}
        {hiddenPropertyView(this.children)}
        {this.children.active.propertyView({ label: trans("navItemComp.active") })}
        {disabledPropertyView(this.children)}
        {this.children.onEvent.propertyView({ inline: true })}
      </>
    );
  }

  override parseChildrenFromValue(params: any) {
    return parseChildrenFromValueAndChildrenMap(params, {
      ...childrenMap,
      items: navListComp(),
    }) as unknown as ChildrenType;
  }

  protected override ignoreChildDefaultValue() {
    return true;
  }

  addSubItem(value: any) {
    this.children.items.addItem(value);
  }

  getItemKey(): string {
    return this.children.itemKey.getView();
  }

  exposingNode(): RecordNode<NavItemExposing> {
    return fromRecord({
      label: this.children.label.exposingNode(),
      icon: this.children.icon.exposingNode(),
      hidden: this.children.hidden.exposingNode(),
      disabled: this.children.disabled.exposingNode(),
      active: this.children.active.exposingNode(),
      items: this.children.items.exposingNode(),
    });
  }
}

type NavItemExposing = {
  label: Node<string>;
  icon: Node<any>;
  hidden: Node<boolean>;
  disabled: Node<boolean>;
  active: Node<boolean>;
  items: Node<RecordNodeToValue<NavItemExposing>[]>;
};

// Migrate old nav items to ensure they have a stable itemKey
function migrateNavItemData(oldData: any): any {
  if (!oldData) return oldData;
  
  const migrated = {
    ...oldData,
    itemKey: oldData.itemKey || genRandomKey(),
  };
  
  // Also migrate nested items recursively
  if (Array.isArray(oldData.items)) {
    migrated.items = oldData.items.map((item: any) => migrateNavItemData(item));
  }
  
  return migrated;
}

const NavItemCompMigrate = migrateOldData(NavItemComp, migrateNavItemData);

export function navListComp() {
  const NavItemListCompBase = list(NavItemCompMigrate);

  return class NavItemListComp extends NavItemListCompBase {
    addItem(value?: any) {
      const data = this.getView();
      this.dispatch(
        this.pushAction(
          value
            ? {
                ...value,
                itemKey: value.itemKey || genRandomKey(),
              }
            : {
                label: trans("menuItem") + " " + (data.length + 1),
                itemKey: genRandomKey(),
              }
        )
      );
    }

    deleteItem(index: number) {
      this.dispatch(this.deleteAction(index));
    }

    moveItem(from: number, to: number) {
      this.dispatch(this.arrayMoveAction(from, to));
    }
  };
}
