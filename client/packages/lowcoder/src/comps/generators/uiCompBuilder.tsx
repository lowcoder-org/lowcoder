import { BoolCodeControl, StringControl } from "comps/controls/codeControl";
import React, { ReactNode, useContext, useRef } from "react";
import { ExternalEditorContext } from "util/context/ExternalEditorContext";
import { Comp, CompParams, MultiBaseComp } from "lowcoder-core";
import {
  childrenToProps,
  parseChildrenFromValueAndChildrenMap,
  PropertyView,
  PropertyViewFnTypeForComp,
  ToConstructor,
  ToDataType,
  ToNodeType,
  ViewFnTypeForComp,
} from "./multi";
import {
  ChildrenToComp,
  ExposingConfig,
  withExposingConfigs,
} from "./withExposing";
import {
  ExposeMethodCompConstructor,
  MethodConfigsType,
  withMethodExposing,
} from "./withMethodExposing";
import { Section } from "lowcoder-design";
import { trans } from "i18n";

export type NewChildren<ChildrenCompMap extends Record<string, Comp<unknown>>> =
  ChildrenCompMap & {
    hidden: InstanceType<typeof BoolCodeControl>;
    className: InstanceType<typeof StringControl>;
    dataTestId: InstanceType<typeof StringControl>;
  };

export function HidableView(props: {
  children: JSX.Element | React.ReactNode;
  hidden: boolean;
}) {
  const { readOnly } = useContext(ExternalEditorContext);
  if (readOnly) {
    return <>{props.children}</>;
  } else {
    return (
      <>
        {props.hidden ? (
          <div style={{ opacity: "50%", width: "100%", height: "100%" }}>
            {props.children}
          </div>
        ) : (
          <>{props.children}</>
        )}
      </>
    );
  }
}

export function ExtendedPropertyView<
  ChildrenCompMap extends Record<string, Comp<unknown>>,
>(props: {
  children: JSX.Element | React.ReactNode,
  childrenMap: NewChildren<ChildrenCompMap>
}
) {
  return (
    <>
      {props.children}
      <Section name={trans("prop.component")}>
        {props.childrenMap.className?.propertyView({ label: trans("prop.className") })}
        {props.childrenMap.dataTestId?.propertyView({ label: trans("prop.dataTestId") })}
      </Section>
    </>
  );
}

export function uiChildren<
  ChildrenCompMap extends Record<string, Comp<unknown>>,
>(
  childrenMap: ToConstructor<ChildrenCompMap>
): ToConstructor<NewChildren<ChildrenCompMap>> {
  return {
    ...childrenMap,
    hidden: BoolCodeControl,
    className: StringControl,
    dataTestId: StringControl
  } as any;
}

type ViewReturn = ReactNode;

/**
 * UI components can be constructed with this class, providing the hidden interface
 */
export class UICompBuilder<
  ChildrenCompMap extends Record<string, Comp<unknown>>,
