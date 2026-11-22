import type { APIRequestContext } from "@playwright/test";
import { apiRaw, type RawAnswer } from "../api/client";
import { API_PATHS } from "../constants";
import type { EchoTarget } from "../security/echo";

/**
 * A Generic OAuth provider whose token and user-info endpoints are the test's own target on the echo sidecar (the one place the
 * server may be pointed at), so no provider is contacted. The server calls the endpoints itself; the browser never visits the
 * authorization endpoint (a request to another origin, which the guard blocks), so a test signs in with the call the client
 * makes after the redirect (`POST /api/auth/tp/login`) and a made-up code, which the mock token endpoint accepts.
 */

/** Sub-paths of the test's echo target the provider's endpoints live at. */
export const MOCK_IDP_PATHS = { AUTHORIZE: "/authorize", TOKEN: "/token", USER_INFO: "/userinfo" } as const;
/** The path of the client's redirect page; its origin is the app's. */
export const OAUTH_REDIRECT_PATH = "/user/auth/oauth/redirect";
export const MOCK_CLIENT_ID = "mock-client";
/** A fake secret of the mock provider: the server sends it to the token endpoint, which the test reads back. */
export const MOCK_CLIENT_SECRET = "mock-client-secret";
export const MOCK_ACCESS_TOKEN = "mock-access-token";
export const MOCK_CODE = "mock-code";
export const MOCK_PROVIDER_NAME = "MockIdp";
/** The claim names the configuration maps to the user's id, address and display name. */
const SOURCE_MAPPINGS = { uid: "sub", email: "email", username: "name" } as const;

/** The user the mock provider's user-info endpoint reports. */
export interface MockProviderUser {
  sub: string;
  email: string;
  name: string;
}

/** The identity of a saved configuration, as the sign-in call needs it. */
export interface MockProvider {
  authId: string;
  source: string;
}

/** The body of the Generic configuration with the endpoints on the echo target (shape measured on the 3.0.0 image). */
export function genericProviderConfig(echo: Pick<EchoTarget, "url">, options: { enableRegister: boolean; id?: string }): Record<string, unknown> {
  return {
    ...(options.id ? { id: options.id } : {}),
    authType: "GENERIC",
    sourceName: MOCK_PROVIDER_NAME,
    clientId: MOCK_CLIENT_ID,
    clientSecret: MOCK_CLIENT_SECRET,
    enable: true,
    enableRegister: options.enableRegister,
    issuerUri: echo.url,
    authorizationEndpoint: `${echo.url}${MOCK_IDP_PATHS.AUTHORIZE}`,
    tokenEndpoint: `${echo.url}${MOCK_IDP_PATHS.TOKEN}`,
    userInfoEndpoint: `${echo.url}${MOCK_IDP_PATHS.USER_INFO}`,
    scope: "openid email profile",
    userInfoIntrospection: true,
    sourceMappings: SOURCE_MAPPINGS,
  };
}

/** Makes the token endpoint hand out an access token (what the server then sends as the bearer to the user-info endpoint). */
export async function answerToken(echo: Pick<EchoTarget, "answer">): Promise<void> {
  await echo.answer(MOCK_IDP_PATHS.TOKEN, { status: 200, body: JSON.stringify({ access_token: MOCK_ACCESS_TOKEN, token_type: "Bearer" }) });
}

/** Makes the token endpoint refuse the code, as an OAuth server does (`{ "error": "invalid_grant" }`). */
export async function answerTokenError(echo: Pick<EchoTarget, "answer">): Promise<void> {
  await echo.answer(MOCK_IDP_PATHS.TOKEN, { status: 200, body: JSON.stringify({ error: "invalid_grant" }) });
}

/** Sets the user the user-info endpoint reports. */
export async function answerUser(echo: Pick<EchoTarget, "answer">, user: MockProviderUser): Promise<void> {
  await echo.answer(MOCK_IDP_PATHS.USER_INFO, { status: 200, body: JSON.stringify(user) });
}

/**
 * Saves (or, with `id`, updates) the Generic configuration of the caller's workspace and returns its identity. The caller must
 * be an admin; the echo target must already answer the token endpoint when a sign-in follows.
 */
export async function saveMockProvider(
  admin: APIRequestContext,
  echo: Pick<EchoTarget, "url">,
  options: { enableRegister: boolean; id?: string },
): Promise<MockProvider> {
  const saved = await apiRaw(admin, "POST", API_PATHS.AUTH_CONFIG, { data: genericProviderConfig(echo, options) });
  if (saved.status !== 200) {
    throw new Error(`saving the mock provider answered ${saved.status}`);
  }
  const listed = await apiRaw(admin, "GET", API_PATHS.AUTH_CONFIGS);
  const rows = ((listed.json as { data?: { id: string; authType: string; source: string }[] } | undefined)?.data ?? []).filter((row) => row.authType === "GENERIC");
  const row = options.id ? rows.find((candidate) => candidate.id === options.id) : rows[0];
  if (!row) {
    throw new Error("the saved mock provider is not in the list of configurations");
  }
  return { authId: row.id, source: row.source };
}

/**
 * The call the client makes after the provider redirects back (`POST /api/auth/tp/login`), as the raw answer. The request context
 * keeps the session cookie when it works. `redirectUrl` is the app's redirect page (the origin of the run's `baseURL`).
 */
export async function providerLogin(
  request: APIRequestContext,
  params: { provider: MockProvider; orgId: string; baseURL: string; code?: string },
): Promise<RawAnswer> {
  return apiRaw(request, "POST", API_PATHS.AUTH_TP_LOGIN, {
    params: {
      authId: params.provider.authId,
      source: params.provider.source,
      code: params.code ?? MOCK_CODE,
      redirectUrl: `${params.baseURL}${OAUTH_REDIRECT_PATH}`,
      orgId: params.orgId,
    },
  });
}
