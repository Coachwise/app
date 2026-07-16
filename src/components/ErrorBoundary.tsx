import { Component, type ErrorInfo, type ReactNode } from "react";
import { report } from "@/lib/report";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  crashed: boolean;
}

// Catches the render-time crashes that would otherwise leave a white screen, so
// two things happen instead: the user sees something they can act on, and the
// crash is reported to #alert-log with its component stack.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { crashed: false };

  static getDerivedStateFromError(): State {
    return { crashed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    report({
      kind: "crash",
      message: error.message || "render crash",
      // The component stack points at the tree that failed — far more useful than
      // the raw JS stack for a render error.
      stack: `${error.stack ?? ""}\n\nComponent stack:${info.componentStack ?? ""}`,
    });
  }

  render() {
    if (!this.state.crashed) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    // The strings are intentionally not translated: the crash may be in the
    // i18n layer itself, so this must render with no app dependencies at all.
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "2rem",
          textAlign: "center",
          background: "#0E0E55",
          color: "#EEF2F7",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <p style={{ fontSize: "1.1rem", margin: 0 }}>Something went wrong.</p>
        <p style={{ opacity: 0.7, margin: 0, fontSize: "0.9rem" }}>
          مشکلی پیش آمد. لطفاً دوباره تلاش کنید.
        </p>
        <button
          onClick={() => location.reload()}
          style={{
            marginTop: "0.5rem",
            padding: "0.6rem 1.4rem",
            borderRadius: "0.75rem",
            border: "none",
            background: "#eab308",
            color: "#0E0E55",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Reload · بارگذاری مجدد
        </button>
      </div>
    );
  }
}
