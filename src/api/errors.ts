// Stable numeric error codes returned by the API as `code`. Keep in sync with
// api/src/app/views/codes.go. Never reuse a number for a different meaning.
export const ErrorCode = {
  Unknown: 1000,
  Validation: 1001,
  BadRequest: 1002,
  Unauthorized: 1003,
  Forbidden: 1004,
  NotFound: 1005,
  RateLimited: 1006,
  Conflict: 1007,
  InvalidCredentials: 1100,
  OtpInvalid: 1101,
  OtpCooldown: 1102,
  RefreshInvalid: 1103,
  EmailExists: 1104,
  UsernameExists: 1105,
  UserNotFound: 1106,
  OtpSendFailed: 1107,
  TokenGeneration: 1108,
  NotOwner: 1200,
  CoachOnly: 1201,
  SelfAction: 1202,
  NotConnected: 1203,
  PlanLimit: 1204,
  PackageUnavailable: 1205,
  TicketNotYourTurn: 1206,
  TicketClosed: 1207,
  InsufficientFunds: 1300,
  CurrencyMismatch: 1301,
  PriceNotConfigured: 1302,
  InvalidDuration: 1303,
  PayoutExceedsAvailable: 1304,
  PaymentFailed: 1305,
  UnsupportedCurrency: 1306,
  NoProvider: 1307,
  PayoutAccountMissing: 1308,
} as const;

// code → i18n key for the localized message shown to users.
const messageKey: Record<number, string> = {
  1000: 'errUnknown',
  1001: 'errValidation',
  1002: 'errBadRequest',
  1003: 'errUnauthorized',
  1004: 'errForbidden',
  1005: 'errNotFound',
  1006: 'errRateLimited',
  1007: 'errConflict',
  1100: 'errInvalidCredentials',
  1101: 'errOtpInvalid',
  1102: 'errOtpCooldown',
  1103: 'errRefreshInvalid',
  1104: 'errEmailExists',
  1105: 'errUsernameExists',
  1106: 'errUserNotFound',
  1107: 'errOtpSendFailed',
  1108: 'errTokenGeneration',
  1200: 'errNotOwner',
  1201: 'errCoachOnly',
  1202: 'errSelfAction',
  1203: 'errNotConnected',
  1204: 'errPlanLimit',
  1205: 'errPackageUnavailable',
  1206: 'errTicketNotYourTurn',
  1207: 'errTicketClosed',
  1300: 'errInsufficientFunds',
  1301: 'errCurrencyMismatch',
  1302: 'errPriceNotConfigured',
  1303: 'errInvalidDuration',
  1304: 'errPayoutExceedsAvailable',
  1305: 'errPaymentFailed',
  1306: 'errUnsupportedCurrency',
  1307: 'errNoProvider',
  1308: 'errPayoutAccountMissing',
};

export class ApiError extends Error {
  code: number;
  status: number;
  field?: string;
  rule?: string;
  constructor(opts: { code?: number; message?: string; status: number; field?: string; rule?: string }) {
    super(opts.message || 'Request failed');
    this.name = 'ApiError';
    this.code = opts.code ?? ErrorCode.Unknown;
    this.status = opts.status;
    this.field = opts.field;
    this.rule = opts.rule;
  }
}

type Translate = (key: string, values?: Record<string, string | number>) => string;

// Localize any error thrown by the API client. Business codes map to a message
// key; validation errors (1001) are rebuilt from field + rule so they read in
// the user's language; anything unmapped falls back to the server text.
export function errorText(t: Translate, err: unknown): string {
  if (err instanceof ApiError) {
    if (err.code === ErrorCode.Validation && err.rule) {
      const fieldKey = err.field ? `field_${err.field}` : '';
      const label = fieldKey && t(fieldKey) !== fieldKey ? t(fieldKey) : err.field || t('field_generic');
      const ruleText = t(`rule_${err.rule}`, { field: label });
      if (ruleText !== `rule_${err.rule}`) return ruleText;
    }
    const key = messageKey[err.code];
    if (key) {
      const text = t(key);
      if (text !== key) return text;
    }
    return err.message || t('errUnknown');
  }
  if (err instanceof Error) return err.message;
  return t('errUnknown');
}
