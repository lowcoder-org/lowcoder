// Importable manual fixture. All external operations are replaced with in-memory Code nodes.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const logic = require('./logic.cjs');
const production = JSON.parse(fs.readFileSync(path.join(__dirname, 'workflow.json'), 'utf8'));
const config = { productId:'prod_enterprise_fixture', prices:{month:'price_month_fixture',year:'price_year_fixture'}, livemode:false };
const source = fs.readFileSync(path.join(__dirname, 'logic.cjs'),'utf8').replace('module.exports =','return');
const nodes = [], connections = {};
function clone(name) {
  const node = structuredClone(production.nodes.find(node=>node.name===name));
  if (!node) throw new Error('Missing production node: '+name);
  delete node.credentials;
  if (node.parameters.jsCode) node.parameters.jsCode=node.parameters.jsCode.replace(/^const config = [^\n]+;/,`const config = ${JSON.stringify(config)};`);
  nodes.push(node);
}
function code(name, body) {
  nodes.push({id:name.toLowerCase().replace(/[^a-z0-9]+/g,'-'),name,type:'n8n-nodes-base.code',typeVersion:2,position:[0,0],
    parameters:{jsCode:`const config=${JSON.stringify(config)};\nconst logic=(()=>{\n${source}\n})();\n${body}`}});
}
function connect(from,to,output=0) {
  const main=(connections[from]||={main:[]}).main;
  while(main.length<=output)main.push([]);
  main[output].push({node:to,type:'main',index:0});
}
function chain(...names) { for(let i=1;i<names.length;i++)connect(names[i-1],names[i]); }
const token='A'.repeat(43);
const ownerHash=crypto.createHash('sha256').update(token).digest('hex');
const request1='00000000-0000-4000-8000-000000000001',request2='00000000-0000-4000-8000-000000000002';
const expected=[...['host-1','host-2','host-3'].map(d=>[request1,'in_fixture1',d]),...['host-1','host-4'].map(d=>[request2,'in_fixture2',d])]
  .map(parts=>logic.uuidFromHash(crypto.createHash('sha256').update(parts.join(':')).digest('hex'))).sort();