> {
  private childrenMap: ToConstructor<ChildrenCompMap>;
  private viewFn: ViewFnTypeForComp<ViewReturn, NewChildren<ChildrenCompMap>>;
  private propertyViewFn: PropertyViewFnTypeForComp<
    NewChildren<ChildrenCompMap>
  > = () => null;
  private stateConfigs: ExposingConfig<ChildrenToComp<ChildrenCompMap>>[] = [];
  private methodConfigs: MethodConfigsType<ExposeMethodCompConstructor<any>> =
    [];

  /**
   * If viewFn is not placed in the constructor, the type of ViewReturn cannot be inferred
   */
  constructor(
    childrenMap: ToConstructor<ChildrenCompMap>,
    viewFn: ViewFnTypeForComp<ViewReturn, NewChildren<ChildrenCompMap>>
  ) {
    this.childrenMap = childrenMap;
    this.viewFn = viewFn;
  }

  setPropertyViewFn(
    propertyViewFn: PropertyViewFnTypeForComp<NewChildren<ChildrenCompMap>>
  ) {
    this.propertyViewFn = this.decoratePropertyViewFn(propertyViewFn);
    return this;
  }

  decoratePropertyViewFn(
    propertyViewFn: PropertyViewFnTypeForComp<NewChildren<ChildrenCompMap>>
  ): PropertyViewFnTypeForComp<NewChildren<ChildrenCompMap>> {
    return (childrenMap, dispatch) => {
      return (
        <ExtendedPropertyView childrenMap={childrenMap}>
          {propertyViewFn(childrenMap, dispatch)}
        </ExtendedPropertyView>
      );
    };
  }

  setExposeStateConfigs(
    configs: ExposingConfig<ChildrenToComp<ChildrenCompMap>>[]
  ) {
    this.stateConfigs = configs;
    return this;
  }

  setExposeMethodConfigs(
    configs: MethodConfigsType<
      ExposeMethodCompConstructor<MultiBaseComp<ChildrenCompMap>>
    >
  ) {
    this.methodConfigs = configs;
    return this;
  }

  build() {
    const reservedProps = ["hidden", "className", "dataTestId"];
    for (const reservedProp of reservedProps) {
      if (this.childrenMap.hasOwnProperty(reservedProp)) {
        throw new Error(`Property »${reservedProp}« is reserved and must not be implemented in components!`);
      }
    }
    const newChildrenMap = uiChildren(this.childrenMap);
    const builder = this;

    class MultiTempComp extends MultiBaseComp<
      NewChildren<ChildrenCompMap>,
      ToDataType<NewChildren<ChildrenCompMap>>,
      ToNodeType<NewChildren<ChildrenCompMap>>
    > {
      ref: React.RefObject<HTMLDivElement> = React.createRef();

      override parseChildrenFromValue(
        params: CompParams<ToDataType<NewChildren<ChildrenCompMap>>>
      ): NewChildren<ChildrenCompMap> {
        return parseChildrenFromValueAndChildrenMap(params, newChildrenMap);
      }

      protected override ignoreChildDefaultValue() {
        return true;
      }

      override getRef(): React.RefObject<HTMLDivElement> {
        return this.ref;
      }

      override getView(): ViewReturn {
        return (
          <UIView
            innerRef={this.ref}
            comp={this}
            viewFn={builder.viewFn}
          />
        );
      }

      override getPropertyView(): ReactNode {
        return (
          <PropertyView comp={this} propertyViewFn={builder.propertyViewFn} />
        );
      }
    }

    return withExposingConfigs(
      withMethodExposing(
        MultiTempComp,
        this.methodConfigs as MethodConfigsType<
          ExposeMethodCompConstructor<MultiTempComp>
        >
      ) as typeof MultiTempComp,
      this.stateConfigs
    );
  }
}

export const DisabledContext = React.createContext<boolean>(false);

/**
 * Guaranteed to be in a react component, so that react hooks can be used internally
 */
function UIView(props: {
  innerRef: React.RefObject<HTMLDivElement>;
  comp: any;
  viewFn: any;
}) {
  const comp = props.comp;

  const childrenProps = childrenToProps(comp.children);
  const parentDisabled = useContext(DisabledContext);
  const disabled = childrenProps["disabled"];
  if (disabled !== undefined && typeof disabled === "boolean") {
    childrenProps["disabled"] = disabled || parentDisabled;
  }

  //ADDED BY FRED
  if (childrenProps.events) {
    const events = childrenProps.events as { value?: any[] };
    if (!events.value || events.value.length === 0) {
      events.value = [];
    }
  }
  //END ADD BY FRED

  return (
    <div
      ref={props.innerRef}
      className={childrenProps.className as string}
      data-testid={childrenProps.dataTestId as string}
      style={{
        width: "100%",
        height: "100%",
        margin: "0px",
        padding: "0px",
      }}>
      <HidableView hidden={childrenProps.hidden as boolean}>
        {props.viewFn(
          childrenProps,
          comp.dispatch
        )}
      </HidableView>
    </div>
  );
}
