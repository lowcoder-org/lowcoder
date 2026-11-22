import { expect, test } from "@playwright/test";
import {
  appDsl,
  barChart,
  button,
  component,
  containerOf,
  dataResponder,
  eventHandler,
  executeComp,
  executeQuery,
  hook,
  input,
  jsQuery,
  moduleApp,
  moduleInstance,
  N8N_NAME_PARAM_KEY,
  n8nWorkflowsQuery,
  postgresQuery,
  recordedHookOf,
  runScript,
  setTempState,
  stackItems,
  table,
  tempState,
  text,
  transformer,
  triggerModuleEvent,
  type DslItem,
} from "../../src/dsl/builders";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { RECORDED_N8N_DIR, RecordedFixtureError, recordedBaseHooks, recordedItem, recordedN8nDatasource, recordedN8nQuery } from "../../src/dsl/recorded";

const RECORDED_N8N_FILES = ["n8nQuery.json", "n8nDatasource.json"];

const HANDLER_DEFAULTS = { condition: "", slowdown: "debounce", delay: "" };

test.describe("event handlers and actions", () => {
  test("eventHandler wraps an action with the fields the editor saves", () => {
    expect(eventHandler("click", executeQuery("q1")), "click -> executeQuery").toEqual({
      name: "click",
      handler: { compType: "executeQuery", comp: { queryName: "q1", queryVariables: [] }, ...HANDLER_DEFAULTS },
    });
  });

  test("eventHandler takes a condition, a slowdown and a delay", () => {
    const binding = eventHandler("click", runScript("x()"), { condition: "{{a}}", slowdown: "throttle", delay: "200" });

    expect(binding.handler, "handler fields").toEqual({
      compType: "runScript",
      comp: { script: "x()" },
      condition: "{{a}}",
      slowdown: "throttle",
      delay: "200",
    });
  });

  test("setTempState has the recorded JSONValue parameter", () => {
    expect(setTempState("state1", "clicked-{{1+1}}")).toEqual({
      compType: "setTempState",
      comp: {
        name: "state1",
        methodName: "setValue",
        params: [{ compType: "JSONValue", comp: "clicked-{{1+1}}", name: "value" }],
      },
    });
  });

  test("executeComp has string parameters, and none by default", () => {
    expect(executeComp("modal1", "openModal"), "no parameters").toEqual({
      compType: "executeComp",
      comp: { name: "modal1", methodName: "openModal", params: [] },
    });
    expect(executeComp("input1", "setValue", [{ name: "value", value: "x" }]).comp.params, "one parameter").toEqual([
      { compType: "string", comp: "x", name: "value" },
    ]);
  });

  test("triggerModuleEvent names the module event", () => {
    expect(triggerModuleEvent("event1")).toEqual({ compType: "triggerModuleEvent", comp: { name: "event1" } });
  });
});

