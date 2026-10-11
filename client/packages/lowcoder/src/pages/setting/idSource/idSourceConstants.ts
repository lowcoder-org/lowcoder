import { DefaultOptionType } from "antd/es/select";
import { trans } from "i18n";

export enum AuthType {
  Form = "FORM",
  Google = "GOOGLE",
  Github = "GITHUB",
  Ory = "ORY",
  KeyCloak = "KEYCLOAK",
  Generic = "GENERIC",
}

export const IdSource = [
  AuthType.Google,
  AuthType.Github,
  AuthType.Form,
  AuthType.Ory,
  AuthType.KeyCloak,
  AuthType.Generic,
];

export enum AuthCategoriesEnum {
  ENTERPISE_ENTITY = "Enterprise Identity",
  CLOUD_SERVICES = "Cloud Services",
  SOCIAL_MEDIA = "Social Media",
  DEVELOPMENT = "Development",
  TOOLS_AND_PRODUCTIVITY = "Tools & Productivity",
}

type AuthCategoriesEnumKey = keyof typeof AuthCategoriesEnum;
const AuthCategories = Object.keys(AuthCategoriesEnum).map(
  (cat) => {
    const value = AuthCategoriesEnum[cat as AuthCategoriesEnumKey];
    return {
      label: value,
      value: cat
    }
  }
);

const GenericProviderCategories = [{label: "Generic OAuth Provider", value: "GENERIC"}];

export const validatorOptions = [];

export const clientIdandSecretConfig = {
  clientId: "Client ID",
  clientSecret: {
    label: "Client secret",
    isPassword: true,
  },
};

export const authConfig = {
  [AuthType.Form]: {
    sourceName: trans("idSource.form"),
    sourceValue: AuthType.Form,
    form: {},
  },
  [AuthType.Github]: {
    sourceName: "GitHub",
    sourceValue: AuthType.Github,
    form: clientIdandSecretConfig,
  },
  [AuthType.Google]: {
    sourceName: "Google",
    sourceValue: AuthType.Google,
    form: clientIdandSecretConfig,
  },
  [AuthType.Ory]: {
    sourceName: "Ory",
    sourceValue: AuthType.Ory,
    form: {
      ...clientIdandSecretConfig,
      baseUrl: "Base URL",
      scope: "Scope",
    },
  },
  [AuthType.KeyCloak]: {
    sourceName: "KeyCloak",
    sourceValue: AuthType.KeyCloak,
    form: {
      ...clientIdandSecretConfig,
      baseUrl: "Base URL",
      realm: "Realm",
      scope: "Scope",
    },
  },
  [AuthType.Generic]: {
    sourceName: "Generic",
    sourceValue: AuthType.Generic,
    form: {
      source: { label: trans("idSource.source"), isRequire: true, isList: true, options: GenericProviderCategories},
      sourceName: { label: trans("idSource.sourceName"), isRequire: true },
      sourceDescription: { label: trans("idSource.sourceDescription"), isRequire: false },
      sourceIcon: { label: trans("idSource.sourceIcon"), isIcon: true, isRequire: true, },
      sourceCategory: { label: trans("idSource.sourceCategory"), isRequire: true, isList: true, options: AuthCategories },
      ...clientIdandSecretConfig,
      issuerUri: { label: trans("idSource.souceIssuerURI"), isRequire: true },
      authorizationEndpoint: { label: trans("idSource.souceAuthorizationEndpoint"), isRequire: true },
      tokenEndpoint: { label: trans("idSource.souceTokenEndpoint"), isRequire: true },
      userInfoEndpoint: { label: trans("idSource.souceUserInfoEndpoint"), isRequire: true },
      // jwks: { label: 'Authorize URL', isRequire: true },
      scope: "Scope",
      userInfoIntrospection: { label: trans("idSource.userInfoIntrospection"), isSwitch: true, isRequire: false},
      userCanSelectAccounts: { label: trans("idSource.userCanSelectAccounts"), isSwitch: true, isRequire: false},
    },
  },
} as { [key: string]: { sourceName: string; sourceValue: AuthType, form: FormItemType } };

export const FreeTypes = [AuthType.Google, AuthType.Github, AuthType.Form, AuthType.Ory, AuthType.KeyCloak, AuthType.Generic];

export const authTypeDisabled = (type: AuthType, enableEnterpriseLogin?: boolean) => {
  return !FreeTypes.includes(type);
};

export const ManualSyncTypes: Array<AuthType> = [];

export type ListForm = {
  template?: FormItemType;
  ldapsearch?: FormItemType;
}

export type ItemType = {
  label: string;
  options?: DefaultOptionType[];
  isList?: boolean;
  isRequire?: boolean;
  isPassword?: boolean;
  isIcon?: boolean;
  isSwitch?: boolean;
  hasLock?: boolean;
  tip?: string;
}

export type FormItemType = {
  clientId?: string;
  clientSecret?: ItemType;
  loginUri?: string;
  prefixUri?: string;
  source?: ItemType;
  sourceName?: ItemType;
  validator?: ItemType;
  url?: string;
  subType?: ItemType;
  distinguishedNameTemplate?: ItemType;
  searchBase?: ItemType;
  filter?: ItemType;
  bindDn?: ItemType;
  password?: ItemType;
  idAttribute?: ItemType;
  domainPrefix?: string;
  authServerId?: string;
  publicKey?: ItemType;
  domain?: string;
  baseUrl?: string;
  realm?: string;
  scope?: string;
};
