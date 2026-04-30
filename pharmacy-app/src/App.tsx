import { Provider } from "react-redux";
import { store } from "./store";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { ToastProvider } from "@components/common/Toast/ToastProvider";
import { ErrorBoundary } from "@components/common/ErrorBoundary/ErrorBoundary";
import SessionTimeoutHandler from "@utils/session/SessionTimeoutHandler";

export default function App() {
  return (
    <ToastProvider>
    <Provider store={store}>
      <BrowserRouter>
      <SessionTimeoutHandler />
        <ErrorBoundary fallback={<div>Something went wrong.</div>}>
          <AppRoutes />
        </ErrorBoundary>
      </BrowserRouter>
    </Provider>
    </ToastProvider>
  );
}