test.describe("existing builders keep their output", () => {
  test("button with onClickQuery has the click -> executeQuery handler", () => {
    const item = button({ id: "b1", name: "button1", text: "Go", testId: "tid", onClickQuery: "q1", x: 2, y: 3 });

    expect(item, "button item").toEqual({
      id: "b1",
      layout: { x: 2, y: 3, w: 6, h: 6 },
      item: {
        compType: "button",
        name: "button1",
        comp: {
          text: "Go",
          dataTestId: "tid",
          onEvent: [
            {
              name: "click",
              handler: { compType: "executeQuery", comp: { queryName: "q1", queryVariables: [] }, ...HANDLER_DEFAULTS },
            },
          ],
        },
      },
    });
  });

  test("button without handlers has no onEvent key", () => {
    expect(button({ id: "b1", name: "button1", text: "Go", testId: "tid" }).item.comp, "comp").toEqual({
      text: "Go",
      dataTestId: "tid",
    });
  });

  test("button puts onEvent handlers after the onClickQuery one", () => {
    const item = button({
      id: "b1",
      name: "button1",
      text: "Go",
      testId: "tid",
      onClickQuery: "q1",
      onEvent: [eventHandler("click", setTempState("state1", "x"))],
    });

    const events = item.item.comp.onEvent as { handler: { compType: string } }[];
    expect(events.map((event) => event.handler.compType), "handler order").toEqual(["executeQuery", "setTempState"]);
  });

  test("text and input items", () => {
    expect(text({ id: "t1", name: "text1", text: "{{a}}", testId: "tid" }), "text").toEqual({
      id: "t1",
      layout: { x: 0, y: 0, w: 12, h: 5 },
      item: { compType: "text", name: "text1", comp: { text: "{{a}}", dataTestId: "tid" } },
    });
    expect(input({ id: "i1", name: "input1", testId: "tid" }).item, "input").toEqual({
      compType: "input",
      name: "input1",
      comp: { value: "", dataTestId: "tid" },
    });
    expect(input({ id: "i1", name: "input1", testId: "tid", value: "v" }).item.comp.value, "initial value").toBe("v");
  });

  test("table with plain column keys writes minimal text columns on the recorded table", () => {
    const item = table({ id: "t1", name: "table1", data: "{{q.data}}", columns: ["id", "name"], testId: "tid" });

    const recorded = recordedItem("table").comp;
    expect(item.item.comp.data, "data").toBe("{{q.data}}");
    expect(item.item.comp.dataTestId, "test id").toBe("tid");
    expect(item.item.comp.pagination, "the recorded page size options are kept").toEqual(recorded.pagination);
    expect(item.item.comp.columns, "columns").toEqual(
      ["id", "name"].map((key) => ({
        title: key,
        showTitle: true,
        isCustom: false,
        dataIndex: key,
        render: { compType: "text", comp: { text: "{{currentCell}}" } },
      })),
    );
    expect("onEvent" in item.item.comp, "no onEvent unless given").toBe(false);
  });

  test("a query without options has the defaults the editor saves", () => {
    expect(jsQuery({ id: "q1", name: "query1", script: "return 1" })).toEqual({
      compType: "js",
      comp: { script: "return 1" },
      datasourceId: "#JS_CODE",
      id: "q1",
      name: "query1",
      order: 1,
      triggerType: "manual",
      onEvent: [],
      notification: { showSuccess: true, showFail: true, fail: [{}] },
      timeout: "",
      confirmationModal: {},
      variables: [],
      periodic: false,
      periodicTime: "",
      cancelPrevious: false,
      depQueryName: "",
      delayTime: "",
    });
  });

  test("a PostgreSQL query is automatic by default and keeps its SQL", () => {
    const query = postgresQuery({ id: "q1", name: "q", datasourceId: "ds1", sql: "SELECT 1" }) as Record<string, unknown>;

    expect(query.triggerType, "trigger").toBe("automatic");
    expect(query.datasourceId, "data source").toBe("ds1");
    expect((query.comp as Record<string, unknown>).sql, "sql").toBe("SELECT 1");
  });

  test("appDsl writes ui, queries and tempStates, and nothing for parts left out", () => {
    const dsl = appDsl([text({ id: "t1", name: "text1", text: "x", testId: "tid" })], {
      queries: [{ name: "q" }],
      tempStates: [tempState({ id: "s1", name: "state1", value: "0" })],
    });

    expect(Object.keys(dsl), "top-level keys").toEqual(["ui", "queries", "tempStates"]);
    expect(appDsl([]), "an empty app").toEqual({ ui: { layout: {}, items: {} } });
  });

  test("appDsl numbers the layout entries in item order", () => {
    const dsl = appDsl([
      text({ id: "a", name: "text1", text: "x", testId: "ta" }),
      text({ id: "b", name: "text2", text: "y", testId: "tb", y: 6 }),
    ]) as { ui: { layout: Record<string, { i: string; pos: number; y: number }> } };

    expect(dsl.ui.layout.a, "first").toMatchObject({ i: "a", pos: 0, y: 0 });
    expect(dsl.ui.layout.b, "second").toMatchObject({ i: "b", pos: 1, y: 6 });
  });
});

