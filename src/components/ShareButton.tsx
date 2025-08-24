'use client';

import { useState } from 'react';

interface ShareButtonProps {
  svgContent: string;
  fileName?: string;
  className?: string;
}

export function ShareButton({ svgContent, fileName = 'converted.svg', className = '' }: ShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [shareError, setShareError] = useState<string | null>(null);

  const handleShare = async () => {
    setIsSharing(true);
    setShareError(null);
    
    try {
      // Create a shareable link
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          svgContent,
          fileName,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const fullShareUrl = `${window.location.origin}/r/${data.shareId}`;
        setShareUrl(fullShareUrl);
        setRetryCount(0); // Reset retry count on success
        
        // Try to use native sharing if available
        if (navigator.share) {
          try {
            await navigator.share({
              title: 'Check out this SVG I created!',
              text: `I converted ${fileName} to SVG using this amazing tool!`,
              url: fullShareUrl,
            });
          } catch {
            console.log('Native sharing cancelled or failed');
          }
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error('Error sharing SVG:', err);
      
      if (retryCount < 2) {
        // Retry up to 2 times
        setRetryCount(prev => prev + 1);
        setShareError(`Share failed. Retrying... (${retryCount + 1}/3)`);
        
        // Wait 1 second before retrying
        setTimeout(() => {
          handleShare();
        }, 1000);
        return;
      }
      
      // After retries, use fallback
      setShareError('Share service unavailable. Using fallback method.');
      const fallbackUrl = `${window.location.origin}/share?svg=${encodeURIComponent(svgContent)}`;
      setShareUrl(fallbackUrl);
    } finally {
      setIsSharing(false);
    }
  };

  const copyToClipboard = async () => {
    if (!shareUrl) return;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const resetShare = () => {
    setShareUrl(null);
    setCopySuccess(false);
  };

  if (shareUrl) {
    return (
      <div className={`bg-white/95 backdrop-blur-sm border border-gray-200/60 rounded-2xl p-4 shadow-lg ${className}`}>
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-gray-800">Share Link Created!</span>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-2">Share this link with anyone:</p>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 text-xs bg-white border border-gray-200 rounded px-2 py-1 text-gray-700"
              />
              <button
                onClick={copyToClipboard}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  copySuccess
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {copySuccess ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={resetShare}
              className="flex-1 bg-gray-600 text-white py-2 px-3 rounded-xl text-xs font-medium hover:bg-gray-700 transition-colors"
            >
              New Share
            </button>
            <button
              onClick={() => window.open(shareUrl, '_blank')}
              className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-xl text-xs font-medium hover:bg-blue-700 transition-colors"
            >
              Preview
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {shareError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-xs text-yellow-800">
          {shareError}
        </div>
      )}
      
      <button
        onClick={handleShare}
        disabled={isSharing}
        className={`bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-4 rounded-2xl font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 text-xs ${className}`}
      >
        {isSharing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
            <span>{retryCount > 0 ? `Retrying... (${retryCount}/3)` : 'Creating...'}</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            <span>Share SVG</span>
          </>
        )}
      </button>
    </div>
  );
}
