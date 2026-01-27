import { Provider } from "react-redux";
import { store } from "./store";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { ToastProvider } from "@components/common/Toast/ToastProvider";
import { ErrorBoundary } from "@components/common/ErrorBoundary";

export default function App() {
  return (
    <ToastProvider>
    <Provider store={store}>
      <BrowserRouter>
        <ErrorBoundary fallback={<div>Something went wrong.</div>}>
          <AppRoutes />
        </ErrorBoundary>
      </BrowserRouter>
    </Provider>
    </ToastProvider>
  );
}
