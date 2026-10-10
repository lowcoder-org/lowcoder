// Embedded into n8n Code nodes. Payment and ownership checks fail closed.
const UNIT_AMOUNTS = { month: 45900, year: 499000 };
const API_CALLS_LIMIT = 1000000000;
const idOf = value => typeof value === 'string' ? value : value?.id;
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const safeId = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(value);
const deploymentId = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,36}$/.test(value);
const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

function validateRequest(body, config, now = Date.now(), capabilityHash) {
  assert(typeof capabilityHash === 'string' && /^[a-f0-9]{64}$/.test(capabilityHash), 'Missing private ownership capability');
  assert(body && deploymentId(body.hostId) && safeId(body.orgId) && safeId(body.userId) &&
    Number.isSafeInteger(body.issuedAt) && now - body.issuedAt < 30000 && body.issuedAt <= now + 5000,
    'Invalid or expired authenticated request');
  assert(['checkout', 'sync', 'status', 'download', 'portal'].includes(body.action), 'Unsupported action');
  const result = { action: body.action, hostId: body.hostId, orgId: body.orgId, userId: body.userId, capabilityHash };
  if (body.action === 'download') { assert(uuid(body.licenseId), 'Invalid license ID'); result.licenseId = body.licenseId; }
  if (body.action === 'portal') { assert(uuid(body.requestId), 'Invalid request ID'); result.requestId = body.requestId; }
  if (['checkout', 'portal'].includes(body.action)) {
    assert(typeof body.returnUrl === 'string' && body.returnUrl.length <= 2048, 'Invalid return URL');
    const target = new URL(body.returnUrl);
    assert(target.protocol === 'https:' && !target.username && !target.password && !target.hash &&
      target.pathname === '/setting/subscription' && target.search === '?enterpriseLicense=return', 'Invalid return URL');
    result.returnUrl = body.returnUrl;
  }
  if (body.action === 'checkout') {
    assert(uuid(body.requestId) && Object.hasOwn(UNIT_AMOUNTS, body.billingInterval), 'Invalid purchase');
    assert(Array.isArray(body.deploymentIds) && body.deploymentIds.length >= 1 && body.deploymentIds.length <= 3 &&
      body.deploymentIds.every(deploymentId) && new Set(body.deploymentIds).size === body.deploymentIds.length &&
      body.deploymentIds[0] === body.hostId, 'Invalid deployment IDs');
    const contact = {};
    for (const key of ['companyName', 'address', 'registerNumber', 'contactName', 'contactEmail', 'contactPhone', 'taxId', 'vatId']) {
      const value = body.contactData?.[key];
      assert((['taxId','vatId'].includes(key) && value == null) ||
        (typeof value === 'string' && value.trim().length <= (key === 'address' ? 1000 : 200) &&
          (['taxId','vatId'].includes(key) || value.trim().length > 0)), `Invalid contact ${key}`);
      contact[key] = value?.trim() || '';
    }
    assert(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.contactEmail), 'Invalid contact email');
    Object.assign(result, { requestId: body.requestId, billingInterval: body.billingInterval,
      deploymentIds: body.deploymentIds, contactData: contact, quantity: body.deploymentIds.length,
      priceId: config.prices[body.billingInterval], productId: config.productId,
      unitAmount: UNIT_AMOUNTS[body.billingInterval] });
    assert(/^price_/.test(result.priceId) && /^prod_/.test(result.productId), 'Configure Enterprise Stripe prices');
  }
  return result;
}

function validatePrice(price, order, config) {
  assert(price.id === order.priceId && idOf(price.product) === config.productId && price.active === true &&
    price.currency === 'usd' && price.unit_amount === UNIT_AMOUNTS[order.billingInterval] &&
    price.billing_scheme === 'per_unit' && !price.transform_quantity && price.recurring?.usage_type === 'licensed' &&
    price.recurring?.interval === order.billingInterval && price.recurring?.interval_count === 1 && price.livemode === config.livemode,
    'Enterprise price does not match the advertised contract');
  return order;
}

function checkoutForm(order, customerId, config) {
  assert(/^cus_/.test(customerId), 'Missing Stripe customer');
  const metadata = { lowcoder_license_request: order.requestId, lowcoder_hostId: order.hostId,
    lowcoder_orgId: order.orgId, lowcoder_userId: order.userId };
  const fields = { mode: 'subscription', customer: customerId, client_reference_id: order.requestId,
    success_url: order.returnUrl, cancel_url: order.returnUrl,
    'line_items[0][price]': order.priceId, 'line_items[0][quantity]': order.quantity,
    'subscription_data[billing_mode][type]': 'flexible',
    integration_identifier: config.integrationIdentifier,
    billing_address_collection: 'required', 'customer_update[address]': 'auto', 'tax_id_collection[enabled]': 'true' };
  for (const [key,value] of Object.entries(metadata)) {
    fields[`metadata[${key}]`] = value;
    fields[`subscription_data[metadata][${key}]`] = value;
  }
  return fields;
}

function checkSession(session, order) {
  assert(session.id === order.checkoutId && session.client_reference_id === order.requestId &&
    session.metadata?.lowcoder_license_request === order.requestId && idOf(session.customer) === order.customerId,
    'Checkout identity mismatch');
  const sub = session.subscription;
  if (!sub || typeof sub === 'string') return null;
  for (const [key,value] of Object.entries({ lowcoder_license_request: order.requestId,
    lowcoder_hostId: order.hostId, lowcoder_orgId: order.orgId, lowcoder_userId: order.userId })) {
    assert(sub.metadata?.[key] === value, 'Subscription ownership mismatch');
  }
  assert(idOf(sub.customer) === order.customerId && /^sub_/.test(sub.id), 'Subscription customer mismatch');
  return sub;
}

