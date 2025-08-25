'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface ParsedSvgItem {
  id: string;
  fileName: string;
  svgContent: string;
  originalIndex: number;
}

function SharePageContent() {
  const searchParams = useSearchParams();
  const svgParam = searchParams.get('svg');
  
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [parsedSvgs, setParsedSvgs] = useState<ParsedSvgItem[]>([]);
  const [isBulkSvg, setIsBulkSvg] = useState(false);
  const [selectedSvgIndex, setSelectedSvgIndex] = useState(0);

  // Function to parse bulk SVG content into individual SVGs
  const parseBulkSvgContent = (svgContent: string): ParsedSvgItem[] => {
    try {
      // Check if this is a bulk SVG by looking for multiple file groups
      const fileGroups = svgContent.match(/<g[^>]*data-filename="([^"]*)"[^>]*>([\s\S]*?)<\/g>/g);
      
      if (fileGroups && fileGroups.length > 1) {
        // This is a bulk SVG, parse individual items
        const parsed: ParsedSvgItem[] = [];
        
        fileGroups.forEach((group, index) => {
          const filenameMatch = group.match(/data-filename="([^"]*)"/);
          const filename = filenameMatch ? filenameMatch[1] : `File ${index + 1}`;
          
          // Extract the SVG content from the group
          const contentMatch = group.match(/<g[^>]*>([\s\S]*?)<\/g>/);
          if (contentMatch) {
            // Wrap the content in proper SVG tags
            const individualSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 200" width="800" height="200">
              ${contentMatch[1]}
            </svg>`;
            
            parsed.push({
              id: `svg-${index}`,
              fileName: filename,
              svgContent: individualSvg,
              originalIndex: index
            });
          }
        });
        
        return parsed;
      } else {
        // Single SVG, return as is
        return [{
          id: 'svg-0',
          fileName: 'Shared SVG',
          svgContent: svgContent,
          originalIndex: 0
        }];
      }
    } catch (error) {
      console.error('Error parsing bulk SVG:', error);
      // Fallback to single SVG
      return [{
        id: 'svg-0',
        fileName: 'Shared SVG',
        svgContent: svgContent,
        originalIndex: 0
      }];
    }
  };

  useEffect(() => {
    if (svgParam) {
      try {
        const decodedSvg = decodeURIComponent(svgParam);
        setSvgContent(decodedSvg);
        
        // Parse the SVG content to check if it's bulk
        const parsed = parseBulkSvgContent(decodedSvg);
        setParsedSvgs(parsed);
        setIsBulkSvg(parsed.length > 1);
        setSelectedSvgIndex(0);
      } catch (error) {
        console.error('Error decoding SVG:', error);
      }
    }
  }, [svgParam]);

  const handleDownload = () => {
    if (!svgContent || parsedSvgs.length === 0) return;
    
    const selectedSvg = parsedSvgs[selectedSvgIndex];
    const blob = new Blob([selectedSvg.svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedSvg.fileName.replace(/\.[^/.]+$/, '.svg') || 'shared.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    if (!svgContent) return;
    
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk-conversion.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyCode = async () => {
    if (!svgContent || parsedSvgs.length === 0) return;
    
    try {
      const selectedSvg = parsedSvgs[selectedSvgIndex];
      await navigator.clipboard.writeText(selectedSvg.svgContent);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  if (!svgContent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto px-4">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Invalid Share Link</h1>
            <p className="text-gray-600 mb-6">This share link is invalid or has expired.</p>
            <Link 
              href="/"
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Go to Converter</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-white/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Shared SVG</h1>
                <p className="text-sm text-gray-600">View and download the shared vector graphic</p>
              </div>
            </div>
            <Link 
              href="/"
              className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
            >
              Convert Your Own
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* SVG Preview */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border border-white/40 p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-1">SVG Preview</h2>
                <p className="text-sm text-gray-600">
                  {isBulkSvg 
                    ? `Bulk Conversion: ${parsedSvgs.length} files` 
                    : 'Shared vector graphic'
                  }
                </p>
              </div>
              
              {/* SVG Navigation for Bulk Content */}
              {isBulkSvg && parsedSvgs.length > 1 && (
                <div className="mb-4 bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Select SVG to view:</span>
                    <span className="text-xs text-gray-500">{selectedSvgIndex + 1} of {parsedSvgs.length}</span>
                  </div>
                  <div className="flex space-x-2 overflow-x-auto pb-2">
                    {parsedSvgs.map((svg, index) => (
                      <button
                        key={svg.id}
                        onClick={() => setSelectedSvgIndex(index)}
                        className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          selectedSvgIndex === index
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        {svg.fileName.replace(/\.[^/.]+$/, '')}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="bg-white rounded-2xl border border-gray-200 p-4 min-h-96 flex items-center justify-center">
                <div 
                  dangerouslySetInnerHTML={{ __html: parsedSvgs[selectedSvgIndex]?.svgContent || svgContent }}
                  className="w-full h-full flex items-center justify-center"
                  style={{ 
                    backgroundColor: 'white',
                    minWidth: '200px',
                    minHeight: '200px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    objectFit: 'contain'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/40 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={handleDownload}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Download Current SVG</span>
                </button>
                
                {isBulkSvg && parsedSvgs.length > 1 && (
                  <button
                    onClick={handleDownloadAll}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Download All ({parsedSvgs.length})</span>
                  </button>
                )}
                
                <button
                  onClick={handleCopyCode}
                  className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 ${
                    copySuccess 
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white' 
                      : 'bg-gray-600 text-white hover:bg-gray-700'
                  }`}
                >
                  {copySuccess ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Copy SVG Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Share Info */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200/50">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">This SVG was shared with you!</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Want to convert your own images? Try our free converter!
                  </p>
                </div>
                <Link 
                  href="/"
                  className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Start Converting
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SharePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-400 rounded-full animate-spin mx-auto" style={{ animationDelay: '0.5s' }}></div>
          </div>
          <p className="text-lg font-medium text-gray-700">Loading...</p>
        </div>
      </div>
    }>
      <SharePageContent />
    </Suspense>
  );
}
