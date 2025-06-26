import { PHONE_NUMBER_PATTERN } from "./stringUtils";
import { SERVER_HOST } from "constants/apiConstants";
import history from "./history";

export const isSafeRedirectURL = (redirectURL: string) => {
  try {
    return new URL(redirectURL).origin === window.location.origin;
  } catch (e) {
    return false;
  }
};

/**
 * import avatar url
 * @remarks
 * the original avatar url is got from the server
 * the url to a third-party site has the domain, while the url to the local site only has the path.
 *
 * expect to be replaced with cdn links in the future
 */
export function fullAvatarUrl(originUrl?: string) {
  if (!originUrl) {
    return "";
  }
  return new URL(originUrl, SERVER_HOST || window.location.origin).toString();
}

export const isPhone = (value: string) => {
  return PHONE_NUMBER_PATTERN.test(value);
};

export const genInviteLink = (inviteCode?: string) => {
  if (!inviteCode) {
    return "";
  }
  const inviteUrl = history.createHref({pathname: `/invite/${inviteCode}`});
  return `${window.location.origin}${inviteUrl}`;
};

export const hasQueryParam = (name: string) => {
  const searchParams = new URLSearchParams(window.location.search);
  return !!searchParams.get(name);
};
