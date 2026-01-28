import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { ModuleRegistry } from "ag-grid-community";
import { AllCommunityModule } from "ag-grid-community";
ModuleRegistry.registerModules([AllCommunityModule]);
import "ag-grid-community/styles/ag-theme-alpine.css";
import "./styles/ag-grid-theme.css"; // ✅ custom modern theme
import "./index.css";

import App from "./App";
import { store, persistor } from "./store";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);

root.render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <App />
    </PersistGate>
  </Provider>,
);