test.describe("query options", () => {
  test("every option lands in the saved query field of its name", () => {
    const onEvent = [eventHandler("success", executeQuery("other"))];

    const query = jsQuery({
      id: "q1",
      name: "q",
      script: "1",
      trigger: "onTimeout",
      onEvent,
      notification: { showSuccess: false },
      delayTime: "2000",
      periodic: true,
      periodicTime: "500",
      confirmationModal: { showConfirmationModal: true, confirmationMessage: "Really run?" },
      depQueryName: "first",
    }) as Record<string, unknown>;

    expect(query).toMatchObject({
      triggerType: "onTimeout",
      onEvent,
      delayTime: "2000",
      periodic: true,
      periodicTime: "500",
      confirmationModal: { showConfirmationModal: true, confirmationMessage: "Really run?" },
      depQueryName: "first",
    });
  });

  test("notification merges over the defaults, field by field", () => {
    const quiet = jsQuery({ id: "q", name: "q", script: "1", notification: { showSuccess: false } }) as Record<string, unknown>;
    const silent = postgresQuery({
      id: "q",
      name: "q",
      datasourceId: "d",
      sql: "s",
      notification: { showFail: false },
    }) as Record<string, unknown>;

    expect(quiet.notification, "showSuccess off, showFail kept").toEqual({ showSuccess: false, showFail: true, fail: [{}] });
    expect(silent.notification, "showFail off, showSuccess kept").toEqual({ showSuccess: true, showFail: false, fail: [{}] });
  });

  test("the trigger types are split: the compiler rejects each on the query type that does not offer it", () => {
    // These two lines are the proof: they fail `tsc --noEmit` when the unused directive is no longer needed.
    // @ts-expect-error onInputChange does nothing on a JavaScript query (queryComp.tsx:305)
    jsQuery({ id: "q", name: "q", script: "1", trigger: "onInputChange" });
    // @ts-expect-error onBeforeUnload exists only for JavaScript queries (JSTriggerTypeOptions)
    postgresQuery({ id: "q", name: "q", datasourceId: "d", sql: "s", trigger: "onBeforeUnload" });

    const onInput = postgresQuery({ id: "q", name: "q", datasourceId: "d", sql: "s", trigger: "onInputChange" }) as Record<string, unknown>;
    const beforeUnload = jsQuery({ id: "q", name: "q", script: "1", trigger: "onBeforeUnload" }) as Record<string, unknown>;
    expect(onInput.triggerType, "PostgreSQL onInputChange").toBe("onInputChange");
    expect(beforeUnload.triggerType, "JavaScript onBeforeUnload").toBe("onBeforeUnload");
  });
});

test.describe("transformers, data responders and hooks in appDsl", () => {
  test("transformers and dataResponders are written as top-level keys", () => {
    const dsl = appDsl([], {
      transformers: [transformer({ name: "transformer1", script: "return 1" })],
      dataResponders: [
        dataResponder({ name: "dataResponder1", data: "{{state1.value}}", onEvent: [eventHandler("dataChange", runScript("x()"))] }),
      ],
    }) as Record<string, unknown>;

    expect(dsl.transformers, "transformers").toEqual([{ name: "transformer1", script: "return 1" }]);
    expect(dsl.dataResponders, "dataResponders").toEqual([
      {
        name: "dataResponder1",
        order: 0,
        data: "{{state1.value}}",
        onEvent: [{ name: "dataChange", handler: { compType: "runScript", comp: { script: "x()" }, ...HANDLER_DEFAULTS } }],
      },
    ]);
  });

  test("hooks come after the hooks every app has", () => {
    const modal = recordedHookOf("modal", { visible: "" });

    const dsl = appDsl([], { hooks: [modal] }) as { hooks: { compType: string; name: string }[] };

    const base = recordedBaseHooks();
    expect(dsl.hooks.slice(0, base.length), "the base hooks first").toEqual(base);
    expect(dsl.hooks.at(-1), "then the modal").toMatchObject({ compType: "modal", name: "modal1" });
    expect(base.some((entry) => entry.compType === "modal"), "the base has no modal").toBe(false);
  });

  test("hook builds an entry and recordedHookOf merges over the recorded one", () => {
    expect(hook("modal", "modal7", { a: 1 }), "explicit").toEqual({ compType: "modal", name: "modal7", comp: { a: 1 } });

    const merged = recordedHookOf("drawer", { placement: "left" }, "drawerX");

    expect(merged.name, "name override").toBe("drawerX");
    expect(merged.comp.placement, "comp override").toBe("left");
    expect(merged.comp.escapeClosable, "recorded property kept").toBe(true);
  });
});

