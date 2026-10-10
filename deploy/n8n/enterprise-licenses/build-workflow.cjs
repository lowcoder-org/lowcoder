const fs = require('node:fs');
const path = require('node:path');
const config = JSON.parse(fs.readFileSync(process.argv[2] || path.join(__dirname, 'config.example.json'), 'utf8'));
const source = fs.readFileSync(path.join(__dirname, 'logic.cjs'), 'utf8').replace('module.exports =', 'return');
const nodes = [], connections = {};
const settings = { executionOrder: 'v1', executionTimeout: 100, saveDataSuccessExecution: 'none', saveDataErrorExecution: 'none', saveManualExecutions: false };
function node(name, type, parameters, version = 2, credentials) {
  nodes.push({ id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name, type: `n8n-nodes-base.${type}`,
    typeVersion: version, position: [(nodes.length % 8) * 260, Math.floor(nodes.length / 8) * 260], parameters,
    ...(credentials ? { credentials } : {}) });
}
const credential = (type, id, name) => ({ [type]: { id, name } });
const stripeCred = credential('stripeApi', config.credentialIds.stripe, 'Lowcoder Stripe');
const dbCred = credential('postgres', config.credentialIds.postgres, 'License Database — Enterprise licensing');
function connect(from, to, output = 0) {
  const main = (connections[from] ||= { main: [] }).main;
  while (main.length <= output) main.push([]);
  main[output].push({ node: to, type: 'main', index: 0 });
}
function chain(...names) { for (let i = 1; i < names.length; i++) connect(names[i-1], names[i]); }
function code(name, body) { node(name, 'code', { jsCode: `const config = ${JSON.stringify(config)};\nconst logic = (() => {\n${source}\n})();\n${body}` }); }
function sql(name, query, values) { node(name, 'postgres', { operation: 'executeQuery', query,
  options: { queryReplacement: `={{ ${values} }}` } }, 2.6, dbCred); }
