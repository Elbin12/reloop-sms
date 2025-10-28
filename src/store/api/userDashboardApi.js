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
    getNumbers: builder.query({
      query: (filters) => {
        const { locationId, ...restFilters } = filters;
        return {
          url: `numbers/location/${locationId}/`,
          method: "GET",
          params: restFilters,
        };
      },
      providesTags: ['Numbers'],
    }),
    registerNumber: builder.mutation({
      query: ({ number, location_id }) => ({
        url: `numbers-register/`,
        method: "POST",
        data: { number, location_id }
      }),
      invalidatesTags: ['Numbers'],
    }),
    requestPremiumNumber: builder.mutation({
      query: ({ number, location_id }) => ({
        url: `numbers-request-premium/`,
        method: "POST",
        data: { number, location_id }
      }),
      invalidatesTags: ['Numbers'],
    }),
  }),
})

export const { 
  useGetDashboardQuery, 
  useGetMessagesQuery, 
  useGetTransactionsQuery,
  useGetNumbersQuery,
  useRegisterNumberMutation,
  useRequestPremiumNumberMutation
} = dashboardAPi;
