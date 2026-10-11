const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const logic = require('./logic.cjs');
const snapshot = { hostId: 'host', orgId: 'workspace', requestId: 'request-1', issuedAt: 100000, quantity: 3 };
const customer = { id: 'cus_1', metadata: { lowcoder_hostId: 'host', lowcoder_orgId: 'workspace' } };
const sub = { id: 'sub_1', customer: 'cus_1', status: 'active' };
const item = (id, quantity, product = 'prod_VPq5GQPHJSQnzq') => ({ id, subscription: 'sub_1', quantity,
  price: { product, recurring: { usage_type: 'licensed' } } });

test('rejects foreign deployments, malformed IDs, browser values, and expired jobs', () => {
  assert.deepEqual(logic.validateSnapshot(snapshot, 'host', 100000), snapshot);
  for (const patch of [{ hostId: 'other' }, { orgId: "x' OR '1'" }, { quantity: -1 },
    { quantity: '3' }, { quantity: 1.5 }, { issuedAt: 69999 }, { issuedAt: 105001 }]) {
    assert.throws(() => logic.validateSnapshot({ ...snapshot, ...patch }, 'host', 100000));
  }
  assert.throws(() => logic.validateSnapshot(snapshot, 'REPLACE_WITH_DEPLOYMENT_ID', 100000));
});

test('pagination includes later pages, deduplicates, and fails closed when capped', () => {
  assert.deepEqual(logic.collectPages([{ data: [customer], has_more: true },
    { data: [customer, { ...customer, id: 'cus_2' }], has_more: false }], 1).map(c => c.id), ['cus_1','cus_2']);
  assert.throws(() => logic.collectPages([{ data: [customer], has_more: true }], 1));
  assert.throws(() => logic.collectPages([{ data: [customer], has_more: false }], 2));
});

test('tenant scope is checked again on returned customers and subscriptions', () => {
  const customers = logic.customersForSnapshot([customer, { id: 'cus_foreign', metadata: {
    lowcoder_hostId: 'other', lowcoder_orgId: 'workspace' } }], snapshot);
  assert.deepEqual(customers, [customer]);
  const subscriptions = logic.subscriptionsForCustomers([sub,
    { ...sub, id: 'sub_foreign', customer: 'cus_foreign' },
    { ...sub, id: 'sub_canceled', status: 'canceled' }], customers);
  assert.deepEqual(subscriptions, [sub]);
});

test('updates both seat products and never viewers, media, metered items or other subscriptions', () => {
  const plans = logic.planUpdates([
    item('si_ai', 1), item('si_support', 5, 'prod_QYGsTWZYyJYzMg'),
    item('si_media', 1, 'prod_SOz085DH7CmNHG'),
    { ...item('si_foreign', 1), subscription: 'sub_foreign' },
    { ...item('si_metered', 1), price: { product: 'prod_VPq5GQPHJSQnzq', recurring: { usage_type: 'metered' } } },
  ], [sub], snapshot);
  assert.deepEqual(plans.map(p => [p.itemId, p.quantity, p.prorationBehavior]),
    [['si_ai', 3, 'create_prorations'], ['si_support', 3, 'create_prorations']]);
});

test('unchanged count causes no write; zero is preserved without charging a phantom viewer', () => {
  assert.deepEqual(logic.planUpdates([item('si_ai', 3)], [sub], snapshot), []);
  assert.equal(logic.planUpdates([item('si_ai', 3)], [sub], { ...snapshot, quantity: 0 })[0].quantity, 0);
});

test('retries reuse the same idempotency key; later seat transitions use fresh keys', () => {
  const first = logic.planUpdates([item('si_ai', 1)], [sub], snapshot)[0];
  assert.equal(logic.planUpdates([item('si_ai', 1)], [sub], snapshot)[0].idempotencyKey, first.idempotencyKey);
  assert.notEqual(logic.planUpdates([item('si_ai', 1)], [sub], { ...snapshot, requestId: 'request-2' })[0].idempotencyKey, first.idempotencyKey);
});

test('partial or wrong Stripe responses cannot be acknowledged as synchronized', () => {
  const updates = logic.planUpdates([item('si_ai', 1)], [sub], snapshot);
  assert.throws(() => logic.confirmUpdates([], updates, snapshot));
  assert.throws(() => logic.confirmUpdates([item('si_ai', 1)], updates, snapshot));
  assert.equal(logic.confirmUpdates([item('si_ai', 3)], updates, snapshot).updated, 1);
});

test('generated workflow uses bounded execution, separate server authentication and explicit split fields', () => {
  const workflow = JSON.parse(fs.readFileSync(path.join(__dirname, 'workflow.json')));
  assert.equal(workflow.active, false);
  assert.equal(workflow.settings.executionTimeout, 60);
  const webhook = workflow.nodes.find(n => n.type.endsWith('.webhook'));
  assert.equal(webhook.parameters.authentication, 'headerAuth');
  assert.equal(webhook.credentials.httpHeaderAuth.name, 'Lowcoder Seat Sync (server only)');
  for (const split of workflow.nodes.filter(n => n.type.endsWith('.splitOut'))) {
    assert.equal(split.parameters.options.destinationFieldName, split.parameters.fieldToSplitOut);
  }
  for (const code of workflow.nodes.filter(n => n.type.endsWith('.code'))) {
    assert.doesNotThrow(() => new Function('$input', '$', code.parameters.jsCode));
  }
  const update = workflow.nodes.find(n => n.name === 'Update Stripe quantity');
  assert.deepEqual(update.parameters.bodyParameters.parameters.map(p => p.name), ['quantity', 'proration_behavior']);
  assert.equal(update.retryOnFail, true);
  // No create/invoice/payment endpoints: this flow only adjusts existing subscription items.
  assert.equal(workflow.nodes.filter(n => n.type.endsWith('.httpRequest') && n.parameters.method === 'POST').length, 1);
});
