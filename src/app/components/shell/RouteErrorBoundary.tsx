import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  routeKey?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[RouteErrorBoundary] Error in route "${this.props.routeKey}":`, error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full flex-col items-center justify-center p-8 text-center">
          <div className="max-w-md space-y-4">
            <h2 className="font-mono text-[14px] font-semibold text-text">Something went wrong</h2>
            <p className="text-[13px] text-text-muted">
              An unexpected error occurred while loading this page.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre className="overflow-auto rounded-sm border border-border-subtle bg-surface-2 p-3 text-left font-mono text-[11px] text-red-400">
                {this.state.error.message}
                {'\n'}
                {this.state.error.stack}
              </pre>
            )}
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex min-h-10 items-center gap-2 rounded-sm border border-border-strong bg-surface-2 px-4 py-2 text-[13px] text-text-secondary transition-colors hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-brand-ring"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
