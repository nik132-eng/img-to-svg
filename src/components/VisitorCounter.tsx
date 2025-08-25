'use client';

import { useState, useEffect } from 'react';

export function VisitorCounter() {
  const [count, setCount] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Mark as client-side to prevent hydration mismatch
    setIsClient(true);
    
    try {
      // Load visitor count from localStorage
      const savedCount = localStorage.getItem('visitorCount');
      let currentCount = savedCount ? parseInt(savedCount, 10) : 0;
      
      // Ensure count is a valid number
      if (isNaN(currentCount) || currentCount < 0) {
        currentCount = 0;
      }
      
      // Increment count for this visit
      currentCount += 1;
      
      // Store updated count
      localStorage.setItem('visitorCount', currentCount.toString());
      
      // Update state
      setCount(currentCount);
    } catch (error) {
      // Fallback if localStorage fails
      console.warn('Failed to update visitor count:', error);
      setCount(1);
    }

    // Add Umami analytics script dynamically
    const script = document.createElement('script');
    script.src = 'https://cloud.umami.is/script.js';
    script.setAttribute('data-website-id', 'd395e305-ed8d-46a3-9a0b-362f0e0a64bd');
    script.defer = true;
    
    // Check if script already exists to avoid duplicates
    if (!document.querySelector('script[src="https://cloud.umami.is/script.js"]')) {
      document.head.appendChild(script);
    }
  }, []);

  // Format number with commas
  const formatNumber = (num: number): string => {
    try {
      return num.toLocaleString();
    } catch {
      return num.toString();
    }
  };

  // Show loading state during SSR to prevent hydration mismatch
  if (!isClient) {
    return (
      <div className="flex items-center space-x-2 bg-white/70 backdrop-blur-sm px-3 py-2 rounded-full border border-white/40 shadow-md">
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <span className="text-sm font-medium text-gray-700">
          Loading...
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 bg-white/70 backdrop-blur-sm px-3 py-2 rounded-full border border-white/40 shadow-md">
      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
      <span className="text-sm font-medium text-gray-700">
        {formatNumber(count)} visitors
      </span>
    </div>
  );
}
