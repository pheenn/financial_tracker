import React, { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-50 text-red-900 min-h-screen flex flex-col items-center justify-center text-center">
          <h1 className="text-3xl font-black mb-4 text-red-600">App Crashed</h1>
          <p className="font-mono text-xs bg-red-100 p-4 rounded max-w-full overflow-auto shadow-inner border border-red-200 mb-8">
            {this.state.error?.toString()}
          </p>
          <button 
            onClick={() => { localStorage.removeItem('financeTrackerData'); window.location.reload(); }} 
            className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-red-700"
          >
            Clear Data & Restart
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

