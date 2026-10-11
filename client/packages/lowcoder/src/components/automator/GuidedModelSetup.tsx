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
import { trans, transToNode } from "i18n";
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

export function AutomatorSetup({ onClose, onSelect, accessStatus = "ready" }: {
  onClose: () => void;
  onSelect: (name: string) => void;
  accessStatus?: "ready" | "checking" | "unavailable";
}) {
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
  const [errorDetail, setErrorDetail] = useState('');
  const [savedSource, setSavedSource] = useState<Datasource>();
  const [queries, setQueries] = useState<{ http: string; bridge: string }>();
  const [verified, setVerified] = useState(false);
  const operation = useRef(false);
  const accessReady = accessStatus === "ready";
  const existing = datasources.filter(info => info.datasource.type === 'restApi' && !info.datasource.id.startsWith('#'));
  const canContinue = Boolean(model.trim()) && /^\/(?!\/)/.test(path) && !/[\s?#]/.test(path) && (Boolean(savedSource) || source !== 'new' || (validModelBaseUrl(baseUrl) && (provider !== 'openai' || Boolean(apiKey.trim()))));

  const create = async () => {
    if (!accessReady || operation.current || !canContinue || queries) return;
    operation.current = true; setBusy(true); setError(''); setErrorDetail('');
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
      setSavedSource(datasource); setQueries({ http, bridge }); onSelect(bridge); setStep(2);
    } catch {
      if (mounted.current) setError(trans('automator.setup.setupFailed'));
    } finally { operation.current = false; if (mounted.current) setBusy(false); }
  };

  const test = async () => {
    if (!accessReady || !queries || operation.current) return;
    operation.current = true; setBusy(true); setError(''); setErrorDetail(''); setVerified(false);
    try {
      const orgId = assertAiRobotAccess();
      const result = await getPromiseAfterDispatch(latestEditor.current.rootComp.dispatch,
        routeByNameAction(queries.bridge, executeQueryAction({ args: { ai: { value: connectionTestRequest } } })));
      assertAiRobotAccess(orgId);
      if (!mounted.current) return;
      if (isConnectionVerified(result)) setVerified(true);
      else setError(trans('automator.setup.toolTestFailed'));
    } catch (cause) {
      if (mounted.current) {
        setError(trans('automator.setup.connectionFailed'));
        // Query execution can reject with a plain { message } object or an Error.
        const detail = typeof cause === 'string' ? cause : (cause as { message?: unknown } | null)?.message;
        setErrorDetail(typeof detail === 'string' ? detail.slice(0, 2000) : '');
      }
    } finally { operation.current = false; if (mounted.current) setBusy(false); }
  };

  return <Modal open title={trans('automator.setup.title')} width={720} onCancel={onClose}
    closable={!busy} maskClosable={!busy} keyboard={false} footer={<Space wrap>
      <Button disabled={busy} onClick={onClose}>{queries ? trans('automator.setup.finishLater') : trans('automator.setup.cancel')}</Button>
      {step === 1 && !savedSource && <Button disabled={busy} onClick={() => setStep(0)}>{trans('automator.setup.back')}</Button>}
      {step === 0 && <Button type="primary" disabled={!canContinue || !accessReady} onClick={() => { setError(''); setStep(1); }}>{trans('automator.setup.review')}</Button>}
      {step === 1 && <Button type="primary" loading={busy} disabled={!accessReady} onClick={create}>{trans('automator.setup.create')}</Button>}
      {step === 2 && <Button loading={busy} disabled={!accessReady} onClick={test}>{verified ? trans('automator.setup.testAgain') : trans('automator.setup.test')}</Button>}
      {step === 2 && <Button type="primary" disabled={!verified || busy || !accessReady} onClick={() => { if (queries) { assertAiRobotAccess(); onSelect(queries.bridge); onClose(); } }}>{trans('automator.setup.start')}</Button>}
    </Space>}>
    <Steps size="small" current={step} items={[{ title: trans('automator.setup.stepConnect') }, { title: trans('automator.setup.stepCreate') }, { title: trans('automator.setup.stepTest') }]} />
    <Content>
      {!accessReady && <Alert type="warning" showIcon message={trans(accessStatus === 'checking' ? 'automator.setup.accessPending' : 'automator.setup.accessUnavailable')} style={{ marginBottom: 16 }} />}
      {step === 0 && <>
        <h3>{trans('automator.setup.connectTitle')}</h3>
        <p>{trans('automator.setup.connectIntro')}</p>
        <Form layout="vertical">
          <Form.Item label={trans('automator.setup.provider')}>
            <Radio.Group value={provider} onChange={e => {
              const openai = e.target.value === 'openai'; setProvider(e.target.value); setSource('new'); setApiKey('');
              setBaseUrl(openai ? 'https://api.openai.com' : ''); setModel(openai ? 'gpt-4.1-mini' : '');
              setFormat(openai ? 'responses' : 'chatCompletions'); setPath(openai ? '/v1/responses' : '/v1/chat/completions');
            }} options={[{ label: trans('automator.setup.openaiExample'), value: 'openai' }, { label: trans('automator.setup.ownProvider'), value: 'custom' }]} />
          </Form.Item>
          <Form.Item label={trans('automator.setup.connection')}>
            <Select aria-label={trans('automator.setup.connection')} value={source} onChange={setSource} options={[{ label: trans('automator.setup.newDatasource'), value: 'new' }, ...existing.map(info => ({ label: info.datasource.name, value: info.datasource.id }))]} />
          </Form.Item>
          {source === 'new' && <>
            {provider === 'custom' && <Form.Item label={trans('automator.setup.baseUrl')} help={trans('automator.setup.baseUrlHelp')}><Input aria-label={trans('automator.setup.baseUrl')} placeholder="https://models.example.com" value={baseUrl} onChange={e => setBaseUrl(e.target.value)} /></Form.Item>}
            <Form.Item label={provider === 'openai' ? trans('automator.setup.openaiKey') : trans('automator.setup.optionalKey')}>
              <Input.Password aria-label={trans('automator.setup.apiKey')} autoComplete="off" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder={trans('automator.setup.keyPlaceholder')} />
              {provider === 'openai' && <p className="setup-note">{transToNode('automator.setup.keyHelp', { account: <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">{trans('automator.setup.openaiAccount')}</a> })}</p>}
              <p className="setup-note">{trans('automator.setup.credentialsNote')}</p>
            </Form.Item>
          </>}
          {(provider === 'custom' || source !== 'new') && <>
            <Form.Item label={trans('automator.setup.apiFormat')}><Select aria-label={trans('automator.setup.apiFormat')} value={format} onChange={value => { setFormat(value); setPath(value === 'responses' ? '/v1/responses' : '/v1/chat/completions'); }} options={[{ label: 'OpenAI Responses', value: 'responses' }, { label: trans('automator.setup.chatCompletions'), value: 'chatCompletions' }]} /></Form.Item>
            <Form.Item label={trans('automator.setup.apiPath')} help={trans('automator.setup.apiPathHelp')}><Input aria-label={trans('automator.setup.apiPath')} value={path} onChange={e => setPath(e.target.value)} /></Form.Item>
          </>}
          <Form.Item label={trans('automator.setup.model')} help={trans('automator.setup.modelHelp')}><Input aria-label={trans('automator.setup.model')} value={model} onChange={e => setModel(e.target.value)} placeholder={trans('automator.setup.modelPlaceholder')} /></Form.Item>
        </Form>
        <details><summary>{trans('automator.setup.selfHostedTitle')}</summary>
          <ol>
            <li>{trans('automator.setup.selfHostedChoose')}</li>
            <li>{trans('automator.setup.selfHostedFormat')}</li>
            <li>{trans('automator.setup.selfHostedNetwork')}</li>
            <li>{trans('automator.setup.selfHostedAuth')}</li>
            <li>{trans('automator.setup.selfHostedBridge')}</li>
          </ol>
          <a href={trans('docUrls.githubAutomator')} target="_blank" rel="noopener noreferrer">{trans('automator.setup.providerDocs')}</a>
        </details>
      </>}
      {step === 1 && <>
        <h3>{trans('automator.setup.reviewTitle')}</h3>
        <p>{trans(source === 'new' ? 'automator.setup.reviewNew' : 'automator.setup.reviewExisting')}</p>
        <ol>
          <li><strong>{trans('automator.setup.providerQuery')}</strong><p>{trans('automator.setup.providerQueryHelp', { path, model })}</p></li>
          <li><strong>{trans('automator.setup.bridgeQuery')}</strong><p>{trans('automator.setup.bridgeQueryHelp')}</p></li>
        </ol>
        <p>{trans('automator.setup.existingQueriesNote')}</p>
        <Alert type="info" showIcon message={trans('automator.setup.runControlTitle')} description={trans('automator.setup.runControlHelp')} />
      </>}
      {step === 2 && <>
        <h3>{verified ? trans('automator.setup.readyTitle') : trans('automator.setup.testTitle')}</h3>
        <p>{trans('automator.setup.createdQueries', { http: queries?.http, bridge: queries?.bridge })}</p>
        {savedSource && <p><a href={buildDatasourceEditUrl(savedSource.id)} target="_blank" rel="noopener noreferrer">{trans('automator.setup.manageConnection')}</a></p>}
        {verified && <Alert type="success" showIcon message={trans('automator.setup.verifiedTitle')} description={trans('automator.setup.verifiedHelp')} />}
        <Alert type="info" showIcon message={trans('automator.setup.selectedBridge', { bridge: queries?.bridge, http: queries?.http })} />
      </>}
      {error && <Alert role="alert" type="error" showIcon message={error} description={errorDetail || undefined} style={{ marginTop: 16 }} />}
    </Content>
  </Modal>;
}
