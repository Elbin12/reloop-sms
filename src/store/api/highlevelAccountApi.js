import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, BASE_URL, axiosInstance } from '../axios/axios';

export const HIGHLEVEL_ACCOUNTS_PAGE_SIZE = 10;

export const highlevelAccountApi = createApi({
  reducerPath: 'highlevelAccountApi',
  baseQuery: axiosBaseQuery({ baseUrl: BASE_URL + '/core/ghl-auth-credentials/' }),
  tagTypes: ['HighLevelAccount'],
  endpoints: (builder) => ({
    getHighlevelAccounts: builder.query({
      query: ({ page, page_size = HIGHLEVEL_ACCOUNTS_PAGE_SIZE } = {}) => {
        const params = new URLSearchParams();
        if (page) params.set('page', page);
        if (page_size) params.set('per_page', page_size);
        const qs = params.toString();
        return qs ? `?${qs}` : '';
      },
      providesTags: (result) =>
        result
          ? [
              ...result.results.map(({ id }) => ({ type: 'HighLevelAccount', id })),
              { type: 'HighLevelAccount', id: 'LIST' },
            ]
          : [{ type: 'HighLevelAccount', id: 'LIST' }],
    }),
    refreshTransmitBalances: builder.mutation({
      async queryFn() {
        try {
          const result = await axiosInstance.post(`${BASE_URL}/sms/transmit-balances/refresh/`);
          return { data: result.data };
        } catch (axiosError) {
          return {
            error: {
              status: axiosError.response?.status,
              data: axiosError.response?.data || axiosError.message,
            },
          };
        }
      },
      invalidatesTags: [{ type: 'HighLevelAccount', id: 'LIST' }],
    }),
    createHighlevelAccount: builder.mutation({
      query: (data) => ({
        url: '',
        method: 'POST',
        data: data,
      }),
      invalidatesTags: ['HighLevelAccount'],
    }),
    updateHighlevelAccount: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `${id}/`,
        method: 'PATCH',
        data: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'HighLevelAccount', id },
        { type: 'HighLevelAccount', id: 'LIST' },
      ],
    }),
    deleteHighlevelAccount: builder.mutation({
      query: (id) => ({
        url: `${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['HighLevelAccount'],
    }),
  }),
});

export const {
  useGetHighlevelAccountsQuery,
  useRefreshTransmitBalancesMutation,
  useCreateHighlevelAccountMutation,
  useUpdateHighlevelAccountMutation,
  useDeleteHighlevelAccountMutation,
} = highlevelAccountApi;
