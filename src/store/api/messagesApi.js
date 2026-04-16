import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, axiosInstance, BASE_URL } from '../axios/axios';

export const messagesApi = createApi({
  reducerPath: 'messagesApi',
  baseQuery: axiosBaseQuery({ baseUrl: `${BASE_URL}/sms/sms-messages/` }),
  tagTypes: ['messagesApi'],
  endpoints: (builder) => ({
    getMessagesApi: builder.query({
      query: ({ page, page_size, status, search, direction, ghl_account, transmitsms_account, ordering, created_at_gte, created_at_lte }) => {
        const params = { page, page_size };
        
        // Add optional filters
        if (status && status !== 'all') {
          params.status = status;
        }
        if (search) {
          params.search = search;
        }
        if (direction) {
          params.direction = direction;
        }
        if (ghl_account) {
          params.ghl_account = ghl_account;
        }
        if (transmitsms_account) {
          params.transmitsms_account = transmitsms_account;
        }
        if (ordering) {
          params.ordering = ordering;
        }
        if (created_at_gte) {
          params.created_at__gte = created_at_gte;
        }
        if (created_at_lte) {
          params.created_at__lte = created_at_lte;
        }

        return {
          url: '',
          params
        };
      },
      providesTags: (result) =>
        result?.results?.length
          ? [
              ...result.results.map(({ id }) => ({ type: 'messagesApi', id })),
              { type: 'messagesApi', id: 'LIST' },
            ]
          : [{ type: 'messagesApi', id: 'LIST' }],
    }),
    retrySmsMessage: builder.mutation({
      async queryFn({ id, location_id }) {
        try {
          const { data } = await axiosInstance.post(`sms/messages/${id}/retry/`, {
            id,
            location_id,
          });
          return { data };
        } catch (axiosError) {
          return {
            error: {
              status: axiosError.response?.status,
              data: axiosError.response?.data || axiosError.message,
            },
          };
        }
      },
      invalidatesTags: (_result, error, { id }) =>
        error ? [] : [{ type: 'messagesApi', id: 'LIST' }, { type: 'messagesApi', id }],
    }),
  }),
});

export const {
  useGetMessagesApiQuery,
  useRetrySmsMessageMutation,
} = messagesApi;