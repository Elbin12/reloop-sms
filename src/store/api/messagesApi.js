import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, axiosInstance, BASE_URL } from '../axios/axios';

export const messagesApi = createApi({
  reducerPath: 'messagesApi',
  baseQuery: axiosBaseQuery({ baseUrl: `${BASE_URL}/sms/sms-messages/` }),
  tagTypes: ['messagesApi'],
  endpoints: (builder) => ({
    getMessagesApi: builder.query({
      query: ({ page, page_size, status, search, direction, ghl_account, transmitsms_account, location_id, error_category, ordering, created_at_gte, created_at_lte }) => {
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
        if (location_id) {
          params.location_id = location_id;
        }
        if (error_category) {
          params.error_category = error_category;
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
    bulkRetrySmsMessages: builder.mutation({
      async queryFn({ message_ids, select_all, include_permanent, filters } = {}) {
        try {
          const body = { include_permanent: !!include_permanent };
          let url = 'sms/messages/bulk-retry/';
          if (select_all) {
            body.select_all = true;
            // Pass current filters as query params so the backend re-resolves the set
            const search = new URLSearchParams();
            Object.entries(filters || {}).forEach(([k, v]) => {
              if (v !== undefined && v !== null && v !== '') search.append(k, v);
            });
            const qs = search.toString();
            if (qs) url += `?${qs}`;
          } else {
            body.message_ids = message_ids || [];
          }
          const { data } = await axiosInstance.post(url, body);
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
      invalidatesTags: (_result, error) =>
        error ? [] : [{ type: 'messagesApi', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetMessagesApiQuery,
  useRetrySmsMessageMutation,
  useBulkRetrySmsMessagesMutation,
} = messagesApi;