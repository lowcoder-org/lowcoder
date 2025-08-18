import { CellViewReturn } from "components/table/EditableCell";
import { stateComp } from "comps/generators";
import {
  MultiCompBuilder,
  PropertyViewFnTypeForComp,
  ToConstructor,
  ViewFnTypeForComp,
} from "comps/generators/multi";
import _ from "lodash";
import {
  CompConstructor,
  ConstructorToNodeType,
  fromRecord,
  NodeToValue,
  RecordConstructorToComp,
  withFunction,
} from "lowcoder-core";
import { ReactNode } from "react";
import { JSONValue } from "util/jsonTypes";

export const __COLUMN_DISPLAY_VALUE_FN = "__COLUMN_DISPLAY_VALUE_FN";

type RecordConstructorToNodeValue<T> = {
  [K in keyof T]: NodeToValue<ConstructorToNodeType<T[K]>>;
};

type ViewValueFnType<ChildrenCtorMap extends Record<string, CompConstructor<unknown>>> = (
  nodeValue: RecordConstructorToNodeValue<ChildrenCtorMap>
) => JSONValue;

export type ColumnTypeViewFn<ChildrenCtroMap, T extends JSONValue, ViewReturn> = ViewFnTypeForComp<
  ViewReturn,
  RecordConstructorToComp<ChildrenCtroMap>
>;

export class ColumnTypeCompBuilder<
  ChildrenCtorMap extends Record<string, CompConstructor<unknown>>,
  T extends JSONValue = JSONValue
> {
  private childrenMap: ChildrenCtorMap;
  private propertyViewFn?: PropertyViewFnTypeForComp<
    RecordConstructorToComp<ChildrenCtorMap>
  >;
  private stylePropertyViewFn?: PropertyViewFnTypeForComp<
    RecordConstructorToComp<ChildrenCtorMap>
  >;
  private cleanupFunctions: (() => void)[] = [];

  constructor(
    childrenMap: ChildrenCtorMap,
    private viewFn: ColumnTypeViewFn<ChildrenCtorMap, T, ReactNode>,
    private displayValueFn: ViewValueFnType<ChildrenCtorMap>,
    private baseValueFn?: ColumnTypeViewFn<ChildrenCtorMap, T, T>
  ) {
    this.childrenMap = { ...childrenMap } as ChildrenCtorMap;
  }

  setEditViewFn(_: any) {
    // Edit views are disabled in Table Lite; keep chainability without storing
    return this;
  }

  setPropertyViewFn(
    propertyViewFn: PropertyViewFnTypeForComp<
      RecordConstructorToComp<ChildrenCtorMap>
    >
  ) {
    this.propertyViewFn = propertyViewFn;
    return this;
  }

  setStylePropertyViewFn(
    stylePropertyViewFn: PropertyViewFnTypeForComp<
      RecordConstructorToComp<ChildrenCtorMap>
    >
  ) {
    this.stylePropertyViewFn = stylePropertyViewFn;
    return this;
  }

  build() {
    if (!this.propertyViewFn) {
      throw new Error("need property view fn");
    }

    // Memoize the props processing
    const memoizedViewFn = _.memoize(
      (props: any, dispatch: any) => {
          const baseValue = this.baseValueFn?.(props, dispatch);
          const normalView = this.viewFn(props, dispatch);
          return normalView;
      },
      (props) => {
        let safeOptions = [];
        let safeAvatars = [];
        if(props.options) {
          safeOptions = props.options.map((option: Record<string, any>) => {
            const {prefixIcon, suffixIcon, ...safeOption} = option;
            return safeOption;
          })
        }
        if(props.avatars) {
          safeAvatars = props.avatars.map((avatar: Record<string, any>) => {
            const {AvatarIcon, ...safeAvatar} = avatar;
            return safeAvatar;
          })
        }
        const {
          prefixIcon,
          suffixIcon,
          iconFalse,
          iconTrue,
          iconNull,
          tagColors,
          options,
          avatars,
          ...safeProps
        } = props;
        return safeProps;
      }
    );

    const viewFn: ColumnTypeViewFn<ChildrenCtorMap, T, CellViewReturn> =
      (props, dispatch): CellViewReturn =>
      (cellProps) => memoizedViewFn({ ...props, ...cellProps } as any, dispatch);

    const ColumnTypeCompTmp = new MultiCompBuilder(
      (this.childrenMap as unknown) as ToConstructor<
        RecordConstructorToComp<ChildrenCtorMap>
      >,
      viewFn
    )
      .setPropertyViewFn(this.propertyViewFn)
      .build();

    const displayValueFn = this.displayValueFn;

    return class extends ColumnTypeCompTmp {
      // table cell data
      private _displayValue: JSONValue = null;
      private cleanupFunctions: (() => void)[] = [];
      constructor(props: any) {
        super(props);
        this.cleanupFunctions.push(() => {
          this._displayValue = null;
          memoizedViewFn.cache.clear?.();
        });
      }

      override extraNode() {
        return {
          node: {
            [__COLUMN_DISPLAY_VALUE_FN]: withFunction(
              fromRecord(this.childrenNode()),
              () => displayValueFn
            ),
          },
          updateNodeFields: (value: any) => {
            const displayValueFunc = value[__COLUMN_DISPLAY_VALUE_FN];
            this._displayValue = displayValueFunc(value);
            return { displayValue: this._displayValue };
          },
        };
      }

      /**
       * Get the data actually displayed by the table cell
       */
      getDisplayValue() {
        return this._displayValue;
      }

      static canBeEditable() {
        return false;
      }

      componentWillUnmount() {
        // Cleanup all registered cleanup functions
        this.cleanupFunctions.forEach(cleanup => cleanup());
        this.cleanupFunctions = [];
      }
    };
  }

  // Cleanup method to be called when the builder is no longer needed
  cleanup() {
    this.cleanupFunctions.forEach(cleanup => cleanup());
    this.cleanupFunctions = [];
  }
}
