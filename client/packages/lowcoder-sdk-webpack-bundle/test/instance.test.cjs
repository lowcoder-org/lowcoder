const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const lodash = require('lodash');
const source = fs.readFileSync(path.join(__dirname, '../../lowcoder/src/appView/AppViewInstance.tsx'), 'utf8');
const code = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText;
function fixture(get = async () => { throw new Error('API unavailable'); }) {
  const jsx = (type, props) => ({type,props});
  const dependencies = {
    lodash, axios: { create: () => ({ get }) },
    'react/jsx-runtime': {jsx, jsxs:jsx}, react: {lazy:() => 'AppView', Suspense:'Suspense'},
    'styled-components': {StyleSheetManager:'Styles'}, 'antd/es/flex':'Flex',
    'components/button':{TacoButton:'Button'}, 'comps/utils/globalSettings':{setGlobalSettings(){}},
    'constants/sdkConfig':{sdkConfig:{}}, 'constants/apiConstants':{API_STATUS_CODES:{REQUEST_NOT_AUTHORISED:401}},
    'constants/routesURL':{AUTH_LOGIN_URL:'/auth/login'}, 'constants/authConstants':{AuthSearchParams:{}},
    'pages/userAuth/authUtils':{saveAuthSearchParams(){}},
    '@lowcoder-ee/api/datasourceApi':{DatasourceApi:{fetchJsDatasourceByApp:async () => ({data:{data:[]}})}},
    '@lowcoder-ee/constants/queryConstants':{registryDataSourcePlugin(){}},
  };
  const context = vm.createContext({ exports:{}, require(name) { if (!(name in dependencies)) throw Error(name); return dependencies[name]; }, window:{location:{href:'https://host.example'}} });
  vm.runInContext(code, context);
  const rendered=[]; let unmounts=0;
  return {Instance:context.exports.AppViewInstance, root:{render(tree){rendered.push(tree)},unmount(){unmounts++}}, rendered, unmounts:()=>unmounts};
}
const dsl = {ui:{compType:'module',comp:{io:{inputs:[{name:'value',defaultValue:{comp:'default'}}]}}}};
test('preserves false, zero and empty inputs without mutating the supplied app definition', async () => {
  for (const value of [0,false,'']) {
    const f=fixture(); const app=new f.Instance('demo',{},f.root,{appDsl:dsl,moduleInputs:{value}});
    await app.ready;
    const passed=f.rendered[0].props.children.props.children.props.dsl;
    assert.equal(passed.ui.comp.io.inputs[0].defaultValue.comp,value);
    assert.equal(dsl.ui.comp.io.inputs[0].defaultValue.comp,'default');
  }
});
test('destroy is idempotent and prevents late rendering and callbacks', async () => {
  const f=fixture(); const app=new f.Instance('demo',{},f.root,{appDsl:dsl}); let calls=0;
  app.on('moduleEventTriggered',()=>calls++); app.destroy(); app.destroy(); await app.ready;
  app.emit('moduleEventTriggered',['event']); app.setModuleInputs({value:1});
  assert.equal(calls,0); assert.equal(f.rendered.length,0); assert.equal(f.unmounts(),1);
});
test('unsubscribing an old handler does not remove its replacement', async () => {
  const f=fixture(); const app=new f.Instance('demo',{},f.root,{appDsl:dsl}); await app.ready; let calls=0;
  const off=app.on('moduleEventTriggered',()=>{});
  app.on('moduleEventTriggered',()=>calls++); off(); app.emit('moduleEventTriggered',['event']);
  assert.equal(calls,1);
});
test('network errors reject readiness rather than render a blank app', async () => {
  const f=fixture(); const app=new f.Instance('demo',{},f.root,{});
  await assert.rejects(app.ready,/API unavailable/); assert.equal(f.rendered.length,0);
});
