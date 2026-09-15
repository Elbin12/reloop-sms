import React, { useState, useMemo, useCallback, useEffect } from 'react'
import SortDropdown from '../SortDropdown'
import MessagesFilters from '../MessagesFilters'
import { useGetMessagesQuery, useSendQueuedMessagesMutation } from '../../../store/api/userDashboardApi';
import { useRetrySmsMessageMutation, useBulkRetrySmsMessagesMutation } from '../../../store/api/messagesApi';
import { formatDistanceToNow } from 'date-fns';
import {
  CheckSquare, Square, Send, CheckCircle, XCircle, AlertCircle, X,
  MessageSquare, Phone, Calendar, Search, Filter, Info, Download, Loader2, RefreshCw, ListChecks
} from 'lucide-react';
import { axiosInstance } from '../../../store/axios/axios';
import {
  ERROR_CATEGORY_OPTIONS,
  CATEGORY_BADGE_CLASSES,
  sanitizeErrorText,
  isRetryableMessage,
  formatRetryError,
  RETRY_CHECKBOX_CLASS,
} from '../messageFilterConstants';

const RetryCheckbox = ({ checked, onChange, title }) => (
  <input
    type="checkbox"
    checked={checked}
    onChange={onChange}
    title={title}
    aria-label={title}
    className={`${RETRY_CHECKBOX_CLASS} ${checked ? 'ring-2 ring-blue-500 ring-offset-1 bg-blue-50' : 'hover:bg-red-50'}`}
  />
);

const EMPTY_FILTERS = {
  status: "",
  direction: "",
  error_category: "",
  to_number: "",
  from_number: "",
  sent_at__gte: "",
  sent_at__lte: "",
  created_at__gte: "",
  created_at__lte: "",
};

