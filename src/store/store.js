import { configureStore } from '@reduxjs/toolkit';
import { servicesApi } from './api/servicesApi';
import authSlice from './slices/authSlice';
import { transmitsmsAccountApi } from './api/transmitsmsaccountApi';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    [transmitsmsAccountApi.reducerPath]: transmitsmsAccountApi.reducer,
    [servicesApi.reducerPath]: servicesApi.reducer,
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
    .concat(servicesApi.middleware)
});

export default store;