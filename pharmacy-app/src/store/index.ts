// import { configureStore } from "@reduxjs/toolkit";
// import authReducer from "../store/auth/authSlice";
// import uiReducer from "../store/ui/uiSlice";

// export const store = configureStore({
//   reducer: { auth: authReducer,
//     ui: uiReducer,
//    },
// });

// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./auth/authSlice";
import uiReducer from "./ui/uiSlice";
import storage from "redux-persist/lib/storage"; // defaults to localStorage
import { persistStore, persistReducer } from "redux-persist";

const authPersistConfig = { key: "auth", storage, whitelist: ["user", "accessToken"], };
const uiPersistConfig = { key: "ui", storage };

const persistedAuth = persistReducer(authPersistConfig, authReducer);
const persistedUi = persistReducer(uiPersistConfig, uiReducer);

export const store = configureStore({
  reducer: {
    auth: persistedAuth,
    ui: persistedUi,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // required for redux-persist
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
