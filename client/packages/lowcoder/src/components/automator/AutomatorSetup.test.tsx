/** @jest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

jest.mock('antd', () => {
  const Form = ({ children }: any) => <div>{children}</div>;
  Form.Item = ({ children, label, help }: any) => <div><span>{label}</span>{children}<span>{help}</span></div>;
  const Input = (props: any) => <input {...props} />;
  Input.Password = Input;
  const Select = ({ options, onChange, ...props }: any) => <select {...props} onChange={e => onChange(e.target.value)}>{options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>;
  return {
    Form, Input, Select,
    Radio: { Group: ({ options, onChange, value }: any) => <Select aria-label="Provider" options={options} value={value} onChange={(value: string) => onChange({ target: { value } })} /> },
    Button: ({ children, loading, type, ...props }: any) => <button {...props}>{children}</button>,
    Modal: ({ children, footer }: any) => <div>{children}{footer}</div>,
    Space: ({ children }: any) => <div>{children}</div>, Steps: () => null,
    Alert: ({ message, description }: any) => <div role="alert">{message}{description}</div>,
  };
});
jest.mock('react-redux', () => ({ useDispatch: () => mockDispatch, useSelector: () => [] }));
jest.mock('comps/editorState', () => ({ EditorContext: require('react').createContext(null) }));
jest.mock('comps/utils/idGenerator', () => ({ genQueryId: () => 'query-id' }));
jest.mock('api/datasourceApi', () => ({ SSLCertVerificationEnum: { VERIFY_CA_CERT: 'VERIFY_CA_CERT' } }));
jest.mock('constants/datasourceConstants', () => ({ JS_CODE_ID: '#JS_CODE' }));
jest.mock('constants/routesURL', () => ({ buildDatasourceEditUrl: () => '/datasource/example' }));
jest.mock('redux/reduxActions/datasourceActions', () => ({ createDatasource: (payload: any, success: any) => ({ payload, success }) }));
jest.mock('redux/selectors/datasourceSelectors', () => ({ getDataSource: () => [] }));
jest.mock('lowcoder-core', () => ({ executeQueryAction: (payload: any) => payload, routeByNameAction: (name: string, action: any) => ({ name, action }) }));
jest.mock('util/promiseUtils', () => ({ getPromiseAfterDispatch: (...args: any[]) => mockPromise(...args) }));
jest.mock('util/assertAiRobotAccess', () => ({ assertAiRobotAccess: () => mockAccess() }));
jest.mock('i18n', () => ({ trans: () => '/docs/automator' }));

const { AutomatorSetup } = require('./GuidedModelSetup');
const { EditorContext } = require('comps/editorState');
const mockDispatch = jest.fn();
const mockPromise = jest.fn();
const mockAccess = jest.fn();
const push = jest.fn((payload: any) => payload);
const editor = { getNameGenerator: () => ({ genItemName: (name: string) => `${name}1` }), getQueriesComp: () => ({ dispatch: jest.fn(), pushAction: push, multiAction: (actions: any) => actions }), rootComp: { dispatch: jest.fn() } };

beforeEach(() => {
  jest.clearAllMocks();
  mockAccess.mockReturnValue('workspace-a');
  mockDispatch.mockImplementation(action => action.success({ data: { data: { id: 'saved-source', name: 'Model' } } }));
  mockPromise.mockResolvedValue(undefined);
});

async function createSetup() {
  fireEvent.change(screen.getByLabelText('API key'), { target: { value: 'example-test-key' } });
  fireEvent.click(screen.getByText('Review setup'));
  fireEvent.click(screen.getByText('Create connection & queries'));
  await screen.findByText('One small test before your first app.');
}

test('creates manual queries without credentials, verifies separately, and selects bridge only on finish', async () => {
  const onSelect = jest.fn();
  const onClose = jest.fn();
  render(<EditorContext.Provider value={editor as any}><AutomatorSetup onSelect={onSelect} onClose={onClose} /></EditorContext.Provider>);
  expect((screen.getByText('Review setup') as HTMLButtonElement).disabled).toBe(true);
  await createSetup();
  expect(mockDispatch).toHaveBeenCalledTimes(1);
  expect(push).toHaveBeenCalledTimes(2);
  expect(push.mock.calls.map(call => call[0].triggerType)).toEqual(['manual', 'manual']);
  expect(JSON.stringify(push.mock.calls)).not.toContain('example-test-key');
  expect(mockDispatch.mock.calls[0][0].payload.datasourceConfig.headers).toEqual([{ key: 'Authorization', value: 'Bearer example-test-key' }]);
  expect(onSelect).not.toHaveBeenCalled();
  expect((screen.getByText('Start building') as HTMLButtonElement).disabled).toBe(true);
  mockPromise.mockRejectedValueOnce(new Error('network failure'));
  fireEvent.click(screen.getByText('Test connection'));
  await screen.findByText(/The connection test failed/);
  expect(mockDispatch).toHaveBeenCalledTimes(1);
  expect(push).toHaveBeenCalledTimes(2);
  mockPromise.mockResolvedValueOnce({ role: 'assistant', content: [{ type: 'tool-call', toolName: 'check_connection', args: { ok: true } }] });
  fireEvent.click(screen.getByText('Test connection'));
  await screen.findByText(/Connection and tool calling verified/);
  expect(mockPromise.mock.calls[2][1].action.args.ai.value.tools[0].function.name).toBe('check_connection');
  fireEvent.click(screen.getByText('Start building'));
  expect(onSelect).toHaveBeenCalledWith('automatorAI1');
  expect(onClose).toHaveBeenCalledTimes(1);
});

test('rechecks access before writing any datasource or query', async () => {
  render(<EditorContext.Provider value={editor as any}><AutomatorSetup onSelect={jest.fn()} onClose={jest.fn()} /></EditorContext.Provider>);
  fireEvent.change(screen.getByLabelText('API key'), { target: { value: 'example-test-key' } });
  fireEvent.click(screen.getByText('Review setup'));
  mockAccess.mockImplementation(() => { throw new Error('Access changed'); });
  fireEvent.click(screen.getByText('Create connection & queries'));
  await screen.findByText(/Setup could not finish/);
  expect(mockDispatch).not.toHaveBeenCalled();
  expect(push).not.toHaveBeenCalled();
});

test('self-hosted setup accepts a private server without an API key', () => {
  render(<EditorContext.Provider value={editor as any}><AutomatorSetup onSelect={jest.fn()} onClose={jest.fn()} /></EditorContext.Provider>);
  fireEvent.change(screen.getByLabelText('Provider'), { target: { value: 'custom' } });
  fireEvent.change(screen.getByLabelText('Server base URL'), { target: { value: 'http://model-server:11434' } });
  fireEvent.change(screen.getByLabelText('Model'), { target: { value: 'local-tools-model' } });
  expect((screen.getByLabelText('API path') as HTMLInputElement).value).toBe('/v1/chat/completions');
  expect((screen.getByText('Review setup') as HTMLButtonElement).disabled).toBe(false);
});
