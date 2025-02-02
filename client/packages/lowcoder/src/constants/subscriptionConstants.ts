
export enum SubscriptionProductsEnum {
  // PROD
  SUPPORT = "QYGsTWZYyJYzMg",
  
  // DEV
  // SUPPORT = "QW8L3WPMiNjQjI",
  MEDIAPACKAGE = 'QW8MpIBHxieKXd',
  AZUREAPIS = 'QlQ7cdOh8Lv4dy',
  GOOGLEAPIS = 'enterprise',
  AWSAPIS = 'enterprise-global',
  PRIVATECLOUD = 'private-cloud',
  MATRIXCLOUD = 'matrix-cloud',
  AGORATOKENSERVER = 'agora-tokenserver',
  SIGNALSERVER = 'signal-server',
  DATABASE = 'database',
  STORAGE = 'storage',
  IOSAPP = 'ios-app',
  ANDROIDAPP = 'android-app',
  AUDITLOG = 'audit-log',
  APPLOG = 'app-log',
  ENVIRONMENTS = 'environments',
  GITREPOS = 'git-repos',
}

export const InitSubscriptionProducts = [
  {
    pricingType: "For this Workspace, monthly, per User",
    activeSubscription: false,
    accessLink: "1PhAKrDDlQgecLSfzpt0hQSA",
    product: SubscriptionProductsEnum.SUPPORT,
    subscriptionId: "",
    checkoutLink: "",
    checkoutLinkDataLoaded: false,
    type: "org",
    quantity_entity: "orgUser",
  },
  /* {
    pricingType: "For you in this Workspace, monthly",
    activeSubscription: false,
    accessLink: "1Pf65wDDlQgecLSf6OFlbsD5",
    product: SubscriptionProductsEnum.MEDIAPACKAGE,
    checkoutLink: "",
    checkoutLinkDataLoaded: false,
    subscriptionId: "",
    type: "user",
    quantity_entity: "singleItem",
  },
  {
    pricingType: "For all in this Workspace, monthly",
    activeSubscription: false,
    accessLink: "1PttHIDDlQgecLSf0XP27tXt",
    product: "QlQ7cdOh8Lv4dy",
    subscriptionId: "",
    checkoutLink: "",
    checkoutLinkDataLoaded: false,
    type: "org",
    quantity_entity: "singleItem",
  }, */ 
]

export interface Subscription {
  id: string;
  collection_method: string;
  current_period_end: number;
  current_period_start: number;
  product: string;
  currency: string;
  interval: string;
  tiers_mode: string;
  status: string;
  start_date: number;
  quantity: number;
  billing_scheme: string;
  price: string;
  histId?: string;
  orgId?: string;
  userId?: string;
  customerId?: string;
}

export interface SubscriptionProduct {
  title?: string;
  description?: string;
  image?: string;
  pricingType: string;
  product: string;
  activeSubscription: boolean;
  accessLink: string;
  subscriptionId: string;
  checkoutLink: string;
  checkoutLinkDataLoaded?: boolean;
  type?: string;
  quantity_entity?: string;
}

export interface CustomerAddress {
  line1: string;
  line2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface LowcoderNewCustomer {
  hostname: string;
  hostId: string;
  email: string;
  orgId: string;
  userId: string;
  userName: string;
  type: string;
  companyName: string;
  address?: CustomerAddress;
}

export interface LowcoderSearchCustomer {
  hostId: string;
  orgId: string;
  userId: string;
}

interface LowcoderMetadata {
  lowcoder_host: string;
  lowcoder_hostId: string;
  lowcoder_orgId: string;
  lowcoder_type: string;
  lowcoder_userId: string;
}

export interface StripeCustomer {
  id: string;
  object: string;
  address?: object | null;
  balance: number;
  created: number;
  currency: string | null;
  default_source: string | null;
  delinquent: boolean;
  description: string | null;
  discount: string | null;
  email: string;
  invoice_prefix: string;
  invoice_settings: object | null;
  livemode: boolean;
  metadata: LowcoderMetadata;
  name: string;
  phone: string | null;
  preferred_locales: string[];
  shipping: string | null;
  tax_exempt: string;
  test_clock: string | null;
}

export interface Pricing {
  type: string;
  amount: string;
}

