"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  useGetDashboardQuery,
  useGetMessagesQuery,
  useGetTransactionsQuery,
} from "../../store/api/userDashboardApi";
import MessagesFilters from "./MessagesFilters";
import TransactionsFilters from "./TransactionsFilter";
import SortDropdown from "./SortDropdown";

export default function UserDashboard() {
  const [searchParams] = useSearchParams();
  const locationId = searchParams.get("locationId");

  // Pagination state
  const [messagesPage, setMessagesPage] = useState(1);
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [tabValue, setTabValue] = useState("overview");

  // Messages filters and sorting
  const [messagesFilters, setMessagesFilters] = useState({
    status: "",
    direction: "",
    to_number: "",
    from_number: "",
    sent_at__gte: "",
    sent_at__lte: "",
  });
  const [messagesOrdering, setMessagesOrdering] = useState("-created_at");

  // Transactions filters and sorting
  const [transactionsFilters, setTransactionsFilters] = useState({
    transaction_type: "",
    created_at__gte: "",
    created_at__lte: "",
    min_amount: "",
    max_amount: "",
  });
  const [transactionsOrdering, setTransactionsOrdering] =
    useState("-created_at");

  // Show/hide filters
  const [showMessagesFilters, setShowMessagesFilters] = useState(false);
  const [showTransactionsFilters, setShowTransactionsFilters] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // API queries
  const { data: dashboard, isLoading: dashboardLoading } =
    useGetDashboardQuery(locationId);

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

  const transactionsParams = {
    locationId,
    page: transactionsPage,
    ordering: transactionsOrdering,
    ...Object.fromEntries(
      Object.entries(transactionsFilters).filter(([_, v]) => v !== "")
    ),
  };
  const {
    data: transactions,
    isLoading: transactionsLoading,
    isFetching: transactionsFetching,
  } = useGetTransactionsQuery(transactionsParams, {
    refetchOnMountOrArgChange: true,
  });

  // Reset pagination when filters change
  useEffect(() => {
    setMessagesPage(1);
  }, [messagesFilters, messagesOrdering]);

  useEffect(() => {
    setTransactionsPage(1);
  }, [transactionsFilters, transactionsOrdering]);

  const sortOptions = [
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
  ];

  const handleSortChange = (value) => {
    setMessagesOrdering(value);
    setIsOpen(false);
  };

  const handleTransactionSortChange = (value) => {
    setTransactionsOrdering(value);
    setIsOpen(false);
  };

  // Helper functions
  const handleMessagesFilterChange = (field, value) => {
    setMessagesFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleTransactionsFilterChange = (field, value) => {
    setTransactionsFilters((prev) => ({ ...prev, [field]: value }));
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

  const clearTransactionsFilters = () => {
    setTransactionsFilters({
      transaction_type: "",
      created_at__gte: "",
      created_at__lte: "",
      min_amount: "",
      max_amount: "",
    });
  };

  const getActiveFiltersCount = () => {
    return Object.values(messagesFilters).filter(
      (value) => value && value.trim() !== ""
    ).length;
  };

  if (!locationId) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold text-red-600">Missing Location ID</h2>
        <p className="text-gray-600 mt-2">
          Please provide a <code>locationId</code> in the URL parameters.
        </p>
      </div>
    );
  }

  if (dashboardLoading) {
    return (
      <div className="p-6 text-center">
        <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-3 text-gray-700">Loading dashboard...</p>
      </div>
    );
  }

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

  const formatDateForInput = (date) => {
    if (!date) return "";
    return date.split("T")[0];
  };

  return (
    <>
      {/* Header */}
      <div className="sticky w-full top-0 bg-white border-b border-gray-200 z-10 shadow-sm">
        {/* Main Navbar */}
        <div className="px-4 md:px-8 lg:px-20 py-3 md:py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            {/* Left Section - Company Name & Dashboard */}
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                Reloop <span className="text-green-600">SMS</span>
              </h1>
              <span className="hidden md:inline-block w-px h-6 bg-gray-300"></span>
              <span className="text-sm md:text-base text-gray-600 font-medium">Dashboard</span>
            </div>

            {/* Right Section - Location & Email */}
            <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs md:text-sm text-gray-600">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400">📍</span>
                <span>{dashboard?.account.location_name}</span>
              </div>
              <span className="hidden sm:inline-block w-px h-4 bg-gray-300"></span>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400">✉️</span>
                <span>{dashboard?.account.business_email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Account & Integration Info Bar */}
        <div className="bg-gray-50 border-t border-gray-200 px-4 md:px-8 lg:px-20 py-2">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 text-xs">
            {/* Account Info */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-gray-600">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-gray-500 whitespace-nowrap">Account ID:</span>
                <span className="font-mono text-gray-700 break-all">{dashboard?.account.id}</span>
              </div>
              <span className="hidden sm:inline-block w-px h-3 bg-gray-300"></span>
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-gray-500 whitespace-nowrap">Location ID:</span>
                <span className="font-mono text-gray-700 break-all">{dashboard?.account.location_id}</span>
              </div>
            </div>

            {/* Integration Info */}
            <div className="flex flex-wrap items-center gap-3 text-gray-600">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-gray-500">Transmit:</span>
                <span>{dashboard?.mapping?.transmit_account_name}</span>
              </div>
              {dashboard?.mapping?.mapped_at && (
                <>
                  <span className="hidden sm:inline-block w-px h-3 bg-gray-300"></span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    <span>Connected {formatDistanceToNow(new Date(dashboard.mapping?.mapped_at), { addSuffix: true })}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-2 py-6 sm:p-6 sm:px-11 md:px-16 lg:px-32 w-full mx-auto space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-white">
          <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-2xl shadow-[0_0_15px_rgba(0,0,0,0.3)] p-4">
            <div className="flex items-center justify-between">
              <div className="px-4 py-1 flex flex-col gap-3 md:gap-4">
                <p className="text-sm md:text-lg tracking-wide font-semibold">Wallet Balance</p>
                <p className="text-2xl md:text-3xl font-bold opacity-95">
                  ${dashboard?.wallet.balance}
                </p>
              </div>
              {/* <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-xl">💳</span>
              </div> */}
            </div>
          </div>

          <div className="bg-gradient-to-r from-cyan-600 to-cyan-500 rounded-2xl shadow-[0_0_15px_rgba(0,0,0,0.3)] p-4">
            <div className="flex items-center justify-between">
              <div className="sm:px-4 py-1 flex flex-col gap-3 md:gap-4">
                <p className="text-sm md:text-lg tracking-wide font-semibold">Messages Sent</p>
                <p className="text-2xl md:text-3xl font-bold opacity-95">
                  {dashboard?.messages_summary.total_sent}
                </p>
              </div>
              {/* <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-xl">📤</span>
              </div> */}
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-600 to-yellow-500 rounded-2xl shadow-[0_0_15px_rgba(0,0,0,0.3)] p-4">
            <div className="flex items-center justify-between">
              <div className="sm:px-4 py-1 flex flex-col gap-3 md:gap-4">
                <p className="text-sm md:text-lg tracking-wide font-semibold">Messages Delivered</p>
                <p className="text-2xl md:text-3xl font-bold opacity-95">
                  {dashboard?.messages_summary.total_delivered}
                </p>
              </div>
              {/* <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-xl">✅</span>
              </div> */}
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-600 to-red-500 rounded-2xl shadow-[0_0_15px_rgba(0,0,0,0.3)] p-4">
            <div className="flex items-center justify-between">
              <div className="sm:px-4 py-1 flex flex-col gap-3 md:gap-4">
                <p className="text-sm md:text-lg tracking-wide font-semibold">Failed Messages</p>
                <p className="text-2xl md:text-3xl font-bold opacity-95">
                  {dashboard?.messages_summary.total_failed}
                </p>
              </div>
              {/* <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-red-600 text-xl">❌</span>
              </div> */}
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm py-2 px-3 sm:px-4 border border-gray-200">
            <h3 className="font-semibold mb-1 sm:mb-3 text-gray-800 text-sm sm:text-md">Message Direction</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-xs text-gray-500">Outbound</div>
                <div className="text-sm font-semibold text-gray-900 sm:text-lg">{dashboard?.messages_summary.outbound_count}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Inbound</div>
                <div className="text-sm font-semibold text-gray-900 sm:text-lg">{dashboard?.messages_summary.inbound_count}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm py-2 px-3 sm:px-4 border border-gray-200">
            <h3 className="font-semibold mb-1 sm:mb-3 text-gray-800 text-sm sm:text-md">Pricing</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-xs text-gray-500">Inbound</div>
                <div className="text-sm sm:text-lg font-semibold text-gray-900">${dashboard?.wallet.inbound_segment_charge}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Outbound</div>
                <div className="text-sm sm:text-lg font-semibold text-gray-900">${dashboard?.wallet.outbound_segment_charge}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm py-2 px-3 sm:px-4 border border-gray-200">
            <h3 className="font-semibold mb-1 sm:mb-3 text-gray-800 text-sm sm:text-md">Spending</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-xs text-gray-500">Spent</div>
                <div className="text-sm sm:text-lg font-semibold text-red-600">${dashboard?.wallet.total_spent}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Credits</div>
                <div className="text-sm sm:text-lg font-semibold text-green-600">${dashboard?.wallet.total_credits}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm py-2 px-3 sm:px-4 border border-gray-200">
            <h3 className="font-semibold mb-1 sm:mb-3 text-gray-800 text-sm sm:text-md">Alerts</h3>
            <div className="flex items-center gap-3 text-xs sm:text-sm">
              <span className={`px-2 py-1 rounded ${dashboard?.alerts.low_balance ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                {dashboard?.alerts.low_balance ? "Low" : "OK"}
              </span>
              <span className="text-gray-500">Pending: <span className="text-gray-900 font-medium">{dashboard?.alerts.pending_messages}</span></span>
              <span className="text-gray-500">Failed: <span className="text-red-600 font-medium">{dashboard?.alerts.failed_messages}</span></span>
            </div>
          </div>
        </div>
        
        {/* Account & Mapping Info */}
        {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <h3 className="font-semibold mb-3">Account Details</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600">Account ID:</span>
                <p className="font-mono text-xs break-all">
                  {dashboard?.account.id}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Location ID:</span>
                <p className="font-mono text-xs break-all">
                  {dashboard?.account.location_id}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600">User ID:</span>
                <p className="font-mono text-xs break-all">
                  {dashboard?.account.user_id}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Company ID:</span>
                <p className="font-mono text-xs break-all">
                  {dashboard?.account.company_id}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <h3 className="font-semibold mb-3">Transmit Integration</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600">Account Name:</span>
                <p className="font-medium">
                  {dashboard?.mapping?.transmit_account_name}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Mapping ID:</span>
                <p className="font-mono text-xs break-all">
                  {dashboard?.mapping?.id}
                </p>
              </div>
              {dashboard?.mapping?.mapped_at && (
                <div>
                  <span className="text-sm text-gray-600">Mapped:</span>
                  <p className="text-sm">
                    {formatDistanceToNow(
                      new Date(dashboard.mapping?.mapped_at),
                      { addSuffix: true }
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div> */}

        {/* Tabs */}
        <div>
          <div className="flex justify-between sm:justify-start sm:gap-10 border-b border-gray-200 mb-6">
            {["overview", "messages", "transactions"].map((tab) => (
              <button
                key={tab}
                onClick={() => setTabValue(tab)}
                className={`md:px-6 py-3 text-xs sm:text-sm md:text-base font-medium capitalize transition-colors ${
                  tabValue === tab
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {tabValue === "overview" && (
            <div className="space-y-6">
              {/* Recent Messages */}
              <div className="bg-white rounded-lg shadow-sm p-2 sm:p-4 border">
                <h3 className="font-semibold text-sm sm:text-lg mb-4">
                  Recent Messages
                </h3>
                <div className="space-y-3">
                  {dashboard?.messages_summary.recent_messages
                    .slice(0, 5)
                    .map((message) => (
                      <div
                        key={message.id}
                        className="p-2 sm:p-3 border border-gray-200 rounded-lg"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="text-sm sm:text-lg font-medium text-gray-900">
                              {message.message_content}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs sm:text-sm text-gray-600">
                                {message.direction === "outbound"
                                  ? "To"
                                  : "From"}
                                :{" "}
                                {message.direction === "outbound"
                                  ? message.to_number
                                  : message.from_number}
                              </span>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-lg sm:text-xl font-medium">
                              ${message.cost}
                            </p>
                            <p className="text-[0.7rem] sm:text-xs text-gray-500">
                              {message.segments} segment
                              {message.segments !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex gap-2">
                            <span
                              className={`text-[0.7rem] sm:text-xs px-2 py-1 rounded-full border ${getStatusColor(
                                message.status
                              )}`}
                            >
                              {message.status}
                            </span>
                            <span
                              className={`text-[0.7rem] sm:text-xs px-2 py-1 rounded-full border ${getDirectionColor(
                                message.direction
                              )}`}
                            >
                              {message.direction}
                            </span>
                          </div>
                          <span className="text-[0.7rem] sm:text-xs text-gray-500">
                            {formatDistanceToNow(new Date(message.created_at), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="bg-white rounded-lg shadow-sm p-4 border">
                <h3 className="font-semibold text-lg mb-4">
                  Recent Transactions
                </h3>
                <div className="space-y-3">
                  {dashboard?.wallet.recent_transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="p-3 border border-gray-200 rounded-lg flex justify-between items-center"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            transaction.transaction_type === "credit"
                              ? "bg-green-100"
                              : "bg-red-100"
                          }`}
                        >
                          <span className="text-sm">
                            {transaction.transaction_type === "credit"
                              ? "↗️"
                              : "↘️"}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {transaction.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(
                                new Date(transaction.created_at),
                                { addSuffix: true }
                              )}
                            </span>
                            {transaction.reference_id && (
                              <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">
                                Ref: {transaction.reference_id.slice(0, 8)}...
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-bold ${
                            transaction.transaction_type === "credit"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {transaction.transaction_type === "credit"
                            ? "+"
                            : "-"}
                          ${transaction.amount}
                        </p>
                        <p className="text-xs text-gray-500">
                          Balance: ${transaction.balance_after}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Messages Tab */}
          {tabValue === "messages" && (
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
                      Showing {messages?.results.length} of {messages?.count}{" "}
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
          )}

          {/* Transactions Tab */}
          {tabValue === "transactions" && (
            <div className="bg-white rounded-lg shadow-sm p-2 sm:p-4 border">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 sm:gap-9">
                  <h3 className="font-semibold text-sm sm:text-xl">Transaction History</h3>
                  <SortDropdown
                    options={[
                      {
                        value: "-created_at",
                        label: "Newest first",
                        description: "Most recent transactions first",
                      },
                      {
                        value: "created_at",
                        label: "Oldest first",
                        description: "Oldest transactions first",
                      },
                      {
                        value: "-amount",
                        label: "Highest amount",
                        description: "Most expensive transactions first",
                      },
                      {
                        value: "amount",
                        label: "Lowest amount",
                        description: "Least expensive transactions first",
                      },
                    ]}
                    selectedValue={transactionsOrdering}
                    onChange={handleTransactionSortChange}
                    label="Sort transactions by"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setShowTransactionsFilters(!showTransactionsFilters)
                    }
                    className="px-2 sm:px-4 py-1.5 sm:py-2.5 text-xs sm:text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    {showTransactionsFilters ? "Hide Filters" : "Show Filters"}
                  </button>
                </div>
              </div>

              {/* Transactions Filters */}
              {showTransactionsFilters && (
                <TransactionsFilters
                  filters={transactionsFilters}
                  onChange={handleTransactionsFilterChange}
                  onClear={clearTransactionsFilters}
                />
              )}

              {transactionsFetching ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="p-4 border border-gray-200 rounded-lg flex justify-between items-center animate-pulse"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-300 rounded w-32"></div>
                          <div className="flex gap-2">
                            <div className="h-3 bg-gray-300 rounded w-20"></div>
                            <div className="h-3 bg-gray-300 rounded w-16"></div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="h-4 bg-gray-300 rounded w-16 mx-auto"></div>
                        <div className="h-3 bg-gray-300 rounded w-20 mx-auto"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions?.results.map((t) => (
                    <div
                      key={t.id}
                      className="p-4 border border-gray-200 rounded-lg flex justify-between items-center"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            t.transaction_type === "credit"
                              ? "bg-green-100"
                              : "bg-red-100"
                          }`}
                        >
                          <span className="text-lg">
                            {t.transaction_type === "credit" ? "↗️" : "↘️"}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{t.description}</p>
                          <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                            <span>
                              {formatDistanceToNow(new Date(t.created_at), {
                                addSuffix: true,
                              })}
                            </span>
                            {t.reference_id && (
                              <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                                Ref: {t.reference_id.slice(0, 8)}...
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-bold text-lg ${
                            t.transaction_type === "credit"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {t.transaction_type === "credit" ? "+" : "-"}$
                          {t.amount}
                        </p>
                        <p className="text-sm text-gray-500">
                          Balance: ${t.balance_after}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Pagination */}
                  <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      Showing {transactions?.results.length} of{" "}
                      {transactions?.count} transactions
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setTransactionsPage((p) => Math.max(1, p - 1))
                        }
                        disabled={!transactions?.previous}
                        className="px-4 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setTransactionsPage((p) => p + 1)}
                        disabled={!transactions?.next}
                        className="px-4 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
