import { useContext, useEffect, useRef, useState } from "react";
import { Alert, Button, Form, Input, Modal, Radio, Select, Space, Steps } from "antd";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { EditorContext } from "comps/editorState";
import { genQueryId } from "comps/utils/idGenerator";
import { HttpConfig, SSLCertVerificationEnum } from "api/datasourceApi";
import { Datasource, JS_CODE_ID } from "constants/datasourceConstants";
import { buildDatasourceEditUrl } from "constants/routesURL";
import { createDatasource } from "redux/reduxActions/datasourceActions";
import { getDataSource } from "redux/selectors/datasourceSelectors";
import { executeQueryAction, routeByNameAction } from "lowcoder-core";
import { getPromiseAfterDispatch } from "util/promiseUtils";
import { assertAiRobotAccess } from "util/assertAiRobotAccess";
import { trans } from "i18n";
import { connectionTestRequest, isConnectionVerified, modelBridgeScript, modelRequestBody, ModelApiFormat, validModelBaseUrl } from "./modelConnectionTemplates";

const Content = styled.div`
  padding-top: 24px; color: #555165;
  h3 { color: #29243a; font-size: 20px; margin: 0 0 10px; }
  p { line-height: 1.7; }
  .setup-note { font-size: 12px; color: #797184; }
  details { background: #f8f7fb; border-radius: 8px; padding: 14px; margin: 18px 0; }
  summary { cursor: pointer; font-weight: 600; color: #52416a; }
  li { line-height: 1.7; margin: 8px 0; }
  code { overflow-wrap: anywhere; }
  .ant-form-item { margin-bottom: 16px; }
`;

