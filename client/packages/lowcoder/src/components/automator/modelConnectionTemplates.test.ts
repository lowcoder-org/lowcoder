import { connectionTestRequest, isConnectionVerified, modelBridgeScript, modelRequestBody, validModelBaseUrl } from './modelConnectionTemplates';

const runBridge = (format: 'responses' | 'chatCompletions', response: unknown, request: any = connectionTestRequest) => {
  const http = { run: jest.fn().mockResolvedValue(response) };
  const run = new Function('ai', 'modelHttp', modelBridgeScript(format, 'modelHttp'));
  return { http, result: run({ value: request }, http) };
};

test('Responses bridge flattens tools and preserves text and every tool call', async () => {
  const { result, http } = runBridge('responses', { output: [
    { type: 'message', role: 'assistant', content: [{ type: 'output_text', text: 'Connected.' }] },
    { type: 'function_call', call_id: 'one', name: 'check_connection', arguments: '{"ok":true}' },
    { type: 'function_call', call_id: 'two', name: 'check_connection', arguments: '{"ok":true}' },
  ] });
  const message = await result;
  expect(message.content).toHaveLength(3);
  expect(isConnectionVerified(message)).toBe(true);
  expect(http.run.mock.calls[0][0].tools.value[0]).toMatchObject({ type: 'function', name: 'check_connection', strict: false });
  expect(http.run.mock.calls[0][0].input.value.every((m: any) => m.role !== 'system')).toBe(true);
});

test('Chat Completions bridge keeps provider-compatible tools and normalizes calls', async () => {
  const { result, http } = runBridge('chatCompletions', { choices: [{ message: { content: 'Ready', tool_calls: [
    { id: 'one', function: { name: 'check_connection', arguments: '{"ok":true}' } },
  ] } }] });
  expect(isConnectionVerified(await result)).toBe(true);
  expect(http.run).toHaveBeenCalledWith({ messages: { value: connectionTestRequest.messages }, tools: { value: connectionTestRequest.tools } });
});

test.each([
  { output: [] },
  { error: { message: 'Provider error' } },
  { output: [{ type: 'function_call', name: 'check_connection', arguments: 'bad json' }] },
  { output: [{ type: 'function_call', name: 'execute_automator_actions', arguments: '{}' }] },
])('rejects unusable or unexpected model responses: %o', async response => {
  await expect(runBridge('responses', response).result).rejects.toThrow();
});

test('normal text is a valid bridge response but does not prove tool support', async () => {
  const { result } = runBridge('chatCompletions', { choices: [{ message: { content: 'Hello' } }] });
  const message = await result;
  expect(message.content).toEqual([{ type: 'text', text: 'Hello' }]);
  expect(isConnectionVerified(message)).toBe(false);
  expect(isConnectionVerified(null)).toBe(false);
});

test('test payload has no app context and only an inert connection tool', () => {
  expect(connectionTestRequest.tools.map(t => t.function.name)).toEqual(['check_connection']);
  expect(connectionTestRequest).not.toHaveProperty('context');
  expect(isConnectionVerified({ role: 'assistant', content: [{ type: 'tool-call', toolName: 'check_connection', args: { ok: false } }] })).toBe(false);
});

test('model names are JSON escaped and generated scripts reject query-name injection', () => {
  const model = 'model"with\\quotes';
  const body = modelRequestBody('responses', model).replace(/\{\{ [a-z]+\.value \}\}/g, '[]');
  expect(JSON.parse(body)).toMatchObject({ model, store: false, parallel_tool_calls: false });
  expect(() => modelBridgeScript('responses', 'x;fetch("secret")')).toThrow();
});

test.each([
  ['https://models.example.com', true], ['http://local-model:11434', true],
  ['javascript:alert(1)', false], ['https://user:secret@example.com', false],
  ['https://example.com?key=secret', false], ['', false],
])('validates model base URL %s', (url, valid) => expect(validModelBaseUrl(url as string)).toBe(valid));

