import { evalAndReduce } from "comps/utils";
import { mapValues } from "lodash";
import { ParamsStringControl } from "./paramsControl";

test("test params control", () => {
  const content = "xx{{1+2+x}}sd{{-1}}";
  let comp = new ParamsStringControl({ value: content });
  comp = evalAndReduce(comp);
  expect(comp.toJsonValue()).toEqual(content);
  expect(mapValues(comp.getView(), (v) => v({ x: 4 }))).toEqual({ "-1": -1, "1+2+x": 7 });
  const content2 = "{{3+2}}";
  comp = comp.reduce(comp.changeChildAction("text", "{{3+2}}"));
  comp = evalAndReduce(comp);
  expect(comp.toJsonValue()).toEqual(content2);
  expect(mapValues(comp.getView(), (v) => v())).toEqual({ "3+2": 5 });
});
