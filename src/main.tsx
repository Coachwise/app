
  import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import { RealtimeProvider } from "./contexts/RealtimeContext.tsx";
import { initNative } from "./lib/platform.ts";
import "./styles/globals.css";

// Configure the native shell (status bar, splash) when running under Capacitor.
initNative();

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <RealtimeProvider>
      <App />
    </RealtimeProvider>
  </AuthProvider>
);
  
