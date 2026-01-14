import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./auth/authSlice";
import uiReducer from "./ui/uiSlice";
import storage from "redux-persist/lib/storage"; // defaults to localStorage
import { persistStore, persistReducer } from "redux-persist";
import prescriptionReducer from "./prescription/prescriptionSlice";
import patientReducer from "./patient/patientSlice";

const authPersistConfig = { key: "auth", storage, whitelist: ["user", "accessToken"], };
const uiPersistConfig = { key: "ui", storage };

const persistedAuth = persistReducer(authPersistConfig, authReducer);
const persistedUi = persistReducer(uiPersistConfig, uiReducer);

export const store = configureStore({
  reducer: {
    auth: persistedAuth,
    ui: persistedUi,
    prescriptions: prescriptionReducer,
    patients: patientReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // required for redux-persist
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
