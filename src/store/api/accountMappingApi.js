// src/redux/api/accountMappingApi.js

import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, BASE_URL } from '../axios/axios';

export const accountMappingApi = createApi({
  reducerPath: 'accountMappingApi',
  baseQuery: axiosBaseQuery({ baseUrl: `${BASE_URL}/sms/mappings/` }),
  tagTypes: ['AccountMapping'],
  endpoints: (builder) => ({
    getAccountMappings: builder.query({
      query: ({ page, page_size }) => ({
        url: '',
        params: { page, page_size }
      }),
  }),
    createAccountMapping: builder.mutation({
      query: (data) => ({
        url: '',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['AccountMapping'],
    }),
    deleteAccountMapping: builder.mutation({
      query: (id) => ({
        url: `${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AccountMapping'],
    }),
  }),
});

export const {
  useGetAccountMappingsQuery,
  useCreateAccountMappingMutation,
  useDeleteAccountMappingMutation,
} = accountMappingApi;
