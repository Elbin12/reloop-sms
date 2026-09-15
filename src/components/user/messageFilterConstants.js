/** Shared failure-category options (mirrors admin SMS Monitoring). */
export const ERROR_CATEGORY_OPTIONS = [
  { value: 'provider_billing', label: 'Provider credit' },
  { value: 'opt_out', label: 'Opt-out' },
  { value: 'invalid_recipient', label: 'Invalid recipient' },
  { value: 'rate_limited', label: 'Rate limited' },
  { value: 'provider_down', label: 'Provider down' },
  { value: 'auth_error', label: 'Auth error' },
  { value: 'config_error', label: 'Config error' },
  { value: 'unknown', label: 'Unknown' },
];

export const CATEGORY_BADGE_CLASSES = {
  provider_billing: 'bg-orange-100 text-orange-800 border-orange-200',
  opt_out: 'bg-purple-100 text-purple-800 border-purple-200',
  invalid_recipient: 'bg-pink-100 text-pink-800 border-pink-200',
  rate_limited: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  provider_down: 'bg-slate-100 text-slate-800 border-slate-200',
  auth_error: 'bg-red-100 text-red-800 border-red-200',
  config_error: 'bg-red-100 text-red-800 border-red-200',
  unknown: 'bg-gray-100 text-gray-800 border-gray-200',
};

export const sanitizeErrorText = (value, { placeholderForPolluted = false } = {}) => {
  if (!value) return value;
  let text = String(value);

  const isPolluted =
    /can't retry/i.test(text) ||
    /ghl update failed/i.test(text) ||
    /ghl_token/i.test(text) ||
    /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(text);

  if (placeholderForPolluted && isPolluted) {
    return 'Delivery sync failed (details redacted)';
  }

  text = text.replace(/(['"])ghl_token\1\s*:\s*(['"])[^'"]*\2/gi, "$1ghl_token$1: '[redacted]'");
  text = text.replace(/eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[redacted token]');

  if (/Can't retry/i.test(text) && /update_ghl_message_status_task/i.test(text)) {
    return 'Delivery sync failed after retries (details redacted)';
  }
  if (/^GHL update failed/i.test(text.trim())) {
    return 'Delivery sync failed (details redacted)';
  }

  return text;
};

export const RETRYABLE_STATUSES = new Set(['failed', 'pending']);

export const PERMANENT_CATEGORIES = new Set(['opt_out', 'invalid_recipient', 'auth_error', 'config_error']);

export const isRetryableMessage = (message) => {
  if (!message?.id) return false;
  if (typeof message.is_retryable === 'boolean') return message.is_retryable;
  if (!RETRYABLE_STATUSES.has(String(message.status || '').toLowerCase())) return false;
  return !PERMANENT_CATEGORIES.has(message.error_category);
};

export const formatRetryError = (err) => {
  const d = err?.data;
  if (!d) return 'Could not retry this message. Please try again.';
  if (typeof d === 'string') return d;
  if (Array.isArray(d.detail)) {
    return d.detail
      .map((x) => (typeof x === 'string' ? x : x?.message || JSON.stringify(x)))
      .join(' ');
  }
  if (d.detail != null) return String(d.detail);
  if (d.message != null) return String(d.message);
  if (d.error != null) return String(d.error);
  return 'Could not retry this message. Please try again.';
};

export const RETRY_CHECKBOX_CLASS =
  'h-4 w-4 shrink-0 cursor-pointer rounded border-2 border-red-400 bg-white text-blue-600 shadow-sm accent-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1';
