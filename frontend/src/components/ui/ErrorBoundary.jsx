import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[var(--bg-page)] flex items-center justify-center p-6">
          <div className="card-base p-10 max-w-md text-center flex flex-col items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <AlertTriangle size={32} className="text-rose-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Something went wrong</h2>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                An unexpected error occurred. Please try refreshing the page.
              </p>
              {this.state.error && (
                <p className="mt-3 text-xs text-[var(--text-muted)] font-mono bg-[var(--bg-active)] rounded-lg p-3 break-all">
                  {this.state.error.message}
                </p>
              )}
            </div>
            <button
              onClick={this.handleReset}
              className="btn-primary px-6 py-3"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