export function AutomatorSetup({ onClose, onSelect }: { onClose: () => void; onSelect: (name: string) => void }) {
  const editorState = useContext(EditorContext);
  const latestEditor = useRef(editorState);
  latestEditor.current = editorState;
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const dispatch = useDispatch();
  const datasources = useSelector(getDataSource);
  const [step, setStep] = useState(0);
  const [provider, setProvider] = useState<'openai' | 'custom'>('openai');
  const [source, setSource] = useState('new');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('https://api.openai.com');
  const [format, setFormat] = useState<ModelApiFormat>('responses');
  const [path, setPath] = useState('/v1/responses');
  const [model, setModel] = useState('gpt-4.1-mini');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [savedSource, setSavedSource] = useState<Datasource>();
  const [queries, setQueries] = useState<{ http: string; bridge: string }>();
  const [verified, setVerified] = useState(false);
  const operation = useRef(false);
  const existing = datasources.filter(info => info.datasource.type === 'restApi' && !info.datasource.id.startsWith('#'));
  const canContinue = Boolean(model.trim()) && /^\/(?!\/)/.test(path) && !/[\s?#]/.test(path) && (Boolean(savedSource) || source !== 'new' || (validModelBaseUrl(baseUrl) && (provider !== 'openai' || Boolean(apiKey.trim()))));

  const create = async () => {
    if (operation.current || !canContinue || queries) return;
    operation.current = true; setBusy(true); setError('');
    try {
      const orgId = assertAiRobotAccess();
      let datasource = savedSource || existing.find(info => info.datasource.id === source)?.datasource;
      if (!datasource) {
        if (source !== 'new') throw new Error('Choose an available datasource.');
        datasource = await new Promise<Datasource>((resolve, reject) => dispatch(createDatasource({
          name: `Automator ${provider === 'openai' ? 'OpenAI' : 'model'}`,
          type: 'restApi', organizationId: orgId,
          datasourceConfig: {
            url: baseUrl.replace(/\/$/, ''),
            headers: apiKey.trim() ? [{ key: 'Authorization', value: `Bearer ${apiKey.trim()}` }] : [],
            params: [], bodyFormData: [], forwardCookies: [], forwardAllCookies: false,
            authConfig: { type: 'NO_AUTH', username: '', password: '' },
            sslConfig: { sslCertVerificationType: SSLCertVerificationEnum.VERIFY_CA_CERT },
          } as HttpConfig,
        }, response => resolve(response.data.data), () => reject(new Error('Datasource could not be saved.')))));
        if (!mounted.current) return;
        setSavedSource(datasource); setApiKey('');
      }
      assertAiRobotAccess(orgId);
      if (!mounted.current) return;
      const state = latestEditor.current;
      const http = state.getNameGenerator().genItemName('automatorHttp');
      const bridge = state.getNameGenerator().genItemName('automatorAI');
      const list = state.getQueriesComp();
      const defaults = { triggerType: 'manual' as const, isNewCreate: true, timeout: '120000', onEvent: [], variables: [] };
      await getPromiseAfterDispatch(list.dispatch, list.multiAction([
        list.pushAction({ ...defaults, id: genQueryId(), name: http, datasourceId: datasource.id,
          compType: 'restApi', order: Date.now(), comp: { httpMethod: 'POST', path,
            headers: [{ key: 'Content-Type', value: 'application/json' }], params: [], bodyFormData: [],
            bodyType: 'application/json', body: modelRequestBody(format, model) } }),
        list.pushAction({ ...defaults, id: genQueryId(), name: bridge, datasourceId: JS_CODE_ID,
          compType: 'js', order: Date.now() + 1, comp: { script: modelBridgeScript(format, http) } }),
      ]), { autoHandleAfterReduce: true });
      if (!mounted.current) return;
      setSavedSource(datasource); setQueries({ http, bridge }); setStep(2);
    } catch {
      if (mounted.current) setError('Setup could not finish. Check your workspace permissions and connection, then retry. If the datasource was saved, it will be reused.');
    } finally { operation.current = false; if (mounted.current) setBusy(false); }
  };

  const test = async () => {
    if (!queries || operation.current) return;
    operation.current = true; setBusy(true); setError(''); setVerified(false);
    try {
      const orgId = assertAiRobotAccess();
      const result = await getPromiseAfterDispatch(latestEditor.current.rootComp.dispatch,
        routeByNameAction(queries.bridge, executeQueryAction({ args: { ai: { value: connectionTestRequest } } })));
      assertAiRobotAccess(orgId);
      if (!mounted.current) return;
      if (isConnectionVerified(result)) setVerified(true);
      else setError('The model replied, but tool calling was not verified. Choose a model that supports tools and check the API format in your provider query. Then test again.');
    } catch {
      if (mounted.current) setError('The connection test failed. Check the datasource API key, endpoint and model access. A 401 means authentication; a 429 can mean rate or billing limits. For self-hosted models, check that the Lowcoder server can reach the endpoint. Your queries are saved—fix the connection and retry.');
    } finally { operation.current = false; if (mounted.current) setBusy(false); }
  };

  return <Modal open title="Set up your AI connection" width={720} onCancel={onClose}
    closable={!busy} maskClosable={!busy} keyboard={!busy} footer={<Space wrap>
      <Button disabled={busy} onClick={onClose}>{queries ? 'Finish later' : 'Cancel'}</Button>
      {step === 1 && !savedSource && <Button disabled={busy} onClick={() => setStep(0)}>Back</Button>}
      {step === 0 && <Button type="primary" disabled={!canContinue} onClick={() => { setError(''); setStep(1); }}>Review setup</Button>}
      {step === 1 && <Button type="primary" loading={busy} onClick={create}>Create connection & queries</Button>}
      {step === 2 && <Button loading={busy} onClick={test}>{verified ? 'Test again' : 'Test connection'}</Button>}
      {step === 2 && <Button type="primary" disabled={!verified || busy} onClick={() => { if (queries) { assertAiRobotAccess(); onSelect(queries.bridge); onClose(); } }}>Start building</Button>}
    </Space>}>
    <Steps size="small" current={step} items={[{ title: 'Connect' }, { title: 'Create queries' }, { title: 'Try it' }]} />
    <Content>
      {step === 0 && <>
        <h3>Give Automator a model to work with.</h3>
        <p>Use an OpenAI API key to get started, or connect your own model. We’ll prepare the queries that let Automator talk to it.</p>
        <Form layout="vertical">
          <Form.Item label="Provider">
            <Radio.Group value={provider} onChange={e => {
              const openai = e.target.value === 'openai'; setProvider(e.target.value); setSource('new'); setApiKey('');
              setBaseUrl(openai ? 'https://api.openai.com' : ''); setModel(openai ? 'gpt-4.1-mini' : '');
              setFormat(openai ? 'responses' : 'chatCompletions'); setPath(openai ? '/v1/responses' : '/v1/chat/completions');
            }} options={[{ label: 'OpenAI · guided example', value: 'openai' }, { label: 'My own provider / self-hosted', value: 'custom' }]} />
          </Form.Item>
          <Form.Item label="Connection">
            <Select aria-label="Connection" value={source} onChange={setSource} options={[{ label: 'Create a new REST datasource', value: 'new' }, ...existing.map(info => ({ label: info.datasource.name, value: info.datasource.id }))]} />
          </Form.Item>
          {source === 'new' && <>
            {provider === 'custom' && <Form.Item label="Server base URL" help="Use the server address; set the API path below. This address must be reachable from your Lowcoder server."><Input aria-label="Server base URL" placeholder="https://models.example.com" value={baseUrl} onChange={e => setBaseUrl(e.target.value)} /></Form.Item>}
            <Form.Item label={provider === 'openai' ? 'OpenAI API key' : 'API key (optional for your own server)'}>
              <Input.Password aria-label="API key" autoComplete="off" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Paste your provider API key" />
              {provider === 'openai' && <p className="setup-note">Use a key from your <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">OpenAI API account</a> with access to the model below.</p>}
              <p className="setup-note">Saved in the workspace datasource, outside your app’s JavaScript. People with datasource management access can manage these credentials. Model usage is billed by your provider.</p>
            </Form.Item>
          </>}
          {(provider === 'custom' || source !== 'new') && <>
            <Form.Item label="API format"><Select aria-label="API format" value={format} onChange={value => { setFormat(value); setPath(value === 'responses' ? '/v1/responses' : '/v1/chat/completions'); }} options={[{ label: 'OpenAI Responses', value: 'responses' }, { label: 'OpenAI-compatible Chat Completions', value: 'chatCompletions' }]} /></Form.Item>
            <Form.Item label="API path" help="Appended to the datasource base URL. If the base already ends in /v1, use /chat/completions or /responses here."><Input aria-label="API path" value={path} onChange={e => setPath(e.target.value)} /></Form.Item>
          </>}
          <Form.Item label="Model" help="Use the exact model name available to your API key. It must support function / tool calling."><Input aria-label="Model" value={model} onChange={e => setModel(e.target.value)} placeholder="Your model name" /></Form.Item>
        </Form>
        <details><summary>How do I connect a self-hosted model or private gateway?</summary>
          <ol>
            <li>Choose “My own provider” and enter its base URL, model name and API key if required. Or select a REST datasource your team already configured.</li>
            <li>Select its API format. The guided bridge supports Responses and OpenAI-compatible Chat Completions. Models must accept messages and tools and return function calls.</li>
            <li>For a local model server, use an address reachable by Lowcoder. In a container, <code>localhost</code> refers to that container, not your laptop. Keep access restricted to your intended network.</li>
            <li>If your gateway needs custom headers or authentication, configure a REST datasource first and select it here.</li>
            <li>For a different API format, use a custom bridge query. It receives <code>ai.value</code> and must return an assistant message with text or tool-call parts.</li>
          </ol>
          <a href={trans('docUrls.githubAutomator')} target="_blank" rel="noopener noreferrer">Read the provider examples and response contract</a>
        </details>
      </>}
      {step === 1 && <>
        <h3>A connection, ready for your first request.</h3>
        <p>We’ll {source === 'new' ? 'save a REST datasource for your model' : 'reuse your selected REST datasource'} and add two manually triggered queries to this app:</p>
        <ol><li><strong>Provider query</strong> — calls <code>{path}</code> using <code>{model}</code>.</li><li><strong>Automator bridge</strong> — passes the conversation and available tools to your model, then translates its reply for Lowcoder.</li></ol>
        <p>Existing queries are kept. You can inspect or change the generated queries in the Data Queries panel.</p>
        <Alert type="info" showIcon message="You choose when the model runs" description="Creating the setup makes no model request. The next step sends a small connection test; provider charges may apply. When you use Automator, it sends your conversation and app context to this provider and applies supported edits directly to the canvas." />
      </>}
      {step === 2 && <>
        <h3>{verified ? 'Your model is ready. Let’s build something.' : 'One small test before your first app.'}</h3>
        <p>Created <code>{queries?.http}</code> and <code>{queries?.bridge}</code>. The test checks authentication and tool calling without sending your app context or changing your canvas.</p>
        {savedSource && <p><a href={buildDatasourceEditUrl(savedSource.id)} target="_blank" rel="noopener noreferrer">Manage model connection</a></p>}
        {verified && <Alert type="success" showIcon message="Connection and tool calling verified" description="Start in a blank app and try: “Create a simple to-do app with a task table and an add button.” Review the result, then ask for your next change." />}
        <p className="setup-note">Use the Automator bridge query in the panel’s query selector. You can reuse it for AI Help too. If you finish later, select this bridge from the panel when you return.</p>
      </>}
      {error && <Alert role="alert" type="error" showIcon message={error} style={{ marginTop: 16 }} />}
    </Content>
  </Modal>;
}
