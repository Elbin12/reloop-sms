import React, { useState } from 'react'
import SortDropdown from '../SortDropdown'
import MessagesFilters from '../MessagesFilters'
import { useGetMessagesQuery } from '../../../store/api/userDashboardApi';
import { formatDistanceToNow } from 'date-fns';

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
    } = useGetMessagesQuery(messagesParams, { refetchOnMountOrArgChange: true });

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
  return (
    <div className="bg-white rounded-lg shadow-sm p-2 sm:p-4 border">
        <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2 sm:gap-9">
                <h3 className="font-semibold text-sm sm:text-xl">
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
                className="px-2 sm:px-4 py-1.5 sm:py-2.5 text-xs sm:text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
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
                        className="p-2 sm:p-4 border border-gray-200 rounded-lg"
                    >
                        <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <p className="font-medium text-gray-900 mb-2 text-sm sm:text-lg">
                            {m.message_content}
                            </p>
                            <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs sm:text-sm text-gray-600">
                                {m.direction === "outbound" ? "To" : "From"}:{" "}
                                {m.direction === "outbound"
                                ? m.to_number
                                : m.from_number}
                            </span>
                            </div>
                        </div>
                        <div className="text-right ml-4">
                            <p className="font-medium text-lg sm:text-xl">
                            ${m.cost}
                            </p>
                            <p className="text-[0.7rem] sm:text-xs text-gray-500">
                            {m.segments} segment{m.segments !== 1 ? "s" : ""}
                            </p>
                        </div>
                        </div>

                        <div className="flex flex-wrap justify-between items-center gap-3 pt-2 mt-2 text-[0.7rem] sm:text-xs text-gray-500">
                        <div className="flex flex-wrap gap-2">
                            <span
                            className={`px-2 py-1 rounded-full border capitalize ${getStatusColor(
                                m.status
                            )}`}
                            >
                            {m.status}
                            </span>
                            <span
                            className={`px-2 py-1 rounded-full border capitalize ${getDirectionColor(
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
                    <p className="text-sm text-gray-600">
                        Showing {(messagesPage - 1) * 20 + 1}–{(messagesPage - 1) * 20 + messages?.results.length} of {messages?.count}{" "}
                        messages
                    </p>
                    <div className="flex gap-2">
                        <button
                        onClick={() =>
                            setMessagesPage((p) => Math.max(1, p - 1))
                        }
                        disabled={!messages?.previous}
                        className="px-4 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
                        >
                        Previous
                        </button>
                        <button
                        onClick={() => setMessagesPage((p) => p + 1)}
                        disabled={!messages?.next}
                        className="px-4 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
                        >
                        Next
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  )
}

export default MessagesTab