test.describe("component over the recorded defaults", () => {
  test("keeps the recorded name and properties and adds test id, handlers and overrides", () => {
    const events = [eventHandler("change", setTempState("state1", "x"))];

    const item = component("select", { id: "c1", testId: "tid", onEvent: events, comp: { label: "Pick" } });

    const recorded = recordedItem("select");
    expect(item.item.name, "recorded name").toBe(recorded.name);
    expect(item.item.compType, "type").toBe("select");
    expect(item.item.comp.dataTestId, "test id").toBe("tid");
    expect(item.item.comp.onEvent, "handlers").toEqual(events);
    expect(item.item.comp.label, "override").toBe("Pick");
    expect(item.item.comp.options, "a recorded property is kept").toEqual(recorded.comp.options);
    expect(item.layout, "recorded size at 0,0").toEqual({ x: 0, y: 0, w: recorded.layout.w, h: recorded.layout.h });
  });

  test("comp overrides win over the recording and over testId", () => {
    const item = component("button", { id: "c1", testId: "tid", name: "mine", comp: { text: "Mine", dataTestId: "other" } });

    expect(item.item.name, "name").toBe("mine");
    expect(item.item.comp.text, "text").toBe("Mine");
    expect(item.item.comp.dataTestId, "the explicit comp value wins").toBe("other");
  });

  test("a recording is copied, not shared: editing a result does not change the next one", () => {
    const first = component("button", { id: "c1", testId: "a" });
    (first.item.comp as Record<string, unknown>).text = "changed";

    expect(component("button", { id: "c2", testId: "b" }).item.comp.text, "second result").toBe(recordedItem("button").comp.text);
  });

  test("a hook type throws RecordedFixtureError naming the file", () => {
    expect(() => component("modal", { id: "c1", testId: "t" })).toThrow(RecordedFixtureError);
    expect(() => component("modal", { id: "c1", testId: "t" })).toThrow(/modal\.json/);
  });

  test("an unknown type throws RecordedFixtureError", () => {
    expect(() => component("noSuchComponent", { id: "c1", testId: "t" })).toThrow(RecordedFixtureError);
  });
});

test.describe("table columns and events", () => {
  test("column objects build on the recorded column with the flags set", () => {
    const item = table({
      id: "t1",
      name: "tableNotes",
      data: "{{selectNotes.data}}",
      testId: "tid",
      columns: ["id", { dataIndex: "body", editable: true }, { dataIndex: "name", title: "Name", sortable: true, filterable: true }],
      onEvent: [eventHandler("saveChanges", executeQuery("saveNote"))],
    });

    const columns = item.item.comp.columns as Record<string, unknown>[];
    const recordedColumn = (recordedItem("table").comp.columns as Record<string, unknown>[])[0]!;
    expect(columns[0]?.render, "a plain key stays a minimal column").toEqual({ compType: "text", comp: { text: "{{currentCell}}" } });
    expect(columns[1], "editable column").toEqual({ ...recordedColumn, title: "body", dataIndex: "body", editable: true });
    expect(columns[2], "sortable and filterable column").toEqual({
      ...recordedColumn,
      title: "Name",
      dataIndex: "name",
      sortable: true,
      filterable: true,
    });
    expect((item.item.comp.onEvent as { name: string }[])[0]?.name, "table event").toBe("saveChanges");
  });

  test("flags left out are not written, so the recorded value stays", () => {
    const item = table({ id: "t1", name: "t", data: "[]", testId: "tid", columns: [{ dataIndex: "id" }] });

    const column = (item.item.comp.columns as Record<string, unknown>[])[0]!;
    expect(column.filterable, "the recorded filterable false").toBe(false);
    expect("sortable" in column, "no sortable key unless asked").toBe(
      "sortable" in (recordedItem("table").comp.columns as Record<string, unknown>[])[0]!,
    );
  });
});

