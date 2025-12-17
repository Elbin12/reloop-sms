import React, { useState, useMemo, useCallback } from 'react'
import SortDropdown from '../SortDropdown'
import MessagesFilters from '../MessagesFilters'
import { useGetMessagesQuery, useSendQueuedMessagesMutation } from '../../../store/api/userDashboardApi';
import { formatDistanceToNow } from 'date-fns';
import { CheckSquare, Square, Send, CheckCircle, XCircle, AlertCircle, X, MessageSquare, Phone, Calendar } from 'lucide-react';

const MessagesTab = ({locationId}) => {
    const [messagesFilters, setMessagesFilters] = useState({
        status: "",
        direction: "",
        to_number: "",
        from_number: "",
        sent_at__gte: "",
        sent_at__lte: "",
    });
    const [messagesPage, setMessagesPage] = useState(1);
    const [messagesOrdering, setMessagesOrdering] = useState("-created_at");
    const [showMessagesFilters, setShowMessagesFilters] = useState(false);
    const [selectedMessageIds, setSelectedMessageIds] = useState(new Set());
    const [sendResult, setSendResult] = useState(null);
    const [isSending, setIsSending] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState(null);

    const messagesParams = {
            locationId,
            page: messagesPage,
            ordering: messagesOrdering,
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
        setMessagesFilters({
        status: "",
        direction: "",
        to_number: "",
        from_number: "",
        sent_at__gte: "",
        sent_at__lte: "",
        });
    };

    // Get queued messages from current page
    const queuedMessages = useMemo(() => {
        return messages?.results?.filter(m => m.status === 'queued') || [];
    }, [messages?.results]);

    // Check if all queued messages are selected
    const allQueuedSelected = useMemo(() => {
        return queuedMessages.length > 0 && queuedMessages.every(m => selectedMessageIds.has(m.id));
    }, [queuedMessages, selectedMessageIds]);

    // Handle select/deselect all queued messages
    const handleSelectAllQueued = useCallback(() => {
        if (allQueuedSelected) {
            // Deselect all queued
            setSelectedMessageIds(prev => {
                const newSet = new Set(prev);
                queuedMessages.forEach(m => newSet.delete(m.id));
                return newSet;
            });
        } else {
            // Select all queued
            setSelectedMessageIds(prev => {
                const newSet = new Set(prev);
                queuedMessages.forEach(m => newSet.add(m.id));
                return newSet;
            });
        }
    }, [allQueuedSelected, queuedMessages]);

    // Handle individual message selection
    const handleToggleMessage = useCallback((messageId) => {
        setSelectedMessageIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(messageId)) {
                newSet.delete(messageId);
            } else {
                newSet.add(messageId);
            }
            return newSet;
        });
    }, []);

    // Handle send queued messages
    const handleSendQueued = useCallback(async () => {
        if (selectedMessageIds.size === 0) return;

        const messageIdsArray = Array.from(selectedMessageIds);
        setIsSending(true);
        setSendResult(null);
        
        try {
            const result = await sendQueuedMessages({
                message_ids: messageIdsArray,
                location_id: locationId
            }).unwrap();

            setSendResult(result);
            // Clear selections after successful send
            setSelectedMessageIds(new Set());
            // Refetch messages to update status
            setTimeout(() => {
                refetchMessages();
            }, 1000);
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
    }, [selectedMessageIds, sendQueuedMessages, locationId, refetchMessages]);
  return (
    <div className="bg-white rounded-lg shadow-sm p-2 sm:p-4 border">
        <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2 sm:gap-4 md:gap-6 lg:gap-9">
                <h3 className="font-semibold text-base sm:text-lg md:text-xl lg:text-2xl text-gray-900">
                SMS Messages
                </h3>
                <SortDropdown
                options={[
                    {
                    value: "-created_at",
                    label: "Newest first",
                    description: "Most recent messages first",
                    },
                    {
                    value: "created_at",
                    label: "Oldest first",
                    description: "Oldest messages first",
                    },
                    {
                    value: "-cost",
                    label: "Highest cost",
                    description: "Most expensive messages first",
                    },
                    {
                    value: "cost",
                    label: "Lowest cost",
                    description: "Least expensive messages first",
                    },
                    {
                    value: "-segments",
                    label: "Most segments",
                    description: "Messages with most segments first",
                    },
                    {
                    value: "segments",
                    label: "Fewest segments",
                    description: "Messages with fewest segments first",
                    },
                ]}
                selectedValue={messagesOrdering}
                onChange={handleSortChange}
                label="Sort messages by"
                />
            </div>
            <div className="flex gap-2">
                        <button
                onClick={() => setShowMessagesFilters(!showMessagesFilters)}
                className="px-3 py-1.5 sm:px-4 sm:py-2 md:px-5 md:py-2.5 text-xs sm:text-sm md:text-base bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                >
                {showMessagesFilters ? "Hide Filters" : "Show Filters"}
                </button>
            </div>
            </div>

            {/* Messages Filters */}
            {showMessagesFilters && (
            <MessagesFilters
                filters={messagesFilters}
                onChange={handleMessagesFilterChange}
                onClear={clearMessagesFilters}
            />
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
                            {selectedMessageIds.size > 0 && (
                                <span className="text-xs sm:text-sm md:text-base text-blue-600 font-medium">
                                    {selectedMessageIds.size} message{selectedMessageIds.size !== 1 ? 's' : ''} selected
                                </span>
                            )}
                        </div>
                        {selectedMessageIds.size > 0 && (
                            <button
                                onClick={handleSendQueued}
                                disabled={isSending}
                                className="flex items-center space-x-2 px-3 py-1.5 sm:px-4 sm:py-2 md:px-5 md:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm md:text-base font-medium"
                            >
                                <Send className={`w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 ${isSending ? 'animate-pulse' : ''}`} />
                                <span>{isSending ? 'Sending...' : `Send Selected (${selectedMessageIds.size})`}</span>
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
                {messages?.results.map((m) => (
                    <div
                        key={m.id}
                        className={`p-2 sm:p-4 border rounded-lg ${
                            m.status === 'queued' ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200'
                        }`}
                    >
                        <div className="flex justify-between items-start">
                        {m.status === 'queued' && (
                            <div className="mr-3 mt-1">
                                <button
                                    onClick={() => handleToggleMessage(m.id)}
                                    className="flex items-center justify-center"
                                    aria-label={selectedMessageIds.has(m.id) ? 'Deselect message' : 'Select message'}
                                >
                                    {selectedMessageIds.has(m.id) ? (
                                        <CheckSquare className="w-5 h-5 text-blue-600" />
                                    ) : (
                                        <Square className="w-5 h-5 text-gray-400 hover:text-blue-600" />
                                    )}
                                </button>
                            </div>
                        )}
                        {m.status !== 'queued' && <div className="w-5"></div>}
                        <div className="flex-1">
                            <p 
                                className="font-medium text-gray-900 mb-2 text-sm sm:text-base md:text-lg cursor-pointer hover:text-blue-600 transition-colors leading-relaxed"
                                onClick={() => setSelectedMessage(m)}
                                title="Click to view full message"
                            >
                                {m.message_content.length > 120 
                                    ? (
                                        <>
                                            {m.message_content.substring(0, 120)}
                                            <span className="text-blue-600 font-normal text-xs sm:text-sm">... (click to view full message)</span>
                                        </>
                                    )
                                    : m.message_content}
                            </p>
                            <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs sm:text-sm md:text-base text-gray-600">
                                {m.direction === "outbound" ? "To" : "From"}:{" "}
                                {m.direction === "outbound"
                                ? m.to_number
                                : m.from_number}
                            </span>
                            </div>
                        </div>
                        <div className="text-right ml-4">
                            <p className="font-medium text-base sm:text-lg md:text-xl text-gray-900">
                            ${m.cost}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-500">
                            {m.segments} segment{m.segments !== 1 ? "s" : ""}
                            </p>
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
                    ))}

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
                    <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                        <button
                            onClick={() => setSelectedMessage(null)}
                            className="px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-xs sm:text-sm md:text-base"
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
