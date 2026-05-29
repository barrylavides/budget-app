import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ensureDevSession } from "./lib/devAuth";
import { ToastProvider } from "./components/ui/Toast";
import "./index.css";

// DEV-only: sign in the seeded dev user before first render so RLS-gated
// queries return data. No-op in production. Removed by issue #11 (real auth).
ensureDevSession().finally(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <BrowserRouter>
        <ToastProvider>
          <App />
        </ToastProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
});
