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
    })
  }),
});

export const {
  useGetDashboardApiQuery,
} = dashboardApi;