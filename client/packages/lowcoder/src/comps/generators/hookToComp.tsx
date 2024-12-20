import { JSONObject } from "util/jsonTypes";
import { simpleMultiComp, stateComp, valueComp, withViewFn } from "comps/generators";
import { withSimpleExposing } from "comps/generators/withExposing";
import { useEffect, useMemo } from "react";
import { isEqual } from "lodash";

/**
 * Enter a react hook and return a comp that exposes the data and methods provided by the hook
 */
export function hookToComp(useHookFn: () => JSONObject) {
  const TmpComp = withViewFn(
    simpleMultiComp({
      value: valueComp<JSONObject>({}),
    }),
    (comp) => {
      const hookValue = useHookFn();

      useEffect(() => {
        comp.children.value.dispatchChangeValueAction(hookValue);
      }, [hookValue]);
      return null;
    }
  );
  return withSimpleExposing(TmpComp, (comp) => comp.children.value.getView());
}

/**
 * Same as hookToComp, but comp data will not be persisted to dsl
 */
export function hookToStateComp(useHookFn: () => JSONObject) {
  const TmpComp = withViewFn(
    simpleMultiComp({
      stateValue: stateComp<JSONObject>({}),
    }),
    (comp) => {
      const hookValue = useHookFn();
      const stateValue = useMemo(() => comp.children.stateValue.getView(), [comp.children.stateValue]);

      if (!isEqual(hookValue, stateValue)) {
        comp.children.stateValue.dispatchChangeValueAction(hookValue);
      }
      return null;
    }
  );
  return withSimpleExposing(TmpComp, (comp) => comp.children.stateValue.getView());
}

/**
 * Provide a comp of static data, such as exposure of lodash, day.js library
 */
export function simpleValueComp(value: any) {
  return simpleValueGetterComp(() => value);
}

export function simpleValueGetterComp(valueGetter: () => any) {
  const TmpComp = simpleMultiComp({});
  return withSimpleExposing(TmpComp, valueGetter);
}
