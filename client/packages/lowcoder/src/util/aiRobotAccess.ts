import { Subscription, SubscriptionProductsEnum } from "constants/subscriptionConstants";

export const AI_ROBOT_ACCESS_REQUIRED = "An active AI Robot subscription is required to use Lowcoder Automator.";

export function hasAiRobotAccess(input: {
  hostId: string;
  orgId: string;
  canEdit: boolean;
  loaded: boolean;
  loading: boolean;
  error?: unknown;
  subscriptions: Subscription[];
}) {
  return Boolean(
    input.hostId && input.orgId && input.canEdit && input.loaded &&
    !input.loading && !input.error && input.subscriptions.some((subscription) =>
      subscription.product === SubscriptionProductsEnum.AIROBOT &&
      subscription.status === "active" &&
      subscription.hostId === input.hostId && subscription.orgId === input.orgId
    )
  );
}