test.describe("barChart", () => {
  test("merges data, x axis and series onto the recorded bar chart", () => {
    const item = barChart({
      id: "c1",
      name: "barChart1",
      testId: "tid",
      data: "{{selectProducts.data.slice(0, 5)}}",
      xAxisKey: "name",
      series: [{ columnName: "stock", seriesName: "Stock" }],
    });

    expect(item.item.compType, "type").toBe("barChart");
    expect(item.item.comp.data, "data").toBe("{{selectProducts.data.slice(0, 5)}}");
    expect(item.item.comp.xAxisKey, "x axis").toBe("name");
    expect(item.item.comp.series, "one series with a generated data index").toEqual([
      { columnName: "stock", seriesName: "Stock", dataIndex: "s1" },
    ]);
    expect(item.item.comp.chartConfig, "a recorded property is kept").toEqual(recordedItem("barChart").comp.chartConfig);
  });
});

test.describe("stackItems", () => {
  const sizes = [5, 6, 20];
  const items = sizes.map((h, index): DslItem => ({
    id: `i${index}`,
    layout: { x: 3, y: 0, w: 6, h },
    item: { compType: "text", name: `text${index}`, comp: {} },
  }));

  test("every item starts below the previous one and none overlaps", () => {
    const stacked = stackItems(items);

    for (let index = 1; index < stacked.length; index += 1) {
      const previous = stacked[index - 1]!.layout;
      expect(stacked[index]!.layout.y, `item ${index} starts below item ${index - 1}`).toBeGreaterThanOrEqual(
        previous.y + previous.h,
      );
    }
  });

  test("the gap is the number of rows between two items, and x and size are kept", () => {
    const stacked = stackItems(items, 2);

    expect(stacked.map((entry) => entry.layout.y), "y of each item").toEqual([0, 7, 15]);
    expect(stacked.map((entry) => [entry.layout.x, entry.layout.w, entry.layout.h]), "x, w, h unchanged").toEqual(
      items.map((entry) => [entry.layout.x, entry.layout.w, entry.layout.h]),
    );
  });

  test("the input items are not changed", () => {
    stackItems(items);

    expect(items.map((entry) => entry.layout.y), "input y values").toEqual([0, 0, 0]);
  });

  test("containerOf numbers the entries and keys the items by id", () => {
    const body = containerOf(items);

    expect(Object.keys(body.layout), "layout ids").toEqual(["i0", "i1", "i2"]);
    expect(body.layout.i1, "second entry").toEqual({ i: "i1", x: 3, y: 0, w: 6, h: 6, pos: 1 });
    expect(Object.keys(body.items), "item ids").toEqual(["i0", "i1", "i2"]);
  });
});

test.describe("modules", () => {
  test("moduleApp has the shape of the module the editor saves", () => {
    const dsl = moduleApp({
      inputs: [{ name: "moduleInput1" }],
      outputs: [{ name: "output1", value: "{{input1.value}}" }],
      methods: [{ name: "method1", action: executeComp("input1", "setValue", [{ name: "value", value: "set-by-method" }]) }],
      events: ["event1"],
      items: [text({ id: "t1", name: "text1", text: "in={{moduleInput1.value}}", testId: "m-text" })],
    });

    expect(dsl).toEqual({
      ui: {
        compType: "module",
        comp: {
          io: {
            inputs: [
              {
                name: "moduleInput1",
                description: "",
                type: "data",
                defaultValue: { compType: "data", comp: "" },
                test: { compType: "data", comp: "" },
              },
            ],
            outputs: [{ name: "output1", value: "{{input1.value}}" }],
          },
          methods: [
            {
              name: "method1",
              action: {
                compType: "executeComp",
                comp: { name: "input1", methodName: "setValue", params: [{ compType: "string", comp: "set-by-method", name: "value" }] },
                ...HANDLER_DEFAULTS,
              },
            },
          ],
          events: { list: [{ name: "event1" }], enableEventTestMessage: true },
          container: {
            layout: { t1: { i: "t1", x: 0, y: 0, w: 12, h: 5, pos: 0 } },
            items: { t1: { compType: "text", name: "text1", comp: { text: "in={{moduleInput1.value}}", dataTestId: "m-text" } } },
          },
          containerSize: { height: 12, width: 24 },
        },
      },
    });
  });

  test("an empty moduleApp is a module with empty lists", () => {
    const dsl = moduleApp({}) as { ui: { comp: { io: unknown; methods: unknown; events: unknown; container: unknown } } };

    expect(dsl.ui.comp.io, "io").toEqual({ inputs: [], outputs: [] });
    expect(dsl.ui.comp.methods, "methods").toEqual([]);
    expect(dsl.ui.comp.events, "events").toEqual({ list: [], enableEventTestMessage: true });
    expect(dsl.ui.comp.container, "container").toEqual({ layout: {}, items: {} });
  });

  test("moduleInstance names the module and carries inputs and event handlers", () => {
    const events = [eventHandler("event1", setTempState("state1", "event1-fired"))];

    const item = moduleInstance({ id: "m1", name: "module1", moduleId: "mod-9", inputs: { moduleInput1: "alpha" }, events });

    expect(item, "instance").toEqual({
      id: "m1",
      layout: { x: 0, y: 0, w: 24, h: 12 },
      item: {
        compType: "module",
        name: "module1",
        comp: {
          appId: "mod-9",
          error: "",
          inputs: { moduleInput1: "alpha" },
          events,
          autoHeight: "auto",
          scrollbars: false,
          loadModuleInDomWhenHide: true,
        },
      },
    });
  });
});

