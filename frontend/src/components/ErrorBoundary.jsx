import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-stone-900/90 border border-stone-800 rounded-2xl p-8 shadow-2xl backdrop-blur-md text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <h1 className="text-2xl font-bold tracking-tight mb-2 text-stone-100">
              Something went wrong
            </h1>
            
            <p className="text-stone-400 text-sm mb-6 leading-relaxed">
              An unexpected application error occurred. Our team has been notified. Please try refreshing the page or returning home.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <button
                onClick={this.handleReload}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors shadow-lg shadow-emerald-900/20 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium text-sm transition-colors border border-stone-700 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                Return Home
              </button>
            </div>

            {this.state.error && (
              <details className="text-left text-xs text-stone-500 border-t border-stone-800 pt-4">
                <summary className="cursor-pointer hover:text-stone-400 font-mono">
                  Error Details (Click to view)
                </summary>
                <pre className="mt-2 p-3 bg-stone-950 rounded-lg overflow-x-auto text-[11px] font-mono text-red-300/80 leading-normal">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