nodes.push({id:'manual-fixtures',name:'Manual fixtures only',type:'n8n-nodes-base.manualTrigger',typeVersion:1,position:[0,0],parameters:{}});
code('Mock authenticated request',`return [{json:{headers:{'lowcoder-enterprise-owner':'${token}'},body:{
action:'checkout',hostId:'host-1',orgId:'org-fixture',userId:'admin-fixture',issuedAt:Date.now(),requestId:'${request1}',
billingInterval:'month',deploymentIds:['host-1','host-2','host-3'],returnUrl:'https://fixture.example/setting/subscription?enterpriseLicense=return',
contactData:{companyName:'Runtime Fixture',address:'Fixture address',registerNumber:'FIXTURE',contactName:'Fixture Admin',contactEmail:'fixture@example.test',contactPhone:'+10000000000'}}}}];`);
clone('Hash private owner'); clone('Validate request');
code('Load purchases to refresh',`const first=$input.first().json;
if(first.capabilityHash!=='${ownerHash}')throw new Error('Native owner hash mismatch');
const second={...first,requestId:'${request2}',billingInterval:'year',deploymentIds:['host-1','host-4'],quantity:2,unitAmount:499000,priceId:config.prices.year};
return [{json:{orders:[{payload:first,customer_id:'cus_fixture1',checkout_id:'cs_fixture1'},{payload:second,customer_id:'cus_fixture2',checkout_id:'cs_fixture2'}]}}];`);
for(const name of ['Queue purchases','Each purchase','Has purchase'])clone(name);
code('Check paid Enterprise period',`const order=$('Each purchase').item.json;
const start=Math.floor(Date.now()/1000)-60,end=start+(order.billingInterval==='year'?366:31)*86400;
const suffix=order.requestId.endsWith('1')?'1':'2',amount=order.quantity*order.unitAmount;
const price={id:order.priceId,product:config.productId,active:true,livemode:false,currency:'usd',unit_amount:order.unitAmount,billing_scheme:'per_unit',recurring:{interval:order.billingInterval,interval_count:1,usage_type:'licensed'}};
const sub={id:'sub_fixture'+suffix,customer:order.customerId,status:'active',livemode:false,
items:{has_more:false,data:[{id:'si_fixture'+suffix,price,quantity:order.quantity,current_period_start:start,current_period_end:end}]},
metadata:{lowcoder_license_request:order.requestId,lowcoder_hostId:order.hostId,lowcoder_orgId:order.orgId,lowcoder_userId:order.userId}};
logic.checkSession({id:order.checkoutId,customer:order.customerId,client_reference_id:order.requestId,metadata:{lowcoder_license_request:order.requestId},subscription:sub},order);
const invoice={id:'in_fixture'+suffix,customer:order.customerId,parent:{subscription_details:{subscription:sub.id}},status:'paid',livemode:false,currency:'usd',amount_paid:amount,amount_remaining:0,billing_reason:'subscription_cycle',
lines:{has_more:false,data:[{amount,quantity:order.quantity,pricing:{price_details:{price:order.priceId,product:config.productId}},parent:{subscription_item_details:{proration:false}},period:{start,end}}]}};
const period=logic.paidPeriod(invoice,sub,order,config);
logic.verifyPayments({has_more:false,data:[{invoice:invoice.id,status:'paid',currency:'usd',amount_paid:amount,payment:{type:'payment_intent',payment_intent:{status:'succeeded',customer:order.customerId,currency:'usd',amount_received:amount}}}]},period,order);
return [{json:{order,period}}];`);
code('Check refund and dispute',`const order=$json.order;return [{json:{status:'succeeded',customer:order.customerId,currency:'usd',amount_received:order.quantity*order.unitAmount,latest_charge:{paid:true,status:'succeeded',amount_refunded:0,disputed:false}}}];`);
for(const name of ['Plan paid licenses','Hash license identities','Finalize license plans','Each paid deployment'])clone(name);
code('Claim license generation',`return [{json:{claimed:$json.deploymentId!=='host-3',plan:$json}}];`);
clone('Lease acquired');
code('Generate private license',`return [{json:{success:true,license:'UlVOVElNRSBGSVhUVVJFIE5PVCBBIExJQ0VOU0U='}}];`);
clone('Validate license file');
code('Store private license',`return [{json:{...$json,generated:true}}];`);
code('Read private library',`const rows=$input.all().map(item=>item.json);
const plans=rows.map(row=>row.plan||row),ids=plans.map(plan=>plan.id).sort();
if(JSON.stringify(ids)!==JSON.stringify(${JSON.stringify(expected)}))throw new Error('Nested loops missed or repeated a deployment: '+JSON.stringify(ids));
if(rows.filter(row=>row.generated).length!==4||rows.filter(row=>row.claimed===false).length!==1)throw new Error('Lease branches did not return all five entries');
if(plans.some(plan=>plan.leaseToken!==String($execution.id)||plan.body.apiCallsLimit!==1000000000))throw new Error('Plan mismatch');
return [{json:{success:true,purchases:2,deployments:5,generatedFixtures:4,skippedExistingLease:1,nativeHashesVerified:true,externalCalls:0,licenseFilesIssued:0}}];`);
chain('Manual fixtures only','Mock authenticated request','Hash private owner','Validate request','Load purchases to refresh','Queue purchases','Each purchase');
connect('Each purchase','Read private library',0);connect('Each purchase','Has purchase',1);
connect('Has purchase','Check paid Enterprise period',0);connect('Has purchase','Each purchase',1);
chain('Check paid Enterprise period','Check refund and dispute','Plan paid licenses','Hash license identities','Finalize license plans','Each paid deployment');
connect('Each paid deployment','Each purchase',0);connect('Each paid deployment','Claim license generation',1);
chain('Claim license generation','Lease acquired');
connect('Lease acquired','Generate private license',0);connect('Lease acquired','Each paid deployment',1);
chain('Generate private license','Validate license file','Store private license','Each paid deployment');
for(const [index,node] of nodes.entries())node.position=[(index%6)*300,Math.floor(index/6)*300];
const allowed=new Set(['manualTrigger','code','crypto','splitInBatches','if'].map(type=>'n8n-nodes-base.'+type));
if(nodes.some(node=>!allowed.has(node.type)||node.credentials))throw new Error('Unsafe harness node');
fs.writeFileSync(path.join(__dirname,'runtime-harness.json'),JSON.stringify({name:'Enterprise licenses - runtime fixtures (no external calls)',nodes,connections,active:false,
settings:{...production.settings,executionTimeout:60}},null,2)+'\n');
