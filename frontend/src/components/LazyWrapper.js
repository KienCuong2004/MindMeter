import React, { Suspense } from 'react';
import LoadingSpinner from './LoadingSpinner';

/**
 * Wrapper component for lazy-loaded components
 * Provides consistent loading state across the app
 */
const LazyWrapper = ({ children }) => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      {children}
    </Suspense>
  );
};

export default LazyWrapper;
