import { Component, type ErrorInfo, type ReactNode } from "react";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[eRide ErrorBoundary] Application crash prevented:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.assign("/");
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center px-6">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 text-center shadow-sm space-y-4">
            <div className="space-y-2">
              <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
              <p className="text-sm text-muted-foreground">
                The app recovered from a crash so you do not get a blank page.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={this.handleReload}
                className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Reload page
              </button>
              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                Go home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;