function paidPeriod(invoice, sub, order, config, now = Date.now()) {
  if (invoice.status !== 'paid') return null;
  assert(invoice.livemode === config.livemode && sub.livemode === config.livemode &&
    idOf(invoice.customer) === order.customerId && idOf(invoice.parent?.subscription_details?.subscription ?? invoice.subscription) === sub.id,
    'Invoice ownership mismatch');
  assert(invoice.currency === 'usd' && invoice.amount_remaining === 0 &&
    invoice.amount_paid >= UNIT_AMOUNTS[order.billingInterval] * order.quantity &&
    !invoice.paid_out_of_band && !invoice.amount_paid_out_of_band,
    'No complete Stripe payment for Enterprise');
  assert(['subscription_create', 'subscription_cycle'].includes(invoice.billing_reason), 'Unsupported prorated or manual invoice');
  assert(invoice.lines?.has_more === false && invoice.lines.data.length === 1, 'Incomplete or unexpected invoice lines');
  assert(sub.items?.has_more === false && sub.items.data.length === 1, 'Unexpected subscription items');
  const item = sub.items.data[0];
  // Prices can be archived after purchase. Other price attributes still must match.
  validatePrice({ ...item.price, active: true }, order, config);
  assert(item.quantity === order.quantity, 'Subscription instance count changed');
  const line = invoice.lines.data[0];
  assert(idOf(line.pricing?.price_details?.price ?? line.price) === order.priceId &&
    idOf(line.pricing?.price_details?.product ?? line.price?.product) === config.productId && line.quantity === order.quantity &&
    line.amount === UNIT_AMOUNTS[order.billingInterval] * order.quantity &&
    !(line.parent?.subscription_item_details?.proration ?? line.proration), 'Invoice does not purchase these instances');
  const start = line.period?.start, end = line.period?.end;
  assert(Number.isSafeInteger(start) && Number.isSafeInteger(end) && end > start, 'Invalid paid period');
  // Expired, future, canceled, or paused subscriptions cannot mint fresh files.
  if (start * 1000 > now || end * 1000 <= now || sub.status !== 'active') return null;
  assert(start === item.current_period_start && end === item.current_period_end, 'Invoice is not the current subscription period');
  return { invoiceId: invoice.id, start, end };
}

function verifyPayments(payments, period, order) {
  assert(payments.has_more === false && Array.isArray(payments.data), 'Incomplete invoice payments');
  const paid = payments.data.filter(p => idOf(p.invoice) === period.invoiceId && p.status === 'paid' && p.currency === 'usd' &&
    p.payment?.type === 'payment_intent' && p.payment.payment_intent?.status === 'succeeded' &&
    idOf(p.payment.payment_intent.customer) === order.customerId &&
    p.payment.payment_intent.currency === 'usd' && p.payment.payment_intent.amount_received >= p.amount_paid)
    .reduce((sum,p) => sum + p.amount_paid, 0);
  assert(paid >= UNIT_AMOUNTS[order.billingInterval] * order.quantity, 'Successful Stripe payment required');
  return period;
}

function verifyCharge(intent, order) {
  const charge = intent.latest_charge;
  assert(intent.status === 'succeeded' && idOf(intent.customer) === order.customerId && intent.currency === 'usd' &&
    intent.amount_received >= UNIT_AMOUNTS[order.billingInterval] * order.quantity &&
    charge && typeof charge === 'object' && charge.paid === true && charge.status === 'succeeded' &&
    charge.amount_refunded === 0 && charge.disputed === false, 'Payment refunded, disputed, or not successful');
}

const stamp = seconds => new Date(seconds * 1000).toISOString().slice(0, 19).replace('T', ' ');
const safeName = value => value.normalize('NFKD').replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 80) || 'Customer';
function licensePlan(order, period, deterministicUuid) {
  return order.deploymentIds.map(deploymentId => {
    const id = deterministicUuid(`${order.requestId}:${period.invoiceId}:${deploymentId}`);
    const notBefore = stamp(period.start), notAfter = stamp(period.end - 1);
    return { id, requestId: order.requestId, invoiceId: period.invoiceId, deploymentId, notBefore, notAfter,
      filename: `${safeName(order.contactData.companyName)}_${deploymentId}_${notBefore.slice(0,10)}_${notAfter.slice(0,10)}.lic`,
      body: { uuid: id, deploymentId, customerName: order.contactData.companyName, customerId: order.customerId,
        // The current generator uses a 12-hour Jackson string pattern. Numeric Date values
        // preserve the exact paid Stripe period, including noon, regardless of JVM timezone.
        notBefore: period.start * 1000, notAfter: (period.end - 1) * 1000, apiCallsLimit: API_CALLS_LIMIT } };
  });
}

function generatedFile(response) {
  assert(response?.success === true && typeof response.license === 'string' && response.license.length >= 16 &&
    response.license.length <= 4 * 1024 * 1024 && /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(response.license),
    'License server did not return a valid file');
  return response.license;
}
module.exports = { UNIT_AMOUNTS, API_CALLS_LIMIT, validateRequest, validatePrice, checkoutForm, checkSession,
  paidPeriod, verifyPayments, verifyCharge, licensePlan, generatedFile };
