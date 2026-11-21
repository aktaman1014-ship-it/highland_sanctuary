import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'An unexpected error occurred.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-sand flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-cream rounded-2xl border border-oak p-8 text-center space-y-4 pinterest-shadow">
            <div className="w-12 h-12 rounded-full bg-coral-tint text-slate-ink flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-ink">Something needs a quick refresh</h1>
            <p className="text-sm text-slate-muted leading-relaxed">
              We encountered an issue syncing your sanctuary session. Your local data remains
              preserved.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full gradient-coral-peach text-slate-ink text-sm font-bold cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reload App</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
