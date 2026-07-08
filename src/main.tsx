
  import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import { RealtimeProvider } from "./contexts/RealtimeContext.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <RealtimeProvider>
      <App />
    </RealtimeProvider>
  </AuthProvider>
);
  
