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
  expect(http.run.mock.calls[0][0].tools[0]).toMatchObject({ type: 'function', name: 'check_connection', strict: false });
  expect(http.run.mock.calls[0][0].input.every((m: any) => m.role !== 'system')).toBe(true);
});

test('Chat Completions bridge keeps provider-compatible tools and normalizes calls', async () => {
  const { result, http } = runBridge('chatCompletions', { choices: [{ message: { content: 'Ready', tool_calls: [
    { id: 'one', function: { name: 'check_connection', arguments: '{"ok":true}' } },
  ] } }] });
  expect(isConnectionVerified(await result)).toBe(true);
  expect(http.run).toHaveBeenCalledWith({ messages: connectionTestRequest.messages, tools: connectionTestRequest.tools });
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
