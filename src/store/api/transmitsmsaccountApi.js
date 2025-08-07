import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, BASE_URL } from '../axios/axios';

export const transmitsmsAccountApi = createApi({
  reducerPath: 'transmitsmsAccountApi',
  baseQuery: axiosBaseQuery({ baseUrl: BASE_URL + '/transmit-sms/accounts/'}),
  tagTypes: ['Account'],
  endpoints: (builder) => ({
    getTransmitsmsAccounts: builder.query({
      query: ({ page = 1 }) => `?page=${page}`,
      providesTags: ['Account'],
    }),
    createTransmitsmsAccount: builder.mutation({
      query: (data) => ({
        url: '',
        method: 'POST',
        data: data,
      }),
      invalidatesTags: ['Account'],
    }),
    updateTransmitsmsAccount: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `${id}/`,
        method: 'PUT',
        data: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Account', id }],
    }),
    deleteTransmitsmsAccount: builder.mutation({
      query: (id) => ({
        url: `${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Account'],
    }),
  }),
});

export const {
  useGetTransmitsmsAccountsQuery,
  useCreateTransmitsmsAccountMutation,
  useUpdateTransmitsmsAccountMutation,
  useDeleteTransmitsmsAccountMutation
} = transmitsmsAccountApi;