test.describe("n8n recordings and query builder", () => {
  test("the recorded n8n query is the editor's 'Retrieve all workflows' with its generated action name", () => {
    const recorded = recordedN8nQuery();
    expect(recorded.compType).toBe("n8n");
    expect(recorded.comp.actionName, "the generated action name").toBe("get_workflows");
    expect(Object.keys(recorded.comp.action), "the name parameter is in the action").toContain(N8N_NAME_PARAM_KEY);
    expect(recordedN8nQuery(), "a fresh copy each time").not.toBe(recorded);
  });

  test("the recorded n8n data source is the form's body for spec v1.1.1", () => {
    const recorded = recordedN8nDatasource();
    expect(recorded.type).toBe("n8n");
    expect(recorded.datasourceConfig).toMatchObject({ specVersion: "v1.1.1" });
    expect(recorded.datasourceConfig, "the target and the key are what a test replaces").toHaveProperty("serverURL");
    expect(recorded.datasourceConfig).toHaveProperty("apiKey");
  });

  test("n8nWorkflowsQuery keeps the recorded action, sets the name parameter and the data source, and runs manually", () => {
    const query = n8nWorkflowsQuery({ id: "q9", name: "workflows", datasourceId: "ds9", nameParam: "e2e-marker-x" }) as {
      compType: string;
      comp: { actionName: string; action: Record<string, string> };
      datasourceId: string;
      id: string;
      name: string;
      triggerType: string;
    };
    const recorded = recordedN8nQuery();
    expect(query).toMatchObject({ compType: "n8n", datasourceId: "ds9", id: "q9", name: "workflows", triggerType: "manual" });
    expect(query.comp.actionName).toBe(recorded.comp.actionName);
    expect(query.comp.action[N8N_NAME_PARAM_KEY], "the name parameter").toBe("e2e-marker-x");
    expect({ ...query.comp.action, [N8N_NAME_PARAM_KEY]: "" }, "the other parameters stay as recorded").toEqual({ ...recorded.comp.action, [N8N_NAME_PARAM_KEY]: "" });
  });

  test("the n8n recordings hold no id, timestamp or value of the recording session", () => {
    const text = [RECORDED_N8N_FILES.map((file) => readFileSync(join(RECORDED_N8N_DIR, file), "utf8"))].flat().join("\n");
    expect(text, "a 24-hex id (workspace, data source, query)").not.toMatch(/\b[0-9a-f]{24}\b/);
    expect(text, "an ISO timestamp").not.toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
    expect(text, "an epoch of 10 digits or more (the saved query's order)").not.toMatch(/\b\d{10,}\b/);
    expect(text, "the echo target or marker of the session").not.toMatch(/e2e-echo|e2e-marker|e2e-dummy/);
    expect(Object.keys(recordedN8nQuery()), "only what the builder keeps").toEqual(["compType", "comp"]);
    expect(Object.keys(recordedN8nDatasource()), "no workspace id").toEqual(["name", "type", "datasourceConfig"]);
  });

  test("n8nWorkflowsQuery does not change the recording of the next call", () => {
    n8nWorkflowsQuery({ id: "q1", name: "a", datasourceId: "d", nameParam: "first" });
    expect(recordedN8nQuery().comp.action[N8N_NAME_PARAM_KEY]).not.toBe("first");
  });
});
