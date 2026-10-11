import { Subscription, SubscriptionProductsEnum } from "constants/subscriptionConstants";
import { hasAiRobotAccess } from "./aiRobotAccess";

const subscription = {
  product: SubscriptionProductsEnum.AIROBOT,
  status: "active",
  hostId: "deployment-a",
  orgId: "workspace-a",
  userId: "purchasing-admin",
} as Subscription;

const scope = {
  hostId: "deployment-a",
  orgId: "workspace-a",
  canEdit: true,
  loaded: true,
  loading: false,
  subscriptions: [subscription],
};

test("a workspace subscription covers its other editors, independently of the purchasing admin and price", () => {
  expect(hasAiRobotAccess(scope)).toBe(true);
});

test.each([
  { orgId: "workspace-b" },
  { hostId: "deployment-b" },
  { canEdit: false },
  { loaded: false },
  { loading: true },
  { error: "lookup failed" },
  { subscriptions: [] },
])("does not grant access for an unverified or different scope: %o", (change) => {
  expect(hasAiRobotAccess({ ...scope, ...change })).toBe(false);
});

test.each([
  { product: SubscriptionProductsEnum.SUPPORT },
  { status: "canceled" },
  { status: "past_due" },
  { status: "incomplete" },
  { hostId: undefined },
  { orgId: undefined },
])("rejects subscriptions without the required entitlement: %o", (change) => {
  expect(hasAiRobotAccess({ ...scope, subscriptions: [{ ...subscription, ...change }] })).toBe(false);
});