function branch(name, expression) { node(name, 'if', { conditions: { options: { caseSensitive: true, typeValidation: 'strict', version: 2 },
  conditions: [{ id: name, leftValue: expression, rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } }); }
function get(name, url, params = []) { node(name, 'httpRequest', { url, authentication: 'predefinedCredentialType', nodeCredentialType: 'stripeApi',
  sendQuery: params.length > 0, queryParameters: { parameters: params.map(([name,value]) => ({name,value})) },
  sendHeaders: true, headerParameters: { parameters: [{ name: 'Stripe-Version', value: '2026-08-26.dahlia' }] }, options: { timeout: 10000 } }, 4.2, stripeCred); }
function post(name, url, fields, key) { node(name, 'httpRequest', { method: 'POST', url, authentication: 'predefinedCredentialType', nodeCredentialType: 'stripeApi',
  sendHeaders: true, headerParameters: { parameters: [{ name: 'Stripe-Version', value: '2026-08-26.dahlia' }, ...(key ? [{ name: 'Idempotency-Key', value: key }] : [])] },
  sendBody: true, contentType: 'form-urlencoded', specifyBody: 'string', body: fields, options: { timeout: 10000 } }, 4.2, stripeCred); }
const form = expression => `={{ Object.entries(${expression}).map(([k,v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v)).join('&') }}`;
const scope = `[$('Validate request').first().json.hostId, $('Validate request').first().json.orgId, $('Validate request').first().json.userId, $('Validate request').first().json.capabilityHash]`;
const owner = `o.host_id=$1 AND o.org_id=$2 AND o.user_id=$3 AND o.capability_hash=$4`;
node('Enterprise UI relay', 'webhook', { httpMethod: 'POST', path: 'secure/enterprise-licenses', authentication: 'none', responseMode: 'responseNode', options: {} }, 2);
code('Validate request', `const input=$input.first().json; const token=input.headers?.['lowcoder-enterprise-owner'];
if(typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) throw new Error('Missing private ownership capability');
const hash=require('crypto').createHash('sha256').update(token).digest('hex');
return [{json: logic.validateRequest(input.body, config, Date.now(), hash)}];`);
node('Route request', 'switch', { rules: { values: ['checkout','sync','status','download','portal'].map(action => ({
  conditions: { options: { caseSensitive: true, typeValidation: 'strict', version: 2 }, conditions: [{ leftValue: '={{ $json.action }}', rightValue: action,
    operator: { type: 'string', operation: 'equals' } }], combinator: 'and' }, renameOutput: true, outputKey: action })) }, options: {} }, 3.2);
chain('Enterprise UI relay', 'Validate request', 'Route request');

// Order payload and authenticated owner are immutable; a reused request ID cannot change a purchase.
sql('Reserve purchase', `WITH inserted AS (
 INSERT INTO enterprise_billing.orders(request_id,host_id,org_id,user_id,capability_hash,payload) VALUES($1::uuid,$2,$3,$4,$5,$6::jsonb)
 ON CONFLICT(request_id) DO UPDATE SET updated_at=enterprise_billing.orders.updated_at
 WHERE enterprise_billing.orders.host_id=EXCLUDED.host_id AND enterprise_billing.orders.org_id=EXCLUDED.org_id
 AND enterprise_billing.orders.user_id=EXCLUDED.user_id AND enterprise_billing.orders.capability_hash=EXCLUDED.capability_hash AND enterprise_billing.orders.payload=EXCLUDED.payload RETURNING *)
 SELECT COALESCE((SELECT to_jsonb(inserted) FROM inserted),'null'::jsonb) AS row`,
 `[$json.requestId,$json.hostId,$json.orgId,$json.userId,$json.capabilityHash,JSON.stringify($json)]`);
code('Read purchase', `const row=$input.first().json.row; if(!row) throw new Error('Purchase ID conflict');
if (!row.checkout_id && Date.now()-Date.parse(row.created_at)>23*3600000) throw new Error('Checkout requires reconciliation before retry');
return [{json:{...row.payload, customerId:row.customer_id, checkoutId:row.checkout_id, checkoutUrl:row.checkout_url}}];`);
branch('Checkout already exists', '={{ !!$json.checkoutId }}');
code('Existing checkout response', `return [{json:{success:true,requestId:$json.requestId,checkoutUrl:$json.checkoutUrl}}];`);
get('Retrieve Enterprise price', '=https://api.stripe.com/v1/prices/{{ $json.priceId }}');
code('Check advertised price', `return [{json:logic.validatePrice($json,$('Read purchase').first().json,config)}];`);
post('Create billing customer', 'https://api.stripe.com/v1/customers', form(`{
 name:$json.contactData.companyName,email:$json.contactData.contactEmail,phone:$json.contactData.contactPhone,
 'metadata[lowcoder_license_request]':$json.requestId,'metadata[lowcoder_hostId]':$json.hostId,
 'metadata[lowcoder_orgId]':$json.orgId,'metadata[lowcoder_userId]':$json.userId}`), '=enterprise-customer-{{ $json.requestId }}');
code('Prepare Checkout', `const order=$('Read purchase').first().json; return [{json:{fields:logic.checkoutForm(order,$json.id,config),customerId:$json.id}}];`);
post('Create Stripe Checkout', 'https://api.stripe.com/v1/checkout/sessions', form('$json.fields'), '=enterprise-checkout-{{ $("Read purchase").first().json.requestId }}');
code('Validate Checkout result', `const s=$json,o=$('Read purchase').first().json;
if(s.mode!=='subscription'||s.client_reference_id!==o.requestId||s.metadata?.lowcoder_license_request!==o.requestId||
!logic.stripeUrl(s.url,'checkout')) throw new Error('Unexpected Checkout response');
return [{json:{requestId:o.requestId,id:s.id,url:s.url,customerId:$('Prepare Checkout').first().json.customerId}}];`);
sql('Save Checkout', `UPDATE enterprise_billing.orders SET customer_id=$2,checkout_id=$3,checkout_url=$4,updated_at=now()
 WHERE request_id=$1::uuid AND (checkout_id IS NULL OR checkout_id=$3)
 RETURNING jsonb_build_object('success',true,'requestId',request_id,'checkoutUrl',checkout_url) AS result`,
 `[$json.requestId,$json.customerId,$json.id,$json.url]`);
code('Checkout response', `return [{json:$json.result}];`);
connect('Route request','Reserve purchase',0);
chain('Reserve purchase','Read purchase','Checkout already exists');
connect('Checkout already exists','Existing checkout response');
connect('Checkout already exists','Retrieve Enterprise price',1);
chain('Retrieve Enterprise price','Check advertised price','Create billing customer','Prepare Checkout','Create Stripe Checkout','Validate Checkout result','Save Checkout','Checkout response');

// UI/date renewal: only revisit purchases whose current files are missing or expired.
sql('Load purchases to refresh', `SELECT COALESCE(jsonb_agg(to_jsonb(o)),'[]'::jsonb) AS orders FROM enterprise_billing.orders o
 WHERE ${owner} AND o.checkout_id IS NOT NULL AND
 (SELECT count(*) FROM enterprise_billing.files f WHERE f.request_id=o.request_id AND f.license IS NOT NULL
 AND f.not_before <= now() AT TIME ZONE 'UTC' AND f.not_after >= now() AT TIME ZONE 'UTC') < jsonb_array_length(o.payload->'deploymentIds')`,scope);
code('Queue purchases', `const rows=$json.orders; return rows.length ? rows.map(row=>({json:{...row.payload,customerId:row.customer_id,checkoutId:row.checkout_id}})) : [{json:{skip:true}}];`);
node('Each purchase', 'splitInBatches', { batchSize: 1, options: {} }, 3);
branch('Has purchase', '={{ !$json.skip }}');
get('Read paid subscription', '=https://api.stripe.com/v1/checkout/sessions/{{ $json.checkoutId }}', [['expand[]','subscription']]);
code('Check subscription owner', `const order=$('Each purchase').item.json,sub=logic.checkSession($json,order);
return [{json:{order,sub,invoiceId:typeof sub?.latest_invoice==='string'?sub.latest_invoice:sub?.latest_invoice?.id,
status:sub?.status || ($json.status==='expired'?'checkout_expired':'awaiting_payment')}}];`);
sql('Save subscription status', `UPDATE enterprise_billing.orders SET subscription_id=$2,status=$3,updated_at=now() WHERE request_id=$1::uuid
 RETURNING $4::jsonb AS state`, `[$json.order.requestId,$json.sub?.id||null,$json.status,JSON.stringify($json)]`);
code('Read subscription state', `return [{json:$json.state}];`);
branch('Has invoice', '={{ !!$json.invoiceId }}');
get('Read current invoice', '=https://api.stripe.com/v1/invoices/{{ $json.invoiceId }}');
code('Check paid Enterprise period', `const state=$('Read subscription state').item.json;
return [{json:{...state,period:logic.paidPeriod($json,state.sub,state.order,config)}}];`);
branch('Paid current period', '={{ !!$json.period }}');
get('Verify invoice payments', 'https://api.stripe.com/v1/invoice_payments', [['invoice','={{ $json.period.invoiceId }}'],['limit','100'],['expand[]','data.payment.payment_intent']]);
code('Select successful payment', `const state=$('Check paid Enterprise period').item.json; logic.verifyPayments($json,state.period,state.order);
const payments=$json.data.filter(p=>p.status==='paid'&&p.payment?.payment_intent?.status==='succeeded');
if(payments.length!==1 || payments[0].amount_paid < state.order.unitAmount*state.order.quantity) throw new Error('Expected one complete Checkout payment');
return [{json:{intentId:payments[0].payment.payment_intent.id}}];`);
get('Check refund and dispute', '=https://api.stripe.com/v1/payment_intents/{{ $json.intentId }}', [['expand[]','latest_charge']]);
code('Plan paid licenses', `const state=$('Check paid Enterprise period').item.json;
logic.verifyCharge($json,state.order);
const crypto=require('crypto'); const deterministicUuid=value=>{const b=crypto.createHash('sha256').update(value).digest();b[6]=(b[6]&15)|80;b[8]=(b[8]&63)|128;const h=b.subarray(0,16).toString('hex');return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);};
return logic.licensePlan(state.order,state.period,deterministicUuid).map(plan=>({json:{...plan,leaseToken:crypto.randomUUID()}}));`);
node('Each paid deployment', 'splitInBatches', { batchSize: 1, options: { reset: '={{ $("Plan paid licenses").isExecuted && $node["Each paid deployment"].context["done"] }}' } }, 3);
sql('Claim license generation', `WITH claimed AS (INSERT INTO enterprise_billing.files(id,request_id,invoice_id,deployment_id,not_before,not_after,filename,lease_token,lease_until)
 VALUES($1::uuid,$2::uuid,$3,$4,$5::timestamp,$6::timestamp,$7,$8,now()+interval '180 seconds')
 ON CONFLICT(id) DO UPDATE SET lease_token=EXCLUDED.lease_token,lease_until=EXCLUDED.lease_until
 WHERE enterprise_billing.files.license IS NULL AND enterprise_billing.files.lease_until<now()
 RETURNING id) SELECT EXISTS(SELECT 1 FROM claimed) AS claimed, $9::jsonb AS plan`,
 `[$json.id,$json.requestId,$json.invoiceId,$json.deploymentId,$json.notBefore,$json.notAfter,$json.filename,$json.leaseToken,JSON.stringify($json)]`);
branch('Lease acquired', '={{ $json.claimed }}');
node('Generate private license', 'httpRequest', { method: 'POST', url: config.licenseServerUrl + '/api/license/generate',
  authentication: 'genericCredentialType', genericAuthType: 'httpHeaderAuth', sendBody: true, specifyBody: 'json', jsonBody: '={{ $json.plan.body }}',
  options: { timeout: 15000, redirect: { redirect: { followRedirects: false } } } }, 4.2,
  credential('httpHeaderAuth',config.credentialIds.generator,'License generator X-API-KEY'));
code('Validate license file', `const plan=$('Claim license generation').item.json.plan;
return [{json:{...plan,license:logic.generatedFile($json)}}];`);
sql('Store private license', `UPDATE enterprise_billing.files SET license=$2,lease_until=now() WHERE id=$1::uuid AND lease_token=$3 AND license IS NULL RETURNING id`,
 `[$json.id,$json.license,$json.leaseToken]`);
connect('Route request','Load purchases to refresh',1);
chain('Load purchases to refresh','Queue purchases','Each purchase');
connect('Each purchase','Read private library',0); connect('Each purchase','Has purchase',1);
connect('Has purchase','Read paid subscription'); connect('Has purchase','Each purchase',1);
chain('Read paid subscription','Check subscription owner','Save subscription status','Read subscription state','Has invoice');
connect('Has invoice','Read current invoice'); connect('Has invoice','Each purchase',1);
chain('Read current invoice','Check paid Enterprise period','Paid current period');
connect('Paid current period','Verify invoice payments'); connect('Paid current period','Each purchase',1);
chain('Verify invoice payments','Select successful payment','Check refund and dispute','Plan paid licenses','Each paid deployment');
connect('Each paid deployment','Each purchase',0); connect('Each paid deployment','Claim license generation',1);
chain('Claim license generation','Lease acquired');
connect('Lease acquired','Generate private license'); connect('Lease acquired','Each paid deployment',1);
chain('Generate private license','Validate license file','Store private license','Each paid deployment');

sql('Read private library', `SELECT jsonb_build_object('success',true,'orders',COALESCE((SELECT jsonb_agg(jsonb_build_object(
 'requestId',o.request_id,'companyName',o.payload->'contactData'->>'companyName','billingInterval',o.payload->>'billingInterval',
 'deploymentIds',o.payload->'deploymentIds','status',o.status,'checkoutUrl',CASE WHEN o.status='awaiting_payment' THEN o.checkout_url ELSE NULL END) ORDER BY o.created_at DESC)
 FROM enterprise_billing.orders o WHERE ${owner}),'[]'::jsonb),
 'licenses',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',f.id,'filename',f.filename,'deploymentId',f.deployment_id,
 'notBefore',to_char(f.not_before,'YYYY-MM-DD HH24:MI:SS')||' UTC','notAfter',to_char(f.not_after,'YYYY-MM-DD HH24:MI:SS')||' UTC') ORDER BY f.not_after DESC)
 FROM enterprise_billing.files f JOIN enterprise_billing.orders o ON o.request_id=f.request_id WHERE ${owner} AND f.license IS NOT NULL),'[]'::jsonb)) AS result`,scope);
code('Library response', `return [{json:$json.result}];`);
connect('Route request','Read private library',2); chain('Read private library','Library response');
sql('Download owned license', `SELECT (SELECT jsonb_build_object('success',true,'filename',f.filename,'license',f.license)
 FROM enterprise_billing.files f JOIN enterprise_billing.orders o ON o.request_id=f.request_id
 WHERE ${owner} AND f.id=$5::uuid AND f.license IS NOT NULL) AS result`,
 `[...${scope},$('Validate request').first().json.licenseId]`);
code('Download response', `if(!$json.result) throw new Error('License not found'); return [{json:$json.result}];`);
connect('Route request','Download owned license',3); chain('Download owned license','Download response');
sql('Read owned billing account', `SELECT (SELECT jsonb_build_object('customer',customer_id,'returnUrl',payload->>'returnUrl') FROM enterprise_billing.orders o WHERE ${owner} AND request_id=$5::uuid) AS account`,
 `[...${scope},$('Validate request').first().json.requestId]`);
code('Check billing owner', `if(!/^cus_/.test($json.account?.customer||'')||!/^bpc_/.test(config.portalConfigurationId)) throw new Error('Billing portal unavailable');return [{json:{customer:$json.account.customer,configuration:config.portalConfigurationId,return_url:$json.account.returnUrl}}];`);
post('Open private billing portal','https://api.stripe.com/v1/billing_portal/sessions',form('$json'));
code('Portal response', `if(!logic.stripeUrl($json.url,'portal')) throw new Error('Invalid billing URL');return [{json:{success:true,url:$json.url}}];`);
connect('Route request','Read owned billing account',4);chain('Read owned billing account','Check billing owner','Open private billing portal','Portal response');
node('Respond privately','respondToWebhook',{respondWith:'json',responseBody:'={{ $json }}',options:{responseHeaders:{entries:[{name:'Cache-Control',value:'no-store, private'}]}}},1.4);
for(const name of ['Existing checkout response','Checkout response','Library response','Download response','Portal response'])connect(name,'Respond privately');
fs.writeFileSync(path.join(__dirname,'workflow.json'),JSON.stringify({name:'Enterprise licenses - private purchase and UI renewal',nodes,connections,active:false,settings},null,2)+'\n');

// Signed Stripe events are receipts, not license-generation triggers. Reconciliation also handles delayed/missed receipts.
const paymentNodes=[{
 id:'stripe-paid-event',name:'Stripe payment receipt',type:'n8n-nodes-base.stripeTrigger',typeVersion:1,position:[0,0],
 parameters:{events:['invoice.paid'],resolveData:false},credentials:stripeCred
},{id:'record-event',name:'Store verified receipt',type:'n8n-nodes-base.postgres',typeVersion:2.6,position:[300,0],credentials:dbCred,
 parameters:{operation:'executeQuery',query:`INSERT INTO enterprise_billing.payment_events(event_id,invoice_id) VALUES($1,$2) ON CONFLICT(event_id) DO NOTHING`,
 options:{queryReplacement:'={{ [$json.id,$json.data.object.id] }}'}}}];
fs.writeFileSync(path.join(__dirname,'payment-workflow.json'),JSON.stringify({name:'Enterprise licenses - verified Stripe payment receipts',nodes:paymentNodes,
 connections:{'Stripe payment receipt':{main:[[{node:'Store verified receipt',type:'main',index:0}]]}},active:false,settings},null,2)+'\n');
