import React from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MainApp } from './components/MainApp';

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}
