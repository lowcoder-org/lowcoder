// Billing quantities are supplied by the authenticated local API, never by a browser.
// Keep this module dependency-free: build-workflow.cjs embeds it into n8n Code nodes.
const PRODUCTS = new Set(['prod_QYGsTWZYyJYzMg', 'prod_VPq5GQPHJSQnzq']);
const STATUSES = new Set(['active', 'trialing', 'past_due']);

function validateSnapshot(body, expectedHostId, now = Date.now()) {
  if (!expectedHostId || expectedHostId.startsWith('REPLACE_')) throw new Error('Configure the trusted deployment ID');
  const safeId = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(value);
  if (!body || body.hostId !== expectedHostId || !safeId(body.hostId) || !safeId(body.orgId) ||
      !safeId(body.requestId) || !Number.isSafeInteger(body.quantity) || body.quantity < 0 ||
      !Number.isSafeInteger(body.issuedAt) || now - body.issuedAt > 30000 || body.issuedAt - now > 5000) {
    throw new Error('Invalid, foreign, or expired seat snapshot');
  }
  return { hostId: body.hostId, orgId: body.orgId, requestId: body.requestId,
    quantity: body.quantity, issuedAt: body.issuedAt };
}

function collectPages(pages, expectedLists) {
  if (!Array.isArray(pages) || pages.filter(page => page.has_more === false).length !== expectedLists ||
      pages.some(page => !Array.isArray(page.data) || typeof page.has_more !== 'boolean')) {
    throw new Error('Incomplete Stripe pagination; refusing partial reconciliation');
  }
  const unique = new Map();
  for (const page of pages) for (const item of page.data) {
    if (!item.id) throw new Error('Stripe object ID is missing');
    unique.set(item.id, item);
  }
  return [...unique.values()];
}

function customersForSnapshot(customers, snapshot) {
  return customers.filter(customer => !customer.deleted &&
    customer.metadata?.lowcoder_hostId === snapshot.hostId &&
    customer.metadata?.lowcoder_orgId === snapshot.orgId);
}

function subscriptionsForCustomers(subscriptions, customers) {
  const ids = new Set(customers.map(customer => customer.id));
  return subscriptions.filter(subscription => ids.has(subscription.customer) && STATUSES.has(subscription.status));
}

function planUpdates(items, subscriptions, snapshot) {
  const ids = new Set(subscriptions.map(subscription => subscription.id));
  return items.filter(item => ids.has(item.subscription) && PRODUCTS.has(item.price?.product) &&
      item.price?.recurring?.usage_type === 'licensed' && item.quantity !== snapshot.quantity)
    .map(item => ({ itemId: item.id, quantity: snapshot.quantity,
      prorationBehavior: 'create_prorations',
      idempotencyKey: `seat-sync:${snapshot.requestId}:${item.id}:${snapshot.quantity}` }));
}

function confirmUpdates(responses, updates, snapshot) {
  if (responses.length !== updates.length || updates.some(update =>
      !responses.some(response => response.id === update.itemId && response.quantity === update.quantity))) {
    throw new Error('Stripe did not confirm every requested seat update');
  }
  return { success: true, requestId: snapshot.requestId, quantity: snapshot.quantity, updated: updates.length };
}

module.exports = { validateSnapshot, collectPages, customersForSnapshot, subscriptionsForCustomers, planUpdates, confirmUpdates };
