import { ExecuteAction } from "comps/controls/actionSelector/executeCompTypes";
import { simpleMultiComp, valueComp } from "comps/generators";
import { withSimpleExposing } from "comps/generators/withExposing";
import { withMethodExposing } from "comps/generators/withMethodExposing";
import { evalAndReduce } from "comps/utils";
import { customAction } from "lowcoder-core";
import { RemoteCompInfo } from "types/remoteComp";
import { lazyLoadComp } from "./lazyLoadComp";

const npmRemoteInfo: RemoteCompInfo = {
  isRemote: true,
  source: "npm",
  packageName: "p",
  packageVersion: "v",
  compName: "n",
};

let TestComp = simpleMultiComp({ hello: valueComp<number>(123) });
TestComp = withSimpleExposing(TestComp, (comp) => {
  return {
    hello: comp.children.hello.getView(),
  };
});
TestComp = withMethodExposing(TestComp, [
  {
    method: {
      name: "add",
      params: [{ name: "value", type: "number" }],
    },
    execute: (comp, values) => {
      const hello = comp.children.hello;
      hello.dispatchChangeValueAction(hello.getView() + (values[0] as number));
    },
  },
]);
export {
  TestComp,
};

// const RComp = lazyLoadComp('TestComp', './lazyLoadComp.test.tsx');

test("lazyload comp", async () => {
  let c: any = null;
  const RComp = await lazyLoadComp('TestComp', './lazyLoadComp.test.tsx');
  c = new RComp({
    dispatch: (action) => {
      if (c) {
        c = c.reduce(action);
      }
    },
  });

  expect(c.toJsonValue()).toBe(undefined);
  await c.load();
  expect(c.toJsonValue()).toBe(123);

  c.dispatchChangeValueAction(345);
  expect(c.toJsonValue()).toBe(345);
});

test("lazyload comp keep values", async () => {
  let c: any = null;
  const RComp = await lazyLoadComp('TestComp', './lazyLoadComp.test.tsx');
  c = new RComp({
    dispatch: (action) => {
      if (c) {
        c = c.reduce(action);
      }
    },
    value: 456,
  });

  expect(c.toJsonValue()).toBe(456);
  await c.load();
  expect(c.toJsonValue()).toBe(456);
});

test("lazyload comp exposing data", async () => {
  // const EComp = lazyLoadComp('comp-path', async () => {
  //   return withSimpleExposing(simpleMultiComp({ hello: valueComp(123) }), (comp) => {
  //     return {
  //       hello: comp.children.hello.getView(),
  //     };
  //   });
  // });
  const EComp = await lazyLoadComp('TestComp', './lazyLoadComp.test.tsx');

  let c: any = null;
  c = new EComp({
    dispatch: (action) => {
      if (c) {
        c = c.reduce(action);
      }
    },
  });

  await c.load();
  const c1 = evalAndReduce(c);
  expect(c1.exposingValues.hello).toBe(123);
});

test("lazyload comp execute method", async () => {
  // const MComp = lazyLoadComp('comp-path', async () => {
  //   return withMethodExposing(simpleMultiComp({ hello: valueComp<number>(123) }), [
  //     {
  //       method: {
  //         name: "add",
  //         params: [{ name: "value", type: "number" }],
  //       },
  //       execute: (comp, values) => {
  //         const hello = comp.children.hello;
  //         hello.dispatchChangeValueAction(hello.getView() + (values[0] as number));
  //       },
  //     },
  //   ]);
  // });
  const MComp = await lazyLoadComp('TestComp', './lazyLoadComp.test.tsx');
  let c: any = null;
  c = new MComp({
    dispatch: (action) => {
      if (c) {
        c = c.reduce(action);
      }
    },
  });

  await c.load();
  c.reduce(
    customAction<ExecuteAction>(
      {
        type: "execute",
        methodName: "add",
        params: [10],
      },
      false
    )
  );
  await new Promise((r) => setTimeout(r, 20));
  expect(c.children.hello.getView()).toEqual(133);
});
