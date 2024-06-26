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
import { BoolControl } from "../controls/boolControl";
import { valueComp, withDefault } from "./simpleGenerators";

export type NewChildren<ChildrenCompMap extends Record<string, Comp<unknown>>> =
  ChildrenCompMap & {
    hidden: InstanceType<typeof BoolCodeControl>;
    className: InstanceType<typeof StringControl>;
    dataTestId: InstanceType<typeof StringControl>;
    preventStyleOverwriting: InstanceType<typeof BoolControl>;
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
        {props.childrenMap.preventStyleOverwriting?.propertyView({ label: trans("prop.preventOverwriting") })}
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
    dataTestId: StringControl,
    preventStyleOverwriting: withDefault(BoolControl, false),
    appliedThemeId: valueComp<string>(''),
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
    const reservedProps = ["hidden", "className", "dataTestId", "preventStyleOverwriting", "appliedThemeId"];
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
  const disabled = childrenProps['disabled'];
  if (disabled !== undefined && typeof disabled === 'boolean') {
    childrenProps['disabled'] = disabled || parentDisabled;
  }

  //ADDED BY FRED
  if (childrenProps.events) {
    const events = childrenProps.events as {value?: any[]};
    if (!events.value || events.value.length === 0) {
      events.value = [];
    }
  }
  //END ADD BY FRED

  // render condition for modal and drawer as we are not getting compType here
  if (comp.children.hasOwnProperty('showMask') && comp.children.hasOwnProperty('maskClosable')) {
    return (
      <HidableView hidden={childrenProps.hidden as boolean}>
        {props.viewFn(
          childrenProps,
          comp.dispatch
        )}
      </HidableView>
    );
  }

  let defaultChildren = comp.children;
  const isNotContainer = defaultChildren.hasOwnProperty('style');
  const restrictPaddingOnRotation = defaultChildren.hasOwnProperty('restrictPaddingOnRotation');
  let rotationVal:any = null
  let boxShadowVal:any = null;
  let restrictPaddingOnRotationVal:any=null;
  if (isNotContainer) {
    rotationVal = defaultChildren.style.children?.rotation?.valueAndMsg.value;
    boxShadowVal = defaultChildren.style?.children?.boxShadow?.valueAndMsg?.value;
    restrictPaddingOnRotationVal = defaultChildren?.restrictPaddingOnRotation?.valueAndMsg?.value;
  }
  const getPadding = () => {
    if (
      (rotationVal === null ||
        rotationVal === undefined ||
        restrictPaddingOnRotation) &&
      (boxShadowVal === null ||
        boxShadowVal === undefined ||
        boxShadowVal === '0px')
    ) {
      if (restrictPaddingOnRotationVal === 'qrCode') {
        if (rotationVal !== '' && rotationVal !== '0deg') {
          return '35% 0px';
        } else {
          return '0px';
        }
      } else if (restrictPaddingOnRotationVal === 'image') {
        if (rotationVal !== '' && rotationVal !== '0deg') {
          return '10% 0px';
        } else {
          return '0px';
        }
      } else if (restrictPaddingOnRotationVal === 'controlButton') {
        if (rotationVal !== '' && rotationVal !== '0deg') {
          return '10% 0px';
        } else {
          return '0px';
        }
      } else {
        return '0px'; // Both rotation and box-shadow are empty or restricted
      }
    }else if (
      rotationVal === null ||
      rotationVal === undefined ||
      rotationVal === '0px'
    ){return '0px'} else if (rotationVal !== '' && rotationVal !== '0deg') {
      // Rotation applied
      if (
        boxShadowVal === null ||
        boxShadowVal === undefined ||
        boxShadowVal === '0px'
      ) {
        return `calc(min(50%, ${Math.abs(rotationVal.replace('deg', '')) / 90} * 100%)) 0px`;
      } else if (boxShadowVal !== '' && boxShadowVal !== '0px') {
        // Both rotation and box-shadow applied
        return `calc(min(50%, ${Math.abs(rotationVal.replace('deg', '') + parseFloat(boxShadowVal.replace('px', ''))) / 90} * 100%)) 0px`;
      } else {
        return `calc(min(50%, ${Math.abs(rotationVal.replace('deg', '')) / 90} * 100%)) 0px`; // Only rotation applied
      }
    } else if (
      boxShadowVal === null ||
      boxShadowVal === undefined ||
      boxShadowVal === '0px'
    ) {
      return '0px';
    } else if (boxShadowVal !== '' && boxShadowVal !== '0px') {
      // Box-shadow applied
      return `calc(min(50%, ${Math.abs(parseFloat(boxShadowVal.replace('px', ''))) / 90} * 100%)) 0px`;
    } else {
      return '0px'; // Default value if neither rotation nor box-shadow is applied
    }
  };

  return (
    <div
      ref={props.innerRef}
      className={childrenProps.className as string}
      data-testid={childrenProps.dataTestId as string}
      style={{
        width: '100%',
        height: '100%',
        margin: '0px',
        padding:getPadding()
          
      }}
    >
      <HidableView hidden={childrenProps.hidden as boolean}>
        {props.viewFn(childrenProps, comp.dispatch)}
      </HidableView>
    </div>
  );
}