const MessagesTab = ({locationId}) => {
    const [messagesFilters, setMessagesFilters] = useState(EMPTY_FILTERS);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [messagesPage, setMessagesPage] = useState(1);
    const [messagesOrdering, setMessagesOrdering] = useState("-created_at");
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [queuedSelectedIds, setQueuedSelectedIds] = useState(new Set());
    const [retrySelectedIds, setRetrySelectedIds] = useState(new Set());
    const [includePermanent, setIncludePermanent] = useState(false);
    const [sendResult, setSendResult] = useState(null);
    const [retryNotice, setRetryNotice] = useState(null);
    const [isSending, setIsSending] = useState(false);
    const [isBulkRetrying, setIsBulkRetrying] = useState(false);
    const [retryingMessageId, setRetryingMessageId] = useState(null);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [isExporting, setIsExporting] = useState(false);
    const [exportNotice, setExportNotice] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        setMessagesPage(1);
        setQueuedSelectedIds(new Set());
        setRetrySelectedIds(new Set());
    }, [debouncedSearch, messagesFilters, messagesOrdering]);

    const messagesParams = {
        locationId,
        page: messagesPage,
        ordering: messagesOrdering,
        ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
        ...Object.fromEntries(
            Object.entries(messagesFilters).filter(([_, v]) => v !== "")
        ),
    };
    const {
        data: messages,
        isLoading: messagesLoading,
        isFetching: messagesFetching,
        refetch: refetchMessages,
    } = useGetMessagesQuery(messagesParams, { refetchOnMountOrArgChange: true });
    
    const [sendQueuedMessages] = useSendQueuedMessagesMutation();
    const [retrySmsMessage] = useRetrySmsMessageMutation();
    const [bulkRetrySmsMessages] = useBulkRetrySmsMessagesMutation();

    const totalCount = messages?.count || 0;

    const getStatusColor = (status) => {
        switch (status) {
            case "delivered":
                return "bg-green-100 text-green-800 border-green-200";
            case "failed":
                return "bg-red-100 text-red-800 border-red-200";
            case "pending":
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    const getDirectionColor = (direction) => {
        return direction === "outbound"
            ? "bg-blue-50 text-blue-700 border-blue-200"
            : "bg-green-50 text-green-700 border-green-200";
    };
    const handleSortChange = (value) => {
        setMessagesOrdering(value);
    };
    const handleMessagesFilterChange = (field, value) => {
        setMessagesFilters((prev) => ({ ...prev, [field]: value }));
    };

    const clearMessagesFilters = () => {
        setMessagesFilters(EMPTY_FILTERS);
        setSearchTerm('');
    };

    const applyQuickFilter = useCallback((patch) => {
        setMessagesFilters((prev) => ({
            ...prev,
            ...(patch.status != null ? { status: patch.status } : {}),
            ...(patch.error_category != null ? { error_category: patch.error_category } : {}),
            ...(patch.direction != null ? { direction: patch.direction } : {}),
        }));
    }, []);

    const hasActiveFilters =
        searchTerm ||
        Object.values(messagesFilters).some(Boolean) ||
        messagesOrdering !== '-created_at';

    const activeFilterCount = Object.values(messagesFilters).filter(Boolean).length + (searchTerm ? 1 : 0);

    const exportParams = useMemo(() => ({
        location_id: locationId,
        ordering: messagesOrdering,
        ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
        ...Object.fromEntries(
            Object.entries(messagesFilters).filter(([_, v]) => v !== "")
        ),
    }), [locationId, messagesOrdering, debouncedSearch, messagesFilters]);

    const handleExport = useCallback(async () => {
        setExportNotice(null);
        setIsExporting(true);
        try {
            const response = await axiosInstance.get('sms/sms-messages/export/', {
                params: exportParams,
                responseType: 'blob',
            });

            const blobUrl = window.URL.createObjectURL(
                new Blob([response.data], { type: 'text/csv' })
            );
            const link = document.createElement('a');
            link.href = blobUrl;
            link.setAttribute(
                'download',
                `sms_messages_${locationId}_${new Date().toISOString().slice(0, 10)}.csv`
            );
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(blobUrl);
            setExportNotice({ type: 'success', text: 'CSV export downloaded successfully.' });
        } catch {
            setExportNotice({ type: 'error', text: 'Export failed. Please try again.' });
        } finally {
            setIsExporting(false);
        }
    }, [exportParams, locationId]);

    const serverFilterParams = useMemo(() => ({
        location_id: locationId,
        ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
        ...Object.fromEntries(
            Object.entries(messagesFilters).filter(([_, v]) => v !== "")
        ),
    }), [locationId, debouncedSearch, messagesFilters]);

    const queuedMessages = useMemo(() => {
        return messages?.results?.filter((m) => m.status === 'queued') || [];
    }, [messages?.results]);

    const selectableRetryMessages = useMemo(
        () => (messages?.results || []).filter((m) => isRetryableMessage(m)),
        [messages?.results]
    );

    const retryableOnPageCount = selectableRetryMessages.length;
    const failedOnPageCount = useMemo(
        () => (messages?.results || []).filter((m) => m.status === 'failed').length,
        [messages?.results]
    );

    const allQueuedSelected = useMemo(() => {
        return queuedMessages.length > 0 && queuedMessages.every((m) => queuedSelectedIds.has(m.id));
    }, [queuedMessages, queuedSelectedIds]);

    const allRetrySelected = useMemo(() => {
        return retryableOnPageCount > 0 && selectableRetryMessages.every((m) => retrySelectedIds.has(m.id));
    }, [selectableRetryMessages, retrySelectedIds, retryableOnPageCount]);

    const handleSelectAllQueued = useCallback(() => {
        setQueuedSelectedIds((prev) => {
            const next = new Set(prev);
            if (allQueuedSelected) {
                queuedMessages.forEach((m) => next.delete(m.id));
            } else {
                queuedMessages.forEach((m) => next.add(m.id));
            }
            return next;
        });
    }, [allQueuedSelected, queuedMessages]);

    const toggleRetrySelection = useCallback((id) => {
        setRetrySelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const toggleRetryPageSelection = useCallback(() => {
        setRetrySelectedIds((prev) => {
            const pageIds = selectableRetryMessages.map((m) => m.id);
            const allSelected = pageIds.length > 0 && pageIds.every((id) => prev.has(id));
            const next = new Set(prev);
            if (allSelected) pageIds.forEach((id) => next.delete(id));
            else pageIds.forEach((id) => next.add(id));
            return next;
        });
    }, [selectableRetryMessages]);

    const clearRetrySelection = useCallback(() => setRetrySelectedIds(new Set()), []);

    const handleToggleQueued = useCallback((messageId) => {
        setQueuedSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(messageId)) next.delete(messageId);
            else next.add(messageId);
            return next;
        });
    }, []);

    const handleRetryMessage = useCallback(
        async (message, { closeModalOnSuccess } = {}) => {
            if (!isRetryableMessage(message)) return;
            setRetryNotice(null);
            setRetryingMessageId(message.id);
            try {
                await retrySmsMessage({ id: message.id, location_id: locationId }).unwrap();
                setRetryNotice({
                    type: 'success',
                    text: 'Retry submitted. Status will update when the message is processed.',
                });
                if (closeModalOnSuccess) setSelectedMessage(null);
                setTimeout(() => refetchMessages(), 1000);
            } catch (e) {
                setRetryNotice({ type: 'error', text: formatRetryError(e) });
            } finally {
                setRetryingMessageId(null);
            }
        },
        [retrySmsMessage, locationId, refetchMessages]
    );

    const runBulkRetry = useCallback(
        async (payload, confirmText) => {
            if (confirmText && !window.confirm(confirmText)) return;
            setRetryNotice(null);
            setIsBulkRetrying(true);
            try {
                const res = await bulkRetrySmsMessages({
                    ...payload,
                    location_id: locationId,
                }).unwrap();
                setRetryNotice({
                    type: 'success',
                    text: res?.message || 'Bulk retry queued. Statuses will update as messages are processed.',
                });
                clearRetrySelection();
                setTimeout(() => refetchMessages(), 1000);
            } catch (e) {
                setRetryNotice({ type: 'error', text: formatRetryError(e) });
            } finally {
                setIsBulkRetrying(false);
            }
        },
        [bulkRetrySmsMessages, locationId, clearRetrySelection, refetchMessages]
    );

    const handleBulkRetrySelected = useCallback(() => {
        const ids = Array.from(retrySelectedIds);
        if (!ids.length) return;
        runBulkRetry(
            { message_ids: ids, include_permanent: includePermanent },
            `Retry ${ids.length} selected message(s)? This will re-charge your wallet for each send.`
        );
    }, [retrySelectedIds, includePermanent, runBulkRetry]);

    const handleBulkRetryAllMatching = useCallback(() => {
        runBulkRetry(
            { select_all: true, include_permanent: includePermanent, filters: serverFilterParams },
            `Retry ALL messages matching your current filter (up to 5000)?\n\nThis re-charges your wallet per send. ${
                includePermanent ? 'Opt-out/invalid will ALSO be retried.' : 'Opt-out/invalid/auth/config are skipped.'
            }`
        );
    }, [serverFilterParams, includePermanent, runBulkRetry]);

    const handleSendQueued = useCallback(async () => {
        if (queuedSelectedIds.size === 0) return;

        const messageIdsArray = Array.from(queuedSelectedIds);
        setIsSending(true);
        setSendResult(null);
        
        try {
            const result = await sendQueuedMessages({
                message_ids: messageIdsArray,
                location_id: locationId
            }).unwrap();

            setSendResult(result);
            setQueuedSelectedIds(new Set());
            setTimeout(() => refetchMessages(), 1000);
        } catch (error) {
            setSendResult({
                message: 'Failed to send messages',
                error: error?.data?.message || error?.message || 'Unknown error',
                results: {
                    successful: [],
                    failed: messageIdsArray.map(id => ({
                        message_id: id,
                        error: error?.data?.message || error?.message || 'Unknown error'
                    })),
                    skipped: []
                },
                summary: {
                    total: messageIdsArray.length,
                    successful: 0,
                    failed: messageIdsArray.length,
                    skipped: 0
                }
            });
        } finally {
            setIsSending(false);
        }
    }, [queuedSelectedIds, sendQueuedMessages, locationId, refetchMessages]);

    const renderRetryButton = (message, { compact = false } = {}) => (
        <button
            type="button"
            onClick={() => handleRetryMessage(message)}
            disabled={retryingMessageId === message.id}
            className={`inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 font-medium text-blue-700 shadow-sm hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${
                compact ? 'gap-1 px-2 py-1 text-xs' : 'gap-1.5 px-2.5 py-1.5 text-xs'
            }`}
            title="Retry delivery"
        >
            {retryingMessageId === message.id ? (
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
            ) : (
                <RefreshCw className="h-3.5 w-3.5 shrink-0" />
            )}
            <span>Retry</span>
        </button>
    );
  return (
    <div className="bg-white rounded-lg shadow-sm p-3 sm:p-5 border min-w-0">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 min-w-0">
                <h3 className="font-semibold text-lg sm:text-xl text-gray-900 shrink-0">
                    SMS Messages
                </h3>
                <SortDropdown
                    options={[
                        { value: "-created_at", label: "Newest first", description: "Most recent messages first" },
                        { value: "created_at", label: "Oldest first", description: "Oldest messages first" },
                        { value: "-cost", label: "Highest cost", description: "Most expensive messages first" },
                        { value: "cost", label: "Lowest cost", description: "Least expensive messages first" },
                        { value: "-segments", label: "Most segments", description: "Messages with most segments first" },
                        { value: "segments", label: "Fewest segments", description: "Messages with fewest segments first" },
                    ]}
                    selectedValue={messagesOrdering}
                    onChange={handleSortChange}
                    label="Sort messages by"
                />
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                    type="button"
                    onClick={handleExport}
                    disabled={isExporting}
                    className="inline-flex items-center gap-2 px-3 py-2 sm:px-4 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50 font-medium"
                    title="Export the current filtered list to CSV"
                >
                    {isExporting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Download className="w-4 h-4" />
                    )}
                    <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
                </button>
                {hasActiveFilters && (
                    <button
                        type="button"
                        onClick={clearMessagesFilters}
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                        Clear filters
                    </button>
                )}
            </div>
        </div>

        {exportNotice && (
            <div
                className={`mb-4 flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
                    exportNotice.type === 'success'
                        ? 'border-green-200 bg-green-50 text-green-900'
                        : 'border-red-200 bg-red-50 text-red-900'
                }`}
                role="status"
            >
                <span>{exportNotice.text}</span>
                <button
                    type="button"
                    onClick={() => setExportNotice(null)}
                    className="shrink-0 rounded p-0.5 hover:bg-black/5"
                    aria-label="Dismiss"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        )}

        {/* Filter help callout */}
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50/80 p-3 sm:p-4">
            <div className="flex gap-2">
                <Info className="h-5 w-5 shrink-0 text-blue-600 mt-0.5" />
                <div className="min-w-0 text-sm text-gray-700">
                    <p className="font-medium text-gray-900">Filter your messages</p>
                    <p className="mt-1">
                        Search by phone or message text. Use <strong>Status</strong> and <strong>Failure reason</strong> to
                        find failed or queued messages. <strong>Tick failed messages</strong> to bulk retry, or use{' '}
                        <strong>Retry</strong> on a single message. Queued messages can be sent once your wallet has credit.
                        Use <strong>Export CSV</strong> to download your filtered list.
                    </p>
                </div>
            </div>
        </div>

        {/* Primary filters — always visible */}
        <div className="mb-4 space-y-3 rounded-lg border border-gray-200 bg-gray-50/50 p-3 sm:p-4">
            <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search phone numbers or message text..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
            </div>

            <MessagesFilters
                variant="primary"
                filters={messagesFilters}
                onChange={handleMessagesFilterChange}
                onClear={clearMessagesFilters}
            />

            <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-gray-500 mr-1">Quick filters:</span>
                <button
                    type="button"
                    onClick={() => applyQuickFilter({ status: 'failed', error_category: '' })}
                    className="rounded-full border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                >
                    Failed
                </button>
                <button
                    type="button"
                    onClick={() => applyQuickFilter({ status: 'queued', error_category: '' })}
                    className="rounded-full border border-amber-200 bg-white px-2.5 py-1 text-xs font-medium text-amber-800 hover:bg-amber-50"
                >
                    Queued
                </button>
                <button
                    type="button"
                    onClick={() => applyQuickFilter({ status: 'failed', error_category: 'rate_limited' })}
                    className="rounded-full border border-yellow-200 bg-white px-2.5 py-1 text-xs font-medium text-yellow-800 hover:bg-yellow-50"
                >
                    Rate limited
                </button>
                <button
                    type="button"
                    onClick={() => applyQuickFilter({ status: 'failed', error_category: 'provider_billing' })}
                    className="rounded-full border border-orange-200 bg-white px-2.5 py-1 text-xs font-medium text-orange-800 hover:bg-orange-50"
                >
                    Provider credit
                </button>
                <button
                    type="button"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="ml-auto inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                    <Filter className="h-3.5 w-3.5" />
                    {showAdvancedFilters ? 'Hide' : 'More'} filters
                    {activeFilterCount > 0 && !showAdvancedFilters && (
                        <span className="ml-1 rounded-full bg-blue-100 px-1.5 text-blue-800">{activeFilterCount}</span>
                    )}
                </button>
            </div>
        </div>

        {showAdvancedFilters && (
            <MessagesFilters
                filters={messagesFilters}
                onChange={handleMessagesFilterChange}
                onClear={clearMessagesFilters}
            />
        )}

        {/* Active filter badges */}
        {hasActiveFilters && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-500">Active:</span>
                {searchTerm && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                        Search: &quot;{searchTerm}&quot;
                    </span>
                )}
                {messagesFilters.status && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800 capitalize">
                        Status: {messagesFilters.status}
                    </span>
                )}
                {messagesFilters.direction && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-800 capitalize">
                        {messagesFilters.direction}
                    </span>
                )}
                {messagesFilters.error_category && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-800">
                        {ERROR_CATEGORY_OPTIONS.find((o) => o.value === messagesFilters.error_category)?.label}
                    </span>
                )}
            </div>
        )}

        {/* Bulk retry callout + actions */}
        <div className="mb-4 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-3 sm:p-4">
            <div className="flex gap-2 mb-3">
                <ListChecks className="h-5 w-5 shrink-0 text-blue-600 mt-0.5" />
                <div className="text-sm text-gray-700">
                    <p className="font-semibold text-gray-900">Bulk retry failed messages</p>
                    <p className="mt-0.5">
                        Failed messages show a <strong>red checkbox</strong>. Select them and retry, or use{' '}
                        <strong>Retry all matching filter</strong>. Each retry re-charges your wallet.
                    </p>
                </div>
            </div>
            <div className="rounded-lg border-2 border-blue-200 bg-blue-50/80 px-3 py-3 sm:px-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap items-center gap-3">
                        {retryableOnPageCount > 0 && (
                            <label className="flex items-center gap-2 text-xs text-gray-700">
                                <RetryCheckbox
                                    checked={allRetrySelected}
                                    onChange={toggleRetryPageSelection}
                                    title="Select all retryable on this page"
                                />
                                <span>Select page ({retryableOnPageCount} retryable)</span>
                            </label>
                        )}
                        <span className="text-sm font-medium text-gray-800">
                            {retrySelectedIds.size > 0
                                ? `${retrySelectedIds.size} selected for retry`
                                : 'No messages selected'}
                        </span>
                    </div>
                    <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700">
                        <input
                            type="checkbox"
                            checked={includePermanent}
                            onChange={(e) => setIncludePermanent(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 accent-blue-600"
                        />
                        Also retry opt-out / invalid
                    </label>
                    <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                        {retrySelectedIds.size > 0 && (
                            <button
                                type="button"
                                onClick={clearRetrySelection}
                                className="text-sm text-gray-600 hover:text-gray-800 underline"
                            >
                                Clear selection
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={handleBulkRetrySelected}
                            disabled={isBulkRetrying || retrySelectedIds.size === 0}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-blue-300 bg-white px-3 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isBulkRetrying ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            Retry selected ({retrySelectedIds.size})
                        </button>
                        <button
                            type="button"
                            onClick={handleBulkRetryAllMatching}
                            disabled={isBulkRetrying || totalCount === 0}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isBulkRetrying ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            Retry all matching filter
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {retryNotice && (
            <div
                className={`mb-4 flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
                    retryNotice.type === 'success'
                        ? 'border-green-200 bg-green-50 text-green-900'
                        : 'border-red-200 bg-red-50 text-red-900'
                }`}
                role="status"
            >
                <span>{retryNotice.text}</span>
                <button type="button" onClick={() => setRetryNotice(null)} className="shrink-0 rounded p-0.5 hover:bg-black/5" aria-label="Dismiss">
                    <X className="h-4 w-4" />
                </button>
            </div>
        )}

            {/* Queued Messages Action Bar */}
            {queuedMessages.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={handleSelectAllQueued}
                                className="flex items-center space-x-2 text-xs sm:text-sm md:text-base text-blue-700 hover:text-blue-900 font-medium"
                            >
                                {allQueuedSelected ? (
                                    <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                                ) : (
                                    <Square className="w-4 h-4 sm:w-5 sm:h-5" />
                                )}
                                <span>{allQueuedSelected ? 'Deselect All' : 'Select All'} Queued ({queuedMessages.length})</span>
                            </button>
                            {queuedSelectedIds.size > 0 && (
                                <span className="text-xs sm:text-sm md:text-base text-blue-600 font-medium">
                                    {queuedSelectedIds.size} message{queuedSelectedIds.size !== 1 ? 's' : ''} selected
                                </span>
                            )}
                        </div>
                        {queuedSelectedIds.size > 0 && (
                            <button
                                onClick={handleSendQueued}
                                disabled={isSending}
                                className="flex items-center space-x-2 px-3 py-1.5 sm:px-4 sm:py-2 md:px-5 md:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm md:text-base font-medium"
                            >
                                <Send className={`w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 ${isSending ? 'animate-pulse' : ''}`} />
                                <span>{isSending ? 'Sending...' : `Send Selected (${queuedSelectedIds.size})`}</span>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Send Result Feedback */}
            {sendResult && (
                <div className={`mb-4 p-4 rounded-lg border ${
                    sendResult.summary?.failed > 0 && sendResult.summary?.successful > 0
                        ? 'bg-yellow-50 border-yellow-200'
                        : sendResult.summary?.failed > 0
                        ? 'bg-red-50 border-red-200'
                        : 'bg-green-50 border-green-200'
                }`}>
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                                {sendResult.summary?.failed > 0 && sendResult.summary?.successful > 0 ? (
                                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                                ) : sendResult.summary?.failed > 0 ? (
                                    <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                                ) : (
                                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                                )}
                                <h4 className="font-semibold text-xs sm:text-sm md:text-base">
                                    {sendResult.message || 'Send Results'}
                                </h4>
                            </div>
                            {sendResult.summary && (
                                <div className="text-xs sm:text-sm md:text-base space-y-1">
                                    <p>
                                        <span className="font-medium">Total:</span> {sendResult.summary.total} |{' '}
                                        <span className="text-green-600 font-medium">Successful:</span> {sendResult.summary.successful} |{' '}
                                        <span className="text-red-600 font-medium">Failed:</span> {sendResult.summary.failed} |{' '}
                                        <span className="text-gray-600 font-medium">Skipped:</span> {sendResult.summary.skipped}
                                    </p>
                                    {sendResult.results?.failed?.length > 0 && (
                                        <div className="mt-2">
                                            <p className="font-medium text-red-700 mb-1">Failed Messages:</p>
                                            <ul className="list-disc list-inside text-xs sm:text-sm text-red-600 space-y-1">
                                                {sendResult.results.failed.slice(0, 3).map((failed, idx) => (
                                                    <li key={idx}>
                                                        {failed.message_id}: {failed.error}
                                                    </li>
                                                ))}
                                                {sendResult.results.failed.length > 3 && (
                                                    <li>...and {sendResult.results.failed.length - 3} more</li>
                                                )}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => setSendResult(null)}
                            className="ml-4 p-1 hover:bg-black/10 rounded transition-colors"
                            aria-label="Close"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {messagesFetching ? (
            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                <div
                    key={i}
                    className="p-4 border border-gray-200 rounded-lg animate-pulse"
                >
                    <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-4">
                        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                        <div className="flex items-center gap-2">
                        <div className="h-3 bg-gray-300 rounded w-16"></div>
                        <div className="h-3 bg-gray-300 rounded w-10"></div>
                        <div className="h-3 bg-gray-300 rounded w-12"></div>
                        </div>
                    </div>
                    <div className="text-right ml-4 space-y-7">
                        <div className="h-4 bg-gray-300 rounded w-12"></div>
                        <div className="h-3 bg-gray-300 rounded w-16"></div>
                    </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-xs text-gray-500 space-x-4">
                    <div className="flex gap-2">
                        <div className="h-3 bg-gray-300 rounded w-20"></div>
                        <div className="h-3 bg-gray-300 rounded w-24"></div>
                        <div className="h-3 bg-gray-300 rounded w-20"></div>
                    </div>
                    </div>
                </div>
                ))}
            </div>
            ) : (
            <div className="space-y-4">
                {messages?.results?.length === 0 && (
                    <div className="py-10 text-center text-gray-500 text-sm">
                        {hasActiveFilters ? 'No messages match your filters.' : 'No messages found.'}
                    </div>
                )}
                {messages?.results.map((m) => {
                    const retryable = isRetryableMessage(m);
                    const isFailed = m.status === 'failed';
                    return (
                    <div
                        key={m.id}
                        className={`p-3 sm:p-4 border rounded-lg min-w-0 ${
                            m.status === 'queued'
                                ? 'border-amber-200 bg-amber-50/40'
                                : retryable && isFailed
                                ? 'border-red-200 bg-red-50/30 border-l-4 border-l-red-400'
                                : 'border-gray-200'
                        }`}
                    >
                        <div className="flex justify-between items-start gap-2 min-w-0">
                        <div className="shrink-0 pt-1">
                            {m.status === 'queued' ? (
                                <button
                                    onClick={() => handleToggleQueued(m.id)}
                                    className="flex items-center justify-center"
                                    aria-label={queuedSelectedIds.has(m.id) ? 'Deselect message' : 'Select message'}
                                >
                                    {queuedSelectedIds.has(m.id) ? (
                                        <CheckSquare className="w-5 h-5 text-blue-600" />
                                    ) : (
                                        <Square className="w-5 h-5 text-amber-600 hover:text-blue-600" />
                                    )}
                                </button>
                            ) : retryable ? (
                                <RetryCheckbox
                                    checked={retrySelectedIds.has(m.id)}
                                    onChange={() => toggleRetrySelection(m.id)}
                                    title="Select for bulk retry"
                                />
                            ) : (
                                <span className="inline-block w-5" aria-hidden />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p 
                                className="font-medium text-gray-900 mb-2 text-sm sm:text-base cursor-pointer hover:text-blue-600 transition-colors leading-relaxed break-words"
                                onClick={() => setSelectedMessage(m)}
                                title="Click to view full message"
                            >
                                {m.message_content.length > 120 
                                    ? (
                                        <>
                                            {m.message_content.substring(0, 120)}
                                            <span className="text-blue-600 font-normal text-xs sm:text-sm">... (view full)</span>
                                        </>
                                    )
                                    : m.message_content}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="text-xs sm:text-sm text-gray-600">
                                {m.direction === "outbound" ? "To" : "From"}:{" "}
                                {m.direction === "outbound"
                                ? m.to_number
                                : m.from_number}
                            </span>
                            </div>
                            {m.status === 'failed' && (m.error_category_label || m.error_message) && (
                                <div className="mb-2 space-y-1">
                                    {m.error_category_label && (
                                        <span
                                            className={`inline-block px-2 py-0.5 rounded-full border text-xs font-medium ${
                                                CATEGORY_BADGE_CLASSES[m.error_category] || CATEGORY_BADGE_CLASSES.unknown
                                            }`}
                                        >
                                            {m.error_category_label}
                                        </span>
                                    )}
                                    {m.error_message && (
                                        <p className="text-xs text-red-600 line-clamp-2">
                                            {sanitizeErrorText(m.error_message, { placeholderForPolluted: true })}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="text-right ml-2 shrink-0 flex flex-col items-end gap-2">
                            {retryable && renderRetryButton(m, { compact: true })}
                            <div>
                            <p className="font-medium text-sm sm:text-base text-gray-900">
                            ${m.cost}
                            </p>
                            <p className="text-xs text-gray-500">
                            {m.segments} segment{m.segments !== 1 ? "s" : ""}
                            </p>
                            </div>
                        </div>
                        </div>

                        <div className="flex flex-wrap justify-between items-center gap-3 pt-2 mt-2 text-xs sm:text-sm text-gray-500">
                        <div className="flex flex-wrap gap-2">
                            <span
                            className={`px-2 py-0.5 sm:py-1 rounded-full border capitalize text-xs sm:text-sm ${
                                m.status === 'queued' 
                                    ? 'bg-amber-100 text-amber-800 border-amber-200' 
                                    : getStatusColor(m.status)
                            }`}
                            >
                            {m.status}
                            </span>
                            <span
                            className={`px-2 py-0.5 sm:py-1 rounded-full border capitalize text-xs sm:text-sm ${getDirectionColor(
                                m.direction
                            )}`}
                            >
                            {m.direction}
                            </span>
                        </div>

                        {/* Dates */}
                        <div className="flex flex-wrap gap-3">
                            <span>
                            Created:{" "}
                            {formatDistanceToNow(new Date(m.created_at), {
                                addSuffix: true,
                            })}
                            </span>
                            {m.sent_at && (
                            <span>
                                Sent:{" "}
                                {formatDistanceToNow(new Date(m.sent_at), {
                                addSuffix: true,
                                })}
                            </span>
                            )}
                            {m.delivered_at && (
                            <span>
                                Delivered:{" "}
                                {formatDistanceToNow(new Date(m.delivered_at), {
                                addSuffix: true,
                                })}
                            </span>
                            )}
                        </div>
                        </div>
                    </div>
                    );
                })}

                    {/* Pagination */}
                    <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                    <p className="text-xs sm:text-sm md:text-base text-gray-600">
                        Showing {(messagesPage - 1) * 20 + 1}–{(messagesPage - 1) * 20 + messages?.results.length} of {messages?.count}{" "}
                        messages
                    </p>
                    <div className="flex gap-2">
                        <button
                        onClick={() =>
                            setMessagesPage((p) => Math.max(1, p - 1))
                        }
                        disabled={!messages?.previous}
                        className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm md:text-base border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50 transition-colors"
                        >
                        Previous
                        </button>
                        <button
                        onClick={() => setMessagesPage((p) => p + 1)}
                        disabled={!messages?.next}
                        className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm md:text-base border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50 transition-colors"
                        >
                        Next
                        </button>
                    </div>
                </div>
            </div>
        )}

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
                    <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                        <div className="flex items-center space-x-3">
                            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600" />
                            <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-gray-900">Message Details</h2>
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
                    <div className="px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto flex-1">
                        <div className="space-y-4 sm:space-y-6">
                            {/* Status and Direction */}
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center space-x-2">
                                    <span
                                        className={`px-2 py-1 rounded-full border capitalize text-xs sm:text-sm md:text-base ${
                                            selectedMessage.status === 'queued' 
                                                ? 'bg-amber-100 text-amber-800 border-amber-200' 
                                                : getStatusColor(selectedMessage.status)
                                        }`}
                                    >
                                        {selectedMessage.status}
                                    </span>
                                    <span
                                        className={`px-2 py-1 rounded-full border capitalize text-xs sm:text-sm md:text-base ${getDirectionColor(selectedMessage.direction)}`}
                                    >
                                        {selectedMessage.direction}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-base sm:text-lg md:text-xl text-gray-900">
                                        ${selectedMessage.cost}
                                    </p>
                                    <p className="text-xs sm:text-sm md:text-base text-gray-500">
                                        {selectedMessage.segments} segment{selectedMessage.segments !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>

                            {/* Phone Numbers */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                                        <div className="flex items-center space-x-2 text-xs sm:text-sm md:text-base text-gray-600 mb-1">
                                            <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                                            <span>{selectedMessage.direction === "outbound" ? "To" : "From"}</span>
                                        </div>
                                        <p className="text-sm sm:text-base md:text-lg font-medium text-gray-900">
                                        {selectedMessage.direction === "outbound"
                                            ? selectedMessage.to_number
                                            : selectedMessage.from_number}
                                    </p>
                                </div>
                                {selectedMessage.direction === "outbound" && selectedMessage.from_number && (
                                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                                        <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600 mb-1">
                                            <Phone className="w-4 h-4" />
                                            <span>From</span>
                                        </div>
                                        <p className="text-sm sm:text-base font-medium text-gray-900">
                                            {selectedMessage.from_number}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Message Content */}
                                <div>
                                    <div className="flex items-center space-x-2 text-xs sm:text-sm md:text-base text-gray-600 mb-2">
                                        <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                                        <span>Message Content</span>
                                    </div>
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                                        <p className="text-sm sm:text-base md:text-lg text-gray-900 whitespace-pre-wrap break-words leading-relaxed">
                                        {selectedMessage.message_content}
                                    </p>
                                </div>
                            </div>

                            {/* Failure reason */}
                            {selectedMessage.status === 'failed' && (selectedMessage.error_category_label || selectedMessage.error_message) && (
                                <div>
                                    <div className="flex items-center space-x-2 text-xs sm:text-sm text-red-600 mb-2">
                                        <XCircle className="w-4 h-4" />
                                        <span>Failure reason</span>
                                    </div>
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 space-y-2">
                                        {selectedMessage.error_category_label && (
                                            <span
                                                className={`inline-block px-2 py-0.5 rounded-full border text-xs font-medium ${
                                                    CATEGORY_BADGE_CLASSES[selectedMessage.error_category] || CATEGORY_BADGE_CLASSES.unknown
                                                }`}
                                            >
                                                {selectedMessage.error_category_label}
                                            </span>
                                        )}
                                        {selectedMessage.error_message && (
                                            <p className="text-sm text-red-800 break-words">
                                                {sanitizeErrorText(selectedMessage.error_message, { placeholderForPolluted: true })}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Timestamps */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <div className="flex items-center space-x-2 text-xs sm:text-sm md:text-base text-gray-600 mb-2">
                                            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                                            <span>Created</span>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                                            <p className="text-xs sm:text-sm md:text-base text-gray-900">
                                                {formatDistanceToNow(new Date(selectedMessage.created_at), {
                                                    addSuffix: true,
                                                })}
                                            </p>
                                            <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                            {new Date(selectedMessage.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                {selectedMessage.sent_at && (
                                    <div>
                                        <div className="flex items-center space-x-2 text-xs sm:text-sm md:text-base text-gray-600 mb-2">
                                            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                                            <span>Sent</span>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                                            <p className="text-xs sm:text-sm md:text-base text-gray-900">
                                                {formatDistanceToNow(new Date(selectedMessage.sent_at), {
                                                    addSuffix: true,
                                                })}
                                            </p>
                                            <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                                {new Date(selectedMessage.sent_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {selectedMessage.delivered_at && (
                                    <div>
                                        <div className="flex items-center space-x-2 text-xs sm:text-sm md:text-base text-gray-600 mb-2">
                                            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                                            <span>Delivered</span>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                                            <p className="text-xs sm:text-sm md:text-base text-gray-900">
                                                {formatDistanceToNow(new Date(selectedMessage.delivered_at), {
                                                    addSuffix: true,
                                                })}
                                            </p>
                                            <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                                {new Date(selectedMessage.delivered_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-wrap justify-end gap-2">
                        {isRetryableMessage(selectedMessage) && (
                            <button
                                type="button"
                                onClick={() => handleRetryMessage(selectedMessage, { closeModalOnSuccess: true })}
                                disabled={retryingMessageId === selectedMessage.id}
                                className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-xs sm:text-sm disabled:opacity-50"
                            >
                                {retryingMessageId === selectedMessage.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="h-4 w-4" />
                                )}
                                Retry message
                            </button>
                        )}
                        <button
                            onClick={() => setSelectedMessage(null)}
                            className="px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 border border-gray-300 bg-white text-gray-800 rounded-lg hover:bg-gray-50 transition-colors font-medium text-xs sm:text-sm md:text-base"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  )
}

export default MessagesTab
