import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, BASE_URL } from '../axios/axios';

export const dashboardApi = createApi({
  reducerPath: 'dashboardApi',
  baseQuery: axiosBaseQuery({ baseUrl: `${BASE_URL}/sms/` }),
  tagTypes: ['dashboardApi'],
  endpoints: (builder) => ({
    getDashboardApi: builder.query({
      query: (filters) => ({
        url:`dashboard/analytics/`,
        method: 'GET',
        params: filters,
        })
    }),
    modifyFunds: builder.mutation({
      query: ({ location_id, action, amount, reference_id }) => ({
        url: `wallet/${location_id}/add-funds/`,
        method: 'POST',
        data: {
          action,
          amount,
          reference_id,
        },
      }),
    }),
    getAvailableNumbers: builder.query({
      query: (filters) => ({
        url: `live-numbers/available/`,
        method: "GET",
        params: { ...filters }
      }),
      providesTags: ['Numbers']
    }),
    getLocationNumbers: builder.query({
      query: (locationId) => ({
        url: `numbers/location/${locationId}/`,
        method: "GET",
      }),
    }),
    buyPremiumNumbers: builder.mutation({
      query: ({ payload }) => ({
        url: `numbers-register-premium/`,
        method: 'POST',
        data: { ...payload },
      }),
    }),
  }),
});

export const {
  useGetDashboardApiQuery,
  useModifyFundsMutation,
  useGetAvailableNumbersQuery,
  useGetLocationNumbersQuery,
  useBuyPremiumNumbersMutation,
} = dashboardApi;