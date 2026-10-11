import { ReactNode } from "react";
import { SimpleComp } from "lowcoder-core";
import { ControlPropertyViewWrapper, wrapperToControlItem } from "lowcoder-design";
import { ControlParams } from "./controlParams";

// Retain the serialized values so retiring the catalogue does not break saved apps.
export enum AssetType {
  ICON = "icon",
  ILLUSTRATION = "illustration",
  LOTTIE = "lottie",
}

export type IconScoutAsset = {
  uuid: string;
  value: string;
  preview: string;
};

export function IconscoutControl(_assetType: string = AssetType.ICON) {
  return class IconscoutControl extends SimpleComp<IconScoutAsset> {
    readonly IGNORABLE_DEFAULT_VALUE = false;

    protected getDefaultValue(): IconScoutAsset {
      return { uuid: "", value: "", preview: "" };
    }

    override getPropertyView(): ReactNode {
      throw new Error("Method not implemented.");
    }

    propertyView(params: ControlParams & { type?: "switch" | "checkbox" }) {
      return wrapperToControlItem(
        <ControlPropertyViewWrapper {...params}>
          <span>Premium Media Pack has been retired. Existing assets remain in your app. Select the standard source to replace this asset.</span>
        </ControlPropertyViewWrapper>
      );
    }
  };
}
