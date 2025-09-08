import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, BASE_URL } from '../axios/axios';

export const highlevelAccountApi = createApi({
  reducerPath: 'highlevelAccountApi',
  baseQuery: axiosBaseQuery({ baseUrl: BASE_URL + '/core/ghl-auth-credentials/' }),
  tagTypes: ['HighLevelAccount'],
  endpoints: (builder) => ({
    getHighlevelAccounts: builder.query({
      query: ({ page }) => `?page=${page}`,
      providesTags: (result) =>
        result
          ? [
              ...result.results.map(({ id }) => ({ type: 'HighLevelAccount', id })),
              { type: 'HighLevelAccount', id: 'LIST' },
            ]
          : [{ type: 'HighLevelAccount', id: 'LIST' }],
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
  useCreateHighlevelAccountMutation,
  useUpdateHighlevelAccountMutation,
  useDeleteHighlevelAccountMutation,
} = highlevelAccountApi;
