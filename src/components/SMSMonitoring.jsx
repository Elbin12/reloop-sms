import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  RefreshCw,
  Phone,
  MessageSquare,
  Calendar,
  User,
  MessageCircle,
  X,
  Loader2,
  CheckSquare,
  ListChecks
} from 'lucide-react';
import { useGetMessagesApiQuery, useRetrySmsMessageMutation, useBulkRetrySmsMessagesMutation } from '../store/api/messagesApi';
import { useGetHighlevelAccountsQuery } from '../store/api/highlevelAccountApi';
import { axiosInstance } from '../store/axios/axios';

/** Redact JWTs and GHL tokens from error strings before display. */
const sanitizeErrorText = (value, { placeholderForPolluted = false } = {}) => {
  if (!value) return value;
  let text = String(value);

  const isPolluted =
    /can't retry/i.test(text) ||
    /ghl update failed/i.test(text) ||
    /ghl_token/i.test(text) ||
    /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(text);

  if (placeholderForPolluted && isPolluted) {
    return 'GHL status sync failed (details redacted)';
  }

  text = text.replace(/(['"])ghl_token\1\s*:\s*(['"])[^'"]*\2/gi, "$1ghl_token$1: '[redacted]'");
  text = text.replace(/eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[redacted token]');

  if (/Can't retry/i.test(text) && /update_ghl_message_status_task/i.test(text)) {
    return 'GHL status sync failed after retries (details redacted)';
  }
  if (/^GHL update failed/i.test(text.trim())) {
    return 'GHL status sync failed (details redacted)';
  }

  return text;
};

/** Statuses where the backend accepts a delivery retry. */
const RETRYABLE_STATUSES = new Set(['failed', 'pending']);

/** Failure categories that can never succeed on retry (mirrors backend PERMANENT_CATEGORIES). */
const PERMANENT_CATEGORIES = new Set(['opt_out', 'invalid_recipient', 'auth_error', 'config_error']);

/** Filterable failure categories shown in the dropdown. */
const ERROR_CATEGORY_OPTIONS = [
  { value: 'provider_billing', label: 'Provider credit' },
  { value: 'opt_out', label: 'Opt-out' },
  { value: 'invalid_recipient', label: 'Invalid recipient' },
  { value: 'rate_limited', label: 'Rate limited' },
  { value: 'provider_down', label: 'Provider down' },
  { value: 'auth_error', label: 'Auth error' },
  { value: 'config_error', label: 'Config error' },
  { value: 'unknown', label: 'Unknown' },
];

const CATEGORY_BADGE_CLASSES = {
  provider_billing: 'bg-orange-100 text-orange-800',
  opt_out: 'bg-purple-100 text-purple-800',
  invalid_recipient: 'bg-pink-100 text-pink-800',
  rate_limited: 'bg-yellow-100 text-yellow-800',
  provider_down: 'bg-slate-100 text-slate-800',
  auth_error: 'bg-red-100 text-red-800',
  config_error: 'bg-red-100 text-red-800',
  unknown: 'bg-gray-100 text-gray-800',
};

const getCategoryLabel = (message) => {
  if (message?.error_category_label) return message.error_category_label;
  const opt = ERROR_CATEGORY_OPTIONS.find((o) => o.value === message?.error_category);
  return opt?.label || null;
};

const isRetryableMessage = (message) => {
  if (!message?.id || !message?.location_id) return false;
  // Prefer the backend's computed flag (accounts for permanent categories).
  if (typeof message.is_retryable === 'boolean') return message.is_retryable;
  if (!RETRYABLE_STATUSES.has(String(message.status || '').toLowerCase())) return false;
  return !PERMANENT_CATEGORIES.has(message.error_category);
};

const formatRetryError = (err) => {
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

const formatCompactDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    month: '2-digit',
    day: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const RETRY_CHECKBOX_CLASS =
  'h-4 w-4 shrink-0 cursor-pointer rounded border-2 border-red-400 bg-white text-blue-600 shadow-sm accent-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1';

const RetryCheckbox = ({ checked, onChange, title, id }) => (
  <input
    id={id}
    type="checkbox"
    checked={checked}
    onChange={onChange}
    title={title}
    aria-label={title}
    className={`${RETRY_CHECKBOX_CLASS} ${checked ? 'ring-2 ring-blue-500 ring-offset-1 bg-blue-50' : 'hover:bg-red-50'}`}
  />
);

const SMSMonitoring = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [directionFilter, setDirectionFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('-created_at');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, page_size: 10 });
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [retryingMessageId, setRetryingMessageId] = useState(null);
  const [retryNotice, setRetryNotice] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [includePermanent, setIncludePermanent] = useState(false);
  const [isBulkRetrying, setIsBulkRetrying] = useState(false);

  const [retrySmsMessage] = useRetrySmsMessageMutation();
  const [bulkRetrySmsMessages] = useBulkRetrySmsMessagesMutation();

  const { data: accountsData } = useGetHighlevelAccountsQuery({ page_size: 200 });

  // Debounce search term to avoid too many API calls
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to first page when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [debouncedSearchTerm, statusFilter, directionFilter, locationFilter, categoryFilter, sortBy, dateRange]);

  // Build API query parameters
  const queryParams = useMemo(() => {
    const params = {
      page: pagination.page,
      page_size: pagination.page_size,
      ordering: sortBy
    };

    if (statusFilter !== 'all') {
      params.status = statusFilter;
    }

    if (directionFilter !== 'all') {
      params.direction = directionFilter;
    }

    if (locationFilter) {
      params.location_id = locationFilter;
    }

    if (categoryFilter) {
      params.error_category = categoryFilter;
    }

    if (debouncedSearchTerm.trim()) {
      params.search = debouncedSearchTerm.trim();
    }

    if (dateRange.start) {
      params.created_at_gte = dateRange.start;
    }

    if (dateRange.end) {
      params.created_at_lte = dateRange.end;
    }

    return params;
  }, [pagination, statusFilter, directionFilter, locationFilter, categoryFilter, sortBy, debouncedSearchTerm, dateRange]);

  const { data, isLoading, isFetching, refetch } = useGetMessagesApiQuery(queryParams);

  const messages = data?.results || [];
  const totalCount = data?.count || 0;

  // Status counts - these reflect the current filtered results
  const statusCounts = useMemo(() => {
    return {
      all: totalCount,
      delivered: messages.filter(m => m.status === 'delivered').length,
      pending: messages.filter(m => m.status === 'pending' || m.status === 'sent').length,
      failed: messages.filter(m => m.status === 'failed').length
    };
  }, [messages, totalCount]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'sent':
      case 'pending':
      case 'queued':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'delivered':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'sent':
      case 'pending':
      case 'queued':
        return `${baseClasses} bg-amber-100 text-amber-800`;
      case 'failed':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const handleRetryMessage = useCallback(
    async (message, { closeModalOnSuccess } = {}) => {
      if (!isRetryableMessage(message)) return;
      setRetryNotice(null);
      setRetryingMessageId(message.id);
      try {
        await retrySmsMessage({ id: message.id, location_id: message.location_id }).unwrap();
        setRetryNotice({
          type: 'success',
          text: 'Retry was submitted successfully. Status will update when the provider processes the message.',
        });
        if (closeModalOnSuccess) {
          setSelectedMessage(null);
        }
      } catch (e) {
        setRetryNotice({ type: 'error', text: formatRetryError(e) });
      } finally {
        setRetryingMessageId(null);
      }
    },
    [retrySmsMessage]
  );

  // Backend-style filter params (double-underscore dates) shared by export and
  // "select all matching filter" bulk retry, so both act on the same set.
  const serverFilterParams = useMemo(() => {
    const params = {};
    if (statusFilter !== 'all') params.status = statusFilter;
    if (directionFilter !== 'all') params.direction = directionFilter;
    if (locationFilter) params.location_id = locationFilter;
    if (categoryFilter) params.error_category = categoryFilter;
    if (debouncedSearchTerm.trim()) params.search = debouncedSearchTerm.trim();
    if (dateRange.start) params.created_at__gte = dateRange.start;
    if (dateRange.end) params.created_at__lte = dateRange.end;
    return params;
  }, [statusFilter, directionFilter, locationFilter, categoryFilter, debouncedSearchTerm, dateRange]);

  const handleExport = useCallback(async () => {
    setRetryNotice(null);
    setIsExporting(true);
    try {
      const params = { ordering: sortBy, ...serverFilterParams };

      const response = await axiosInstance.get('sms/sms-messages/export/', {
        params,
        responseType: 'blob',
      });

      const blobUrl = window.URL.createObjectURL(
        new Blob([response.data], { type: 'text/csv' })
      );
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute(
        'download',
        `sms_messages_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      setRetryNotice({ type: 'error', text: 'Export failed. Please try again.' });
    } finally {
      setIsExporting(false);
    }
  }, [sortBy, serverFilterParams]);

  // --- Bulk selection helpers ---
  const selectableMessages = useMemo(
    () => messages.filter((m) => isRetryableMessage(m)),
    [messages]
  );

  const toggleRowSelection = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const togglePageSelection = useCallback(() => {
    setSelectedIds((prev) => {
      const pageIds = selectableMessages.map((m) => m.id);
      const allSelected = pageIds.length > 0 && pageIds.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [selectableMessages]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const runBulkRetry = useCallback(
    async (payload, confirmText) => {
      if (confirmText && !window.confirm(confirmText)) return;
      setRetryNotice(null);
      setIsBulkRetrying(true);
      try {
        const res = await bulkRetrySmsMessages(payload).unwrap();
        setRetryNotice({
          type: 'success',
          text: res?.message || 'Bulk retry queued. Statuses will update as the provider processes them.',
        });
        clearSelection();
      } catch (e) {
        setRetryNotice({ type: 'error', text: formatRetryError(e) });
      } finally {
        setIsBulkRetrying(false);
      }
    },
    [bulkRetrySmsMessages, clearSelection]
  );

  const handleBulkRetrySelected = useCallback(() => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    runBulkRetry(
      { message_ids: ids, include_permanent: includePermanent },
      `Retry ${ids.length} selected message(s)? This will re-charge the wallet for each send.`
    );
  }, [selectedIds, includePermanent, runBulkRetry]);

  const handleBulkRetryAllMatching = useCallback(() => {
    runBulkRetry(
      { select_all: true, include_permanent: includePermanent, filters: serverFilterParams },
      `Retry ALL messages matching the current filter (up to 5000)?\n\nThis re-charges the wallet per send. ${
        includePermanent ? 'Opt-out/invalid will ALSO be retried.' : 'Opt-out/invalid/auth/config are skipped.'
      }`
    );
  }, [serverFilterParams, includePermanent, runBulkRetry]);

  const getPageFromUrl = (url) => {
    if (!url) return null;
    const params = new URL(url).searchParams;
    return params.get('page');
  };

  const handlePageChange = (url) => {
    if (url) {
      const nextPage = getPageFromUrl(url);
      console.log(url, nextPage)
      setPagination({ page: nextPage, page_size: pagination.page_size })
    }
  };

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleStatusFilterChange = useCallback((e) => {
    setStatusFilter(e.target.value);
  }, []);

  const handleDirectionFilterChange = useCallback((e) => {
    setDirectionFilter(e.target.value);
  }, []);

  const handleSortChange = useCallback((e) => {
    setSortBy(e.target.value);
  }, []);

  const handleDateRangeChange = useCallback((field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('all');
    setDirectionFilter('all');
    setLocationFilter('');
    setCategoryFilter('');
    setSortBy('-created_at');
    setDateRange({ start: '', end: '' });
  }, []);

  // Drop selections whenever the visible set changes, to avoid acting on stale rows.
  useEffect(() => {
    setSelectedIds(new Set());
  }, [debouncedSearchTerm, statusFilter, directionFilter, locationFilter, categoryFilter, dateRange, pagination.page]);

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || directionFilter !== 'all' ||
                          locationFilter || categoryFilter || dateRange.start || dateRange.end || sortBy !== '-created_at';

  const failedOnPageCount = useMemo(
    () => messages.filter((m) => m.status === 'failed').length,
    [messages]
  );

  const retryableOnPageCount = selectableMessages.length;

  const applyQuickFilter = useCallback((patch) => {
    if (patch.status != null) setStatusFilter(patch.status);
    if (patch.category != null) setCategoryFilter(patch.category);
    if (patch.direction != null) setDirectionFilter(patch.direction);
  }, []);

  const renderRetryButton = (message, { compact = false } = {}) => (
    <button
      type="button"
      onClick={() => handleRetryMessage(message)}
      disabled={retryingMessageId === message.id}
      className={`inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 font-medium text-blue-700 shadow-sm hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 ${
        compact ? 'gap-1 px-2 py-1 text-xs' : 'gap-1.5 px-2.5 py-1.5 text-xs'
      }`}
      title="Retry delivery"
    >
      {retryingMessageId === message.id ? (
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />
      ) : (
        <RefreshCw className="h-3.5 w-3.5 shrink-0" aria-hidden />
      )}
      <span>Retry</span>
    </button>
  );

  return (
    <div className="min-w-0 w-full space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">SMS Monitoring</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Track delivery, filter by failure type, and bulk retry messages</p>
        </div>
        <div className="flex items-center shrink-0">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50 text-sm"
            title="Export the current filtered list to CSV"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* Bulk retry feature callout */}
      <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-5 shadow-sm">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
            <ListChecks className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-gray-900">Bulk retry &amp; filter by error type</h2>
            <p className="mt-1 text-sm text-gray-700 leading-relaxed">
              Use the <strong>All Reasons</strong> filter to group failures (rate limited, opt-out, provider credit, etc.).
              Failed messages show a <strong>highlighted checkbox</strong> — tick rows to retry, or use{' '}
              <strong>Retry all matching filter</strong> to resend every message in your current view (up to 5,000).
              Each retry re-charges the location wallet.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyQuickFilter({ status: 'failed', category: '' })}
                className="rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
              >
                Show failed only
              </button>
              <button
                type="button"
                onClick={() => applyQuickFilter({ status: 'failed', category: 'rate_limited' })}
                className="rounded-full border border-yellow-200 bg-white px-3 py-1 text-xs font-medium text-yellow-800 hover:bg-yellow-50"
              >
                Rate limited
              </button>
              <button
                type="button"
                onClick={() => applyQuickFilter({ status: 'failed', category: 'provider_billing' })}
                className="rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-medium text-orange-800 hover:bg-orange-50"
              >
                Provider credit
              </button>
              <button
                type="button"
                onClick={() => applyQuickFilter({ status: 'queued', category: '' })}
                className="rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-medium text-amber-800 hover:bg-amber-50"
              >
                Queued (low balance)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Status cards */}
      {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Messages</p>
              <p className="text-2xl font-bold text-gray-900">{statusCounts.all}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Delivered</p>
              <p className="text-2xl font-bold text-green-600">{statusCounts.delivered}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending / Sent</p>
              <p className="text-2xl font-bold text-amber-600">{statusCounts.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-amber-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-red-600">{statusCounts.failed}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div> */}

      {/* Enhanced Filters and Search */}
      <div className="min-w-0 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          {/* Primary filters */}
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search messages, phone numbers, or accounts..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex flex-wrap items-center space-x-3">
              <select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="delivered">Delivered</option>
                <option value="sent">Sent</option>
                <option value="queued">Queued</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>

              <select
                value={directionFilter}
                onChange={handleDirectionFilterChange}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Directions</option>
                <option value="inbound">Inbound</option>
                <option value="outbound">Outbound</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                title="Filter by failure reason — use with bulk retry"
              >
                <option value="">All Reasons (failure type)</option>
                {ERROR_CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 max-w-[200px]"
              >
                <option value="">All Accounts</option>
                {(accountsData?.results || []).map((account) => (
                  <option key={account.location_id} value={account.location_id}>
                    {account.location_name || account.location_id}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={handleSortChange}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="-created_at">Latest First</option>
                <option value="created_at">Oldest First</option>
                <option value="-sent_at">Latest Sent</option>
                <option value="sent_at">Oldest Sent</option>
                <option value="status">Status A-Z</option>
                <option value="-status">Status Z-A</option>
                <option value="from_number">From Number A-Z</option>
                <option value="-from_number">From Number Z-A</option>
              </select>

              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span>More Filters</span>
              </button>
            </div>
          </div>

          {/* Advanced filters */}
          {showAdvancedFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Date From
                  </label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => handleDateRangeChange('start', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Date To
                  </label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => handleDateRangeChange('end', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Active filters indicator */}
          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap items-center space-x-2">
                  <span className="text-sm text-gray-600">Active filters:</span>
                  {searchTerm && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      Search: "{searchTerm}"
                    </span>
                  )}
                  {statusFilter !== 'all' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                      Status: {statusFilter}
                    </span>
                  )}
                  {directionFilter !== 'all' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                      Direction: {directionFilter}
                    </span>
                  )}
                  {locationFilter && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800">
                      Account: {(accountsData?.results || []).find(a => a.location_id === locationFilter)?.location_name || locationFilter}
                    </span>
                  )}
                  {categoryFilter && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                      Reason: {ERROR_CATEGORY_OPTIONS.find(o => o.value === categoryFilter)?.label || categoryFilter}
                    </span>
                  )}
                  {dateRange.start && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                      From: {dateRange.start}
                    </span>
                  )}
                  {dateRange.end && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                      To: {dateRange.end}
                    </span>
                  )}
                </div>
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Clear all
                </button>
              </div>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="p-6 text-center text-gray-500">Loading messages...</div>
        ) : (
          <>
            {retryNotice && (
              <div
                className={`mx-6 mt-4 mb-2 flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
                  retryNotice.type === 'success'
                    ? 'border-green-200 bg-green-50 text-green-900'
                    : 'border-red-200 bg-red-50 text-red-900'
                }`}
                role="status"
              >
                <span>{retryNotice.text}</span>
                <button
                  type="button"
                  onClick={() => setRetryNotice(null)}
                  className="shrink-0 rounded p-0.5 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400"
                  aria-label="Dismiss notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Bulk actions bar */}
            <div className="mx-4 sm:mx-6 mt-4 mb-2 rounded-xl border-2 border-blue-200 bg-blue-50/80 px-4 py-4 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-3 min-w-0">
                  <CheckSquare className="h-5 w-5 shrink-0 text-blue-600 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedIds.size > 0
                        ? `${selectedIds.size} message${selectedIds.size === 1 ? '' : 's'} selected for bulk retry`
                        : 'Select failed messages to bulk retry'}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {retryableOnPageCount} retryable on this page
                      {failedOnPageCount > 0 ? ` · ${failedOnPageCount} failed shown` : ''}
                      {totalCount > 0 ? ` · ${totalCount} match current filter` : ''}
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 shrink-0">
                  <input
                    type="checkbox"
                    checked={includePermanent}
                    onChange={(e) => setIncludePermanent(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 accent-blue-600"
                  />
                  <span>Also retry opt-out / invalid numbers</span>
                </label>

                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 lg:shrink-0">
                  {selectedIds.size > 0 && (
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 underline text-left sm:text-center"
                    >
                      Clear selection
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleBulkRetrySelected}
                    disabled={isBulkRetrying || selectedIds.size === 0}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-blue-300 bg-white px-4 py-2 text-sm font-semibold text-blue-800 shadow-sm hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isBulkRetrying ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Retry selected ({selectedIds.size})
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkRetryAllMatching}
                    disabled={isBulkRetrying || totalCount === 0}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Retry every message matching the current filter (up to 5000)"
                  >
                    {isBulkRetrying ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Retry all matching filter
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile / tablet card list */}
            <div className="lg:hidden divide-y divide-gray-200 border-t border-gray-200">
              {messages.map((message) => {
                const retryable = isRetryableMessage(message);
                const isFailed = message.status === 'failed';
                return (
                  <div
                    key={message.id}
                    className={`p-4 ${retryable && isFailed ? 'bg-red-50/60 border-l-4 border-l-red-400' : 'bg-white'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="pt-0.5">
                        {retryable ? (
                          <RetryCheckbox
                            checked={selectedIds.has(message.id)}
                            onChange={() => toggleRowSelection(message.id)}
                            title="Select for bulk retry"
                          />
                        ) : (
                          <span className="inline-block h-4 w-4" aria-hidden />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2 justify-between">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(message.status)}
                            <span className={getStatusBadge(message.status)}>
                              {message.status?.charAt(0).toUpperCase() + message.status?.slice(1)}
                            </span>
                            {message.direction === 'outbound' ? (
                              <span className="text-xs font-medium text-blue-600">Out</span>
                            ) : (
                              <span className="text-xs font-medium text-green-600">In</span>
                            )}
                          </div>
                          {retryable && renderRetryButton(message, { compact: true })}
                        </div>
                        {isFailed && getCategoryLabel(message) && (
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${CATEGORY_BADGE_CLASSES[message.error_category] || CATEGORY_BADGE_CLASSES.unknown}`}
                          >
                            {getCategoryLabel(message)}
                          </span>
                        )}
                        <div className="text-xs text-gray-600">
                          <span className="font-medium text-gray-900">{message.from_number}</span>
                          {' → '}
                          <span>{message.to_number}</span>
                        </div>
                        <p
                          className="text-sm text-gray-900 line-clamp-2 cursor-pointer hover:text-blue-600"
                          onClick={() => setSelectedMessage(message)}
                        >
                          {message.message_content}
                        </p>
                        {isFailed && message.error_message && (
                          <p className="text-xs text-red-600 line-clamp-2">
                            {sanitizeErrorText(message.error_message, { placeholderForPolluted: true })}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                          <span className="truncate max-w-full">{message.location_name || 'N/A'}</span>
                          <span>{formatCompactDateTime(message.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {messages.length === 0 && !isLoading && (
                <div className="px-6 py-8 text-center text-gray-500">
                  {hasActiveFilters ? 'No messages match your filters.' : 'No messages found.'}
                </div>
              )}
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block min-w-0">
              <table className="w-full table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-10 px-2 py-2.5 text-left">
                      <input
                        type="checkbox"
                        className={RETRY_CHECKBOX_CLASS}
                        checked={
                          selectableMessages.length > 0 &&
                          selectableMessages.every((m) => selectedIds.has(m.id))
                        }
                        ref={(el) => {
                          if (el) {
                            const someSelected = selectableMessages.some((m) => selectedIds.has(m.id));
                            const allSelected =
                              selectableMessages.length > 0 &&
                              selectableMessages.every((m) => selectedIds.has(m.id));
                            el.indeterminate = someSelected && !allSelected;
                          }
                        }}
                        onChange={togglePageSelection}
                        disabled={selectableMessages.length === 0}
                        title="Select all retryable rows on this page"
                        aria-label="Select all retryable rows on this page"
                      />
                    </th>
                    <th className="px-2 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[52px]">
                      Dir
                    </th>
                    <th className="px-2 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[11%]">
                      From / To
                    </th>
                    <th className="px-2 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-0">
                      Message
                    </th>
                    <th className="px-2 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[16%]">
                      Status
                    </th>
                    <th className="px-2 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[14%]">
                      Location
                    </th>
                    <th className="px-2 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[88px]">
                      Created
                    </th>
                    <th className="sticky right-0 z-10 bg-gray-50 px-2 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[88px] shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.08)]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {messages.map((message) => {
                    const retryable = isRetryableMessage(message);
                    const isFailed = message.status === 'failed';
                    const rowHighlight = retryable && isFailed;
                    return (
                      <tr
                        key={message.id}
                        className={`group ${rowHighlight ? 'bg-red-50/50 hover:bg-red-50/70 border-l-4 border-l-red-400' : 'hover:bg-gray-50'}`}
                      >
                        <td className="px-2 py-2.5 align-top">
                          {retryable ? (
                            <RetryCheckbox
                              checked={selectedIds.has(message.id)}
                              onChange={() => toggleRowSelection(message.id)}
                              title="Select for bulk retry"
                            />
                          ) : (
                            <span className="text-xs text-gray-300 pl-1">—</span>
                          )}
                        </td>
                        <td className="px-2 py-2.5 align-top">
                          {message.direction === 'outbound' ? (
                            <div className="flex items-center gap-1 text-blue-600" title="Outbound">
                              <div className="w-3 h-3 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                              </div>
                              <span className="text-xs font-medium">Out</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-green-600" title="Inbound">
                              <div className="w-3 h-3 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                <div className="w-1.5 h-1.5 bg-green-600 rounded-full" />
                              </div>
                              <span className="text-xs font-medium">In</span>
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-2.5 align-top min-w-0">
                          <div className="text-xs min-w-0">
                            <div className="flex items-center gap-1 text-gray-900 min-w-0">
                              <Phone className="w-3 h-3 shrink-0" />
                              <span className="truncate block max-w-[120px]" title={message.from_number}>
                                {message.from_number}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-500 mt-0.5 min-w-0">
                              <span className="shrink-0">→</span>
                              <span className="truncate block max-w-[120px]" title={message.to_number}>
                                {message.to_number}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-2.5 align-top min-w-0 max-w-[280px]">
                          <div
                            className="text-xs text-gray-900 line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={() => setSelectedMessage(message)}
                            title={message.message_content || 'Click to view full message'}
                          >
                            {message.message_content}
                          </div>
                        </td>
                        <td className="px-2 py-2.5 align-top min-w-0">
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="shrink-0">{getStatusIcon(message.status)}</span>
                            <span className={`${getStatusBadge(message.status)} truncate max-w-full`}>
                              {message.status?.charAt(0).toUpperCase() + message.status?.slice(1)}
                            </span>
                          </div>
                          {isFailed && getCategoryLabel(message) && (
                            <div className="mt-1">
                              <span
                                className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${CATEGORY_BADGE_CLASSES[message.error_category] || CATEGORY_BADGE_CLASSES.unknown}`}
                              >
                                {getCategoryLabel(message)}
                              </span>
                            </div>
                          )}
                          {isFailed && message.error_message && (
                            <div
                              className="mt-1 text-[11px] leading-snug text-red-600 line-clamp-2"
                              title={sanitizeErrorText(message.error_message, { placeholderForPolluted: true })}
                            >
                              {sanitizeErrorText(message.error_message, { placeholderForPolluted: true })}
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-2.5 align-top min-w-0">
                          <div className="text-xs min-w-0">
                            <div className="font-medium text-gray-900 truncate" title={message.location_name || 'N/A'}>
                              {message.location_name || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-2.5 align-top text-xs text-gray-500 whitespace-nowrap">
                          {formatCompactDateTime(message.created_at)}
                        </td>
                        <td className={`sticky right-0 z-10 px-2 py-2.5 text-right align-top shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.06)] ${rowHighlight ? 'bg-red-50/50 group-hover:bg-red-50/70' : 'bg-white group-hover:bg-gray-50'}`}>
                          {retryable ? (
                            renderRetryButton(message)
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {messages.length === 0 && !isLoading && (
                    <tr>
                      <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                        {hasActiveFilters ? 'No messages match your filters.' : 'No messages found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            <div className="p-4 flex items-center justify-between border-t border-gray-200">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  Showing {messages.length} of {totalCount} messages
                </span>
                {hasActiveFilters && (
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    Filtered results
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-4">
                {/* <select
                  value={pagination.page_size}
                  onChange={(e) => setPagination(prev => ({ ...prev, page_size: parseInt(e.target.value), page: 1 }))}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select> */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(data?.previous)}
                    disabled={!data?.previous}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(data?.next)}
                    disabled={!data?.next}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedMessage(null)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center space-x-3">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Message Details</h2>
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-6 overflow-y-auto flex-1">
              <div className="space-y-6">
                {/* Direction and Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {selectedMessage.direction === 'outbound' ? (
                      <div className="flex items-center space-x-2 text-blue-600">
                        <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        </div>
                        <span className="text-sm font-medium">Outbound</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-green-600">
                        <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                        </div>
                        <span className="text-sm font-medium">Inbound</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(selectedMessage.status)}
                    <span className={getStatusBadge(selectedMessage.status)}>
                      {selectedMessage.status?.charAt(0).toUpperCase() + selectedMessage.status?.slice(1)}
                    </span>
                    {getCategoryLabel(selectedMessage) && (
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${CATEGORY_BADGE_CLASSES[selectedMessage.error_category] || CATEGORY_BADGE_CLASSES.unknown}`}
                      >
                        {getCategoryLabel(selectedMessage)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Phone Numbers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                      <Phone className="w-4 h-4" />
                      <span>From</span>
                    </div>
                    <p className="text-base font-medium text-gray-900">{selectedMessage.from_number}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                      <Phone className="w-4 h-4" />
                      <span>To</span>
                    </div>
                    <p className="text-base font-medium text-gray-900">{selectedMessage.to_number}</p>
                  </div>
                </div>

                {/* Message Content */}
                <div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                    <MessageCircle className="w-4 h-4" />
                    <span>Message Content</span>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-base text-gray-900 whitespace-pre-wrap break-words">
                      {selectedMessage.message_content}
                    </p>
                  </div>
                </div>

                {/* Location Information */}
                {selectedMessage.ghl_account && (
                  <div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                      <User className="w-4 h-4" />
                      <span>Location</span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-base font-medium text-gray-900">
                        {selectedMessage.ghl_account.location_name || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        ID: {selectedMessage.ghl_account.location_id || 'N/A'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Failure reason (only shown for failed messages) */}
                {selectedMessage.status === 'failed' && selectedMessage.error_message && (
                  <div>
                    <div className="flex items-center space-x-2 text-sm text-red-600 mb-2">
                      <XCircle className="w-4 h-4" />
                      <span>Failure Reason</span>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-800 break-words">
                        {sanitizeErrorText(selectedMessage.error_message, { placeholderForPolluted: true })}
                      </p>
                    </div>
                  </div>
                )}

                {/* GHL status-sync diagnostic (separate from the real failure reason) */}
                {selectedMessage.ghl_sync_error && (
                  <div>
                    <div className="flex items-center space-x-2 text-sm text-amber-600 mb-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>GHL Sync Note</span>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-sm text-amber-800 break-words">
                        {sanitizeErrorText(selectedMessage.ghl_sync_error)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                      <Calendar className="w-4 h-4" />
                      <span>Created At</span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-900">
                        {new Date(selectedMessage.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                      <Calendar className="w-4 h-4" />
                      <span>Sent At</span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-900">
                        {new Date(selectedMessage.sent_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Message IDs */}
                <div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                    <MessageSquare className="w-4 h-4" />
                    <span>Message IDs</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    {selectedMessage.ghl_message_id && (
                      <div>
                        <span className="text-xs text-gray-500">HighLevel Message ID:</span>
                        <p className="text-sm font-mono text-gray-900 mt-1 break-all">
                          {selectedMessage.ghl_message_id}
                        </p>
                      </div>
                    )}
                    {selectedMessage.transmit_message_id && (
                      <div>
                        <span className="text-xs text-gray-500">Transmit Message ID:</span>
                        <p className="text-sm font-mono text-gray-900 mt-1 break-all">
                          {selectedMessage.transmit_message_id}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between gap-3">
              {isRetryableMessage(selectedMessage) ? (
                <button
                  type="button"
                  onClick={() => handleRetryMessage(selectedMessage, { closeModalOnSuccess: true })}
                  disabled={retryingMessageId === selectedMessage.id}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {retryingMessageId === selectedMessage.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <RefreshCw className="h-4 w-4" aria-hidden />
                  )}
                  Retry delivery
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={() => setSelectedMessage(null)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SMSMonitoring;