
import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, BASE_URL } from '../axios/axios';

export const messagesApi = createApi({
  reducerPath: 'messagesApi',
  baseQuery: axiosBaseQuery({ baseUrl: `${BASE_URL}/sms/sms-messages/` }),
  tagTypes: ['messagesApi'],
  endpoints: (builder) => ({
    getMessagesApi: builder.query({
      query: ({ page, page_size }) => ({
        url: '',
        params: { page, page_size }
      }),
    })
  }),
});

export const {
  useGetMessagesApiQuery,
} = messagesApi;
