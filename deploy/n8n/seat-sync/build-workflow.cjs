const fs = require('node:fs');
const path = require('node:path');
const code = fs.readFileSync(path.join(__dirname, 'logic.cjs'), 'utf8').replace('module.exports =', 'return');
const nodes = [], connections = {};
function node(name, type, parameters, version = 2) {
  nodes.push({ id: name.toLowerCase().replace(/ /g, '-'), name, type: `n8n-nodes-base.${type}`,
    typeVersion: version, position: [nodes.length * 220, 0], parameters });
  return name;
}
function connect(from, to, output = 0) {
  const outputs = (connections[from] ||= { main: [] }).main;
  while (outputs.length <= output) outputs.push([]);
  outputs[output].push({ node: to, type: 'main', index: 0 });
}
function logic(name, body) { return node(name, 'code', { jsCode: `const logic = (() => {\n${code}\n})();\n${body}` }); }
function branch(name, expression, yes, no) {
  node(name, 'if', { conditions: { options: { caseSensitive: true, typeValidation: 'strict', version: 2 },
    conditions: [{ id: name, leftValue: expression, rightValue: 0, operator: { type: 'number', operation: 'gt' } }], combinator: 'and' } });
  connect(name, yes); connect(name, no, 1);
}
function get(name, url, params, cursor = 'starting_after') {
  node(name, 'httpRequest', { url, authentication: 'predefinedCredentialType', nodeCredentialType: 'stripeApi',
    sendQuery: true, queryParameters: { parameters: Object.entries(params).map(([name, value]) => ({ name, value })) },
    options: { timeout: 10000, pagination: { pagination: {
      paginationMode: 'updateAParameterInEachRequest',
      parameters: { parameters: [{ type: 'qs', name: cursor, value: cursor === 'page'
        ? '={{ $response.body.next_page }}' : '={{ $response.body.data[$response.body.data.length - 1].id }}' }] },
      paginationCompleteWhen: 'other', completeExpression: '={{ !$response.body.has_more }}',
      limitPagesFetched: true, maxRequests: 100,
    } } } }, 4.2);
  nodes.at(-1).credentials = { stripeApi: { id: 'REPLACE_STRIPE_CREDENTIAL_ID', name: 'Lowcoder Stripe' } };
}
node('Seat sync webhook', 'webhook', { httpMethod: 'POST', path: 'secure/sync-workspace-seats',
  authentication: 'headerAuth', responseMode: 'responseNode', options: {} });
nodes.at(-1).credentials = { httpHeaderAuth: { id: 'REPLACE_SEAT_SYNC_CREDENTIAL_ID', name: 'Lowcoder Seat Sync (server only)' } };
logic('Validate snapshot', `const expectedHostId = 'REPLACE_WITH_DEPLOYMENT_ID';\nreturn [{ json: logic.validateSnapshot($input.first().json.body, expectedHostId) }];`);
get('Search customers', 'https://api.stripe.com/v1/customers/search', {
  query: `={{ "metadata['lowcoder_hostId']:'" + $json.hostId + "' AND metadata['lowcoder_orgId']:'" + $json.orgId + "'" }}`, limit: '100',
}, 'page');
logic('Collect customers', `const snapshot = $('Validate snapshot').first().json;\nconst customers = logic.customersForSnapshot(logic.collectPages($input.all().map(i => i.json), 1), snapshot);\nreturn [{ json: { customers } }];`);
branch('Has customers', '={{ $json.customers.length }}', 'Split customers', 'No changes');
node('Split customers', 'splitOut', { fieldToSplitOut: 'customers', options: { destinationFieldName: 'customers' } }, 1);
get('List subscriptions', 'https://api.stripe.com/v1/subscriptions', { customer: '={{ $json.customers.id }}', status: 'all', limit: '100' });
logic('Collect subscriptions', `const customers = $('Collect customers').first().json.customers;\nconst subscriptions = logic.subscriptionsForCustomers(logic.collectPages($input.all().map(i => i.json), customers.length), customers);\nreturn [{ json: { subscriptions } }];`);
branch('Has subscriptions', '={{ $json.subscriptions.length }}', 'Split subscriptions', 'No changes');
node('Split subscriptions', 'splitOut', { fieldToSplitOut: 'subscriptions', options: { destinationFieldName: 'subscriptions' } }, 1);
get('List subscription items', 'https://api.stripe.com/v1/subscription_items', { subscription: '={{ $json.subscriptions.id }}', limit: '100' });
logic('Plan updates', `const snapshot = $('Validate snapshot').first().json;\nconst subscriptions = $('Collect subscriptions').first().json.subscriptions;\nconst updates = logic.planUpdates(logic.collectPages($input.all().map(i => i.json), subscriptions.length), subscriptions, snapshot);\nreturn [{ json: { updates } }];`);
branch('Has updates', '={{ $json.updates.length }}', 'Split updates', 'No changes');
node('Split updates', 'splitOut', { fieldToSplitOut: 'updates', options: { destinationFieldName: 'updates' } }, 1);
node('Update Stripe quantity', 'httpRequest', { method: 'POST',
  url: '=https://api.stripe.com/v1/subscription_items/{{ $json.updates.itemId }}',
  authentication: 'predefinedCredentialType', nodeCredentialType: 'stripeApi',
  sendHeaders: true, headerParameters: { parameters: [{ name: 'Idempotency-Key', value: '={{ $json.updates.idempotencyKey }}' }] },
  sendBody: true, contentType: 'form-urlencoded', bodyParameters: { parameters: [
    { name: 'quantity', value: '={{ $json.updates.quantity }}' },
    { name: 'proration_behavior', value: '={{ $json.updates.prorationBehavior }}' },
  ] }, options: { timeout: 10000 } }, 4.2);
Object.assign(nodes.at(-1), { credentials: { stripeApi: { id: 'REPLACE_STRIPE_CREDENTIAL_ID', name: 'Lowcoder Stripe' } },
  retryOnFail: true, maxTries: 3, waitBetweenTries: 1000 });
logic('Confirm updates', `return [{ json: logic.confirmUpdates($input.all().map(i => i.json), $('Plan updates').first().json.updates, $('Validate snapshot').first().json) }];`);
logic('No changes', `return [{ json: logic.confirmUpdates([], [], $('Validate snapshot').first().json) }];`);
node('Respond', 'respondToWebhook', { respondWith: 'json', responseBody: '={{ $json }}', options: {} }, 1.4);
for (const [from, to] of [
  ['Seat sync webhook','Validate snapshot'], ['Validate snapshot','Search customers'], ['Search customers','Collect customers'],
  ['Collect customers','Has customers'], ['Split customers','List subscriptions'], ['List subscriptions','Collect subscriptions'],
  ['Collect subscriptions','Has subscriptions'], ['Split subscriptions','List subscription items'], ['List subscription items','Plan updates'],
  ['Plan updates','Has updates'], ['Split updates','Update Stripe quantity'], ['Update Stripe quantity','Confirm updates'],
  ['Confirm updates','Respond'], ['No changes','Respond'],
]) connect(from, to);
const workflow = { name: 'Workspace subscription seat synchronization', nodes, connections,
  active: false, settings: { executionOrder: 'v1', executionTimeout: 60, saveDataSuccessExecution: 'none',
    saveDataErrorExecution: 'none', saveManualExecutions: false } };
fs.writeFileSync(path.join(__dirname, 'workflow.json'), JSON.stringify(workflow, null, 2) + '\n');
