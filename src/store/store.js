import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import { transmitsmsAccountApi } from './api/transmitsmsaccountApi';
import { highlevelAccountApi } from './api/highlevelAccountApi';
import { accountMappingApi } from './api/accountMappingApi';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    [transmitsmsAccountApi.reducerPath]: transmitsmsAccountApi.reducer,
    [highlevelAccountApi.reducerPath]: highlevelAccountApi.reducer,
    [accountMappingApi.reducerPath]: accountMappingApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
        ],
      },
    })
    .concat(transmitsmsAccountApi.middleware)
    .concat(highlevelAccountApi.middleware)
    .concat(accountMappingApi.middleware)
});

export default store;