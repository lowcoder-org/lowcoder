import StoreRegistry from "redux/store/storeRegistry";
import { getAiRobotAccess } from "redux/selectors/subscriptionSelectors";
import { getUser } from "redux/selectors/usersSelectors";
import { AI_ROBOT_ACCESS_REQUIRED } from "./aiRobotAccess";

// Recheck the current workspace at send-time and before applying each response action.
export function assertAiRobotAccess(expectedOrgId?: string): string {
  const state = StoreRegistry.getStore()?.getState();
  const orgId = state && getUser(state).currentOrgId;
  if (!state || !getAiRobotAccess(state) || (expectedOrgId && orgId !== expectedOrgId)) {
    throw new Error(AI_ROBOT_ACCESS_REQUIRED);
  }
  return orgId;
}
