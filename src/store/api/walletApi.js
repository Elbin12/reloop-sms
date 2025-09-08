import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery, BASE_URL } from "../axios/axios";

export const walletsApi = createApi({
  reducerPath: "walletsApi",
  baseQuery: axiosBaseQuery({ baseUrl: BASE_URL + '/core/' }),
  tagTypes: ["Wallet", "Transaction"],
  endpoints: (builder) => ({
    getWallets: builder.query({
        query: (filters) => ({
            url: `wallets-list/`,
            method: "GET",
            params: {...filters}
        }),
        providesTags: ['Wallets']
    }),
    getTransactions: builder.query({
        query: (filters) => ({
            url: `transactions-list/`,
            method: "GET",
            params: {...filters}
        }),
        providesTags: ["Transactions"],
    }),
    getWalletSummary: builder.query({
        query: () => ({
            url: `wallet-summary/`,
            method: "GET",
        }),
        providesTags: ["Wallet Summary"],
    }),
    }),
})

export const { useGetWalletsQuery, useGetTransactionsQuery, useGetWalletSummaryQuery } = walletsApi;
