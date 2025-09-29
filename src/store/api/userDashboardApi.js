import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery, BASE_URL } from "../axios/axios";

export const dashboardAPi = createApi({
  reducerPath: "dashboardAPi",
  baseQuery: axiosBaseQuery({ baseUrl: BASE_URL + '/sms/' }),
  endpoints: (builder) => ({
    getDashboard: builder.query({
      query: (locationId) => ({
        url:`ghl-account/dashboard?locationId=${locationId}`,
        method: "GET"
    }),
    }),
    getMessages: builder.query({
      query: (messagesParams) => ({
        url:`ghl-account/messages/`,
        method: "GET",
        params: {...messagesParams}
    }),
    }),
    getTransactions: builder.query({
      query: (messagesParams) => ({
        url:`ghl-account/transactions/`,
        method: "GET",
        params: {...messagesParams}
    }),
    }),
    }),
})

export const { useGetDashboardQuery, useGetMessagesQuery, useGetTransactionsQuery } = dashboardAPi;