// Use the same expression evaluation and request mapping as a real HTTP query.
// Cover explicit .value objects and the older plain arguments. The server
// normalizes expression whitespace when applying runtime-variable overrides.
test.each([['responses', false], ['chatCompletions', false], ['responses', true], ['chatCompletions', true]] as const)('%s bridge resolves every HTTP body parameter at runtime (legacy arguments: %s)', async (format, legacyArguments) => {
  const { ParamsJsonControl, paramsMillisecondsControl } = require('comps/controls/paramsControl');
  const { evalAndReduce } = require('comps/utils');
  const { toQueryView } = require('comps/queries/queryCompUtils');
  const { QueryApi } = require('api/queryApi');
  const { setGlobalSettings, clearGlobalSettings } = require('comps/utils/globalSettings');
  const body = modelRequestBody(format, 'test-model');
  const params = evalAndReduce(new ParamsJsonControl({ value: body })).getQueryParams();
  const Timeout = paramsMillisecondsControl({ defaultValue: 120000 });
  const timeout = evalAndReduce(new Timeout({ value: '120000' }));
  const response = format === 'responses'
    ? { output: [{ type: 'function_call', call_id: 'test', name: 'check_connection', arguments: '{"ok":true}' }] }
    : { choices: [{ message: { tool_calls: [{ id: 'test', function: { name: 'check_connection', arguments: '{"ok":true}' } }] } }] };
  const execute = jest.spyOn(QueryApi, 'executeQuery').mockResolvedValue({ data: { success: true, data: response } });
  setGlobalSettings({ applicationId: 'test-app' });
  try {
    const http = { run: async (args: Record<string, unknown>) => {
      if (legacyArguments) args = Object.fromEntries(Object.entries(args).map(([key, value]) => [key, (value as any).value]));
      const result = await toQueryView(params)({ queryId: 'http-query', applicationId: 'test-app', applicationPath: [], args, variables: args, timeout });
      return result.data;
    } };
    const run = new Function('ai', 'modelHttp', modelBridgeScript(format, 'modelHttp'));
    expect(isConnectionVerified(await run({ value: connectionTestRequest }, http))).toBe(true);
    const request = execute.mock.calls[0][0] as any;
    // QueryExecutionRequest.paramMap trims keys and keeps the last value.
    const values = Object.fromEntries(request.params.map((p: any) => [p.key.trim(), p.value]));
    const resolved = JSON.parse(body.replace(/\{\{(.*?)\}\}/g, (_match, expression) => {
      expect(values[expression.trim()]).toBeDefined();
      return JSON.stringify(values[expression.trim()]);
    }));
    expect(resolved.model).toBe('test-model');
    expect(resolved.tools).toHaveLength(1);
    if (format === 'responses') {
      expect(resolved.instructions).toBe(connectionTestRequest.messages[0].content);
      expect(resolved.input).toEqual([connectionTestRequest.messages[1]]);
      expect(resolved.tools[0].name).toBe('check_connection');
    } else {
      expect(resolved.messages).toEqual(connectionTestRequest.messages);
      expect(resolved.tools).toEqual(connectionTestRequest.tools);
    }
  } finally {
    execute.mockRestore();
    clearGlobalSettings();
  }
});

test('running the bridge directly explains where its request comes from', () => {
  const run = new Function('modelHttp', modelBridgeScript('responses', 'modelHttp'));
  expect(() => run({ run: jest.fn() })).toThrow(/Run this query from Automator or AI Help/);
});


test('preserves provider error details instead of replacing them with generic guidance', async () => {
  await expect(runBridge('responses', { error: { message: 'The requested model is not available to this project.' } }).result)
    .rejects.toThrow('The requested model is not available to this project.');
});


test.each([
  [false, "", { error: { message: "You have no credits left.", type: "insufficient_quota" } }, "You have no credits left."],
  [false, " ", { error: "Provider unavailable" }, "Provider unavailable"],
  [false, "Server explanation", { error: { message: "Provider explanation" } }, "Server explanation"],
  [true, "", { error: { message: "Application data" } }, ""],
  [false, "", { error: { message: { arbitrary: "object" } } }, ""],
])("retains provider errors through HTTP query execution (%s, %s)", async (success, message, data, expected) => {
  const { paramsMillisecondsControl } = require("comps/controls/paramsControl");
  const { evalAndReduce } = require("comps/utils");
  const { toQueryView } = require("comps/queries/queryCompUtils");
  const { QueryApi } = require("api/queryApi");
  const Timeout = paramsMillisecondsControl({ defaultValue: 120000 });
  const timeout = evalAndReduce(new Timeout({ value: "120000" }));
  const execute = jest.spyOn(QueryApi, "executeQuery").mockResolvedValue({
    data: { success, message, data, queryCode: "HTTPTOO_MANY_REQUESTS" },
  });
  try {
    const result = await toQueryView([])({ queryId: "http-query", applicationId: "test-app", applicationPath: [], args: {}, variables: {}, timeout });
    expect(result).toMatchObject({ success, message: expected, data });
  } finally {
    execute.mockRestore();
  }
});
