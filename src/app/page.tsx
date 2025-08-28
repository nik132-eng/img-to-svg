'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ImageUploader } from '@/components/ImageUploader';
import { BulkImageUploader } from '@/components/BulkImageUploader';
import { ConversionQueue } from '@/components/ConversionQueue';
import { ZipDownloader } from '@/components/ZipDownloader';
import { ShareButton } from '@/components/ShareButton';
import { ConversionSettings as ConversionSettingsType } from '@/components/ConversionSettings';
import { ClientOnly } from '@/components/ClientOnly';
import { CustomAlgorithmTester } from '@/components/CustomAlgorithmTester';
import React from 'react'; // Added for React.useMemo

// Lazy load components with proper error handling
const LazyThreeBackground = React.lazy(() => 
  import('@/components/ThreeBackground')
    .then(module => ({ default: module.ThreeBackground }))
    .catch(() => ({ default: () => <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100" /> }))
);

const LazyConversionSettings = React.lazy(() => 
  import('@/components/ConversionSettings')
    .then(module => ({ default: module.ConversionSettings }))
    .catch(() => ({ default: () => <div className="p-4 bg-gray-100 rounded">Settings failed to load</div> }))
);

const LazyVisitorCounter = React.lazy(() => 
  import('@/components/VisitorCounter')
    .then(module => ({ default: module.VisitorCounter }))
    .catch(() => ({ default: () => <div className="w-20 h-8 bg-gray-200 rounded" /> }))
);

const LazySvgEditor = React.lazy(() => 
  import('@/components/SvgEditor')
    .then(module => ({ default: module.SvgEditor }))
    .catch(() => ({ default: () => <div className="p-4 bg-gray-100 rounded">Editor failed to load</div> }))
);

// Error boundary for chunk loading errors
class ChunkErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    if (error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')) {
      return { hasError: true };
    }
    return { hasError: false };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chunk loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}



export default function HomePage() {
  const [image, setImage] = useState<File | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [svg, setSvg] = useState<string | null>(null);
  const [conversionResults, setConversionResults] = useState<{ fileName: string; svgContent: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showSvgEditor, setShowSvgEditor] = useState(false);
  const [useBulkMode, setUseBulkMode] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false); // Add this state
  const [conversionSettings, setConversionSettings] = useState<ConversionSettingsType>({
    colorMode: 'color',
    colorPrecision: 6,
    filterSpeckle: 4,
    spliceThreshold: 45,
    cornerThreshold: 60,
    hierarchical: 'stacked',
    mode: 'spline',
    layerDifference: 5,
    lengthThreshold: 5,
    maxIterations: 2,
    pathPrecision: 5,
  });

  const handleConvert = async () => {
    if (!image) return;

    setLoading(true);
    setError(null);
    setSvg(null);

    try {
      const formData = new FormData();
      formData.append('image', image);

      // Add conversion settings as query parameters
      const params = new URLSearchParams({
        colorMode: conversionSettings.colorMode,
        colorPrecision: conversionSettings.colorPrecision.toString(),
        filterSpeckle: conversionSettings.filterSpeckle.toString(),
        spliceThreshold: conversionSettings.spliceThreshold.toString(),
        cornerThreshold: conversionSettings.cornerThreshold.toString(),
        hierarchical: conversionSettings.hierarchical,
        mode: conversionSettings.mode,
        layerDifference: conversionSettings.layerDifference.toString(),
        lengthThreshold: conversionSettings.lengthThreshold.toString(),
        maxIterations: conversionSettings.maxIterations.toString(),
        pathPrecision: conversionSettings.pathPrecision.toString(),
      });

      console.log('Sending request to:', `/api/convert?${params}`);
      const response = await fetch(`/api/convert?${params}`, {
        method: 'POST',
        body: formData
      });
      console.log('Response status:', response.status, response.statusText);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        // Check if the response is JSON before trying to parse it
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Conversion failed');
          } catch {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        } else {
          // If not JSON, get the text content for debugging
          const errorText = await response.text();
          console.error('Non-JSON error response:', errorText);
          console.error('Response content type:', contentType);
          console.error('Response status:', response.status);
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      try {
        const data = await response.json();
        console.log('Response data:', data);
        if (data && data.svg) {
          console.log('SVG content received, length:', data.svg.length);
          console.log('SVG preview:', data.svg.substring(0, 200) + '...');
          setSvg(data.svg);
        } else {
          console.error('Missing SVG data in response:', data);
          throw new Error('Invalid response format: missing SVG data');
        }
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        throw new Error('Invalid response format from server');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!svg) return;
    
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted-${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyCode = async () => {
    if (!svg) return;
    
    try {
      await navigator.clipboard.writeText(svg);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy SVG code:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = svg;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleClearImage = () => {
    setImage(null);
    setImages([]);
    setSvg(null);
    setError(null);
    setConversionResults([]);
  };

  // Handle paste events for keyboard shortcuts
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            setImage(file);
            setError(null);
            setSvg(null);
          }
          break;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  // Function to create a combined SVG from multiple conversion results
  const createCombinedSVG = React.useCallback((results: { fileName: string; svgContent: string }[]): string => {
    if (results.length === 0) return '';
    if (results.length === 1) return results[0].svgContent;
    
    // Create a combined SVG with proper spacing
    const svgElements = results.map((result, index) => {
      // Extract the SVG content without the outer <svg> tags
      const svgMatch = result.svgContent.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
      if (svgMatch) {
        return `<g id="file-${index + 1}" data-filename="${result.fileName}">${svgMatch[1]}</g>`;
      }
      return result.svgContent;
    });
    
    // Create a new SVG container with proper dimensions
    const combinedSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 ${results.length * 200}" width="800" height="${results.length * 200}">
  <defs>
    <style>
      .file-group { margin: 10px; }
      .file-label { font-family: Arial, sans-serif; font-size: 12px; fill: #666; }
    </style>
  </defs>
  ${svgElements.map((element, index) => `
    <g transform="translate(0, ${index * 200})" class="file-group">
      <text x="10" y="20" class="file-label">${results[index].fileName.replace(/\.[^/.]+$/, '.svg')}</text>
      ${element}
    </g>
  `).join('')}
</svg>`;
    
    return combinedSVG;
  }, []);

  const renderSVG = React.useCallback((svgContent: string): string => {
    try {
      // Use a more efficient approach - create div directly
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = svgContent;
      
      const svgElement = tempDiv.querySelector('svg');
      if (!svgElement) {
        return svgContent; // Return original if no SVG found
      }

      // Batch style changes to reduce reflows
      const styles = {
        width: '100%',
        height: '100%',
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain',
        overflow: 'visible',
        display: 'block',
        margin: '0 auto',
        backgroundColor: 'white',
        minWidth: '200px',
        minHeight: '200px',
        aspectRatio: 'auto'
      };

      // Apply all styles at once
      Object.assign(svgElement.style, styles);
      
      // Set viewBox efficiently
      if (!svgElement.getAttribute('viewBox')) {
        const width = svgElement.getAttribute('width');
        const height = svgElement.getAttribute('height');
        
        if (width && height && !isNaN(Number(width)) && !isNaN(Number(height))) {
          svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
        } else {
          svgElement.setAttribute('viewBox', '0 0 100 100');
        }
      }

      return tempDiv.innerHTML;
    } catch (err) {
      console.error('SVG rendering error:', err);
      // Return a minimal fallback SVG
      return `<svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="white"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#666" font-family="Arial, sans-serif" font-size="14">SVG Preview</text>
      </svg>`;
    }
  }, []);

  // Memoize SVG rendering with better dependency management
  const memoizedSVG = React.useMemo(() => {
    if (!svg) return null;
    return renderSVG(svg);
  }, [svg, renderSVG]);

  // Memoize conversion results with better performance
  const memoizedConversionResults = React.useMemo(() => {
    if (conversionResults.length === 0) return [];
    
    return conversionResults.map(result => ({
      ...result,
      renderedSVG: renderSVG(result.svgContent)
    }));
  }, [conversionResults, renderSVG]);

  return (
    <div className="relative overflow-hidden w-full App min-h-screen flex flex-col" suppressHydrationWarning>
      {/* Three.js Background - Lazy loaded */}
      <ClientOnly fallback={<div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100" />}>
        <ChunkErrorBoundary fallback={<div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100" />}>
          <React.Suspense fallback={<div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100" />}>
            <LazyThreeBackground />
          </React.Suspense>
        </ChunkErrorBoundary>
      </ClientOnly>
      
      {/* Content Overlay */}
      <div className="relative z-10 flex-1 flex flex-col bg-transparent content-overlay">
        {/* Header */}
        <div className="bg-white/70 backdrop-blur-md shadow-lg border-b border-white/30 w-full header flex-shrink-0">
          <div className="w-full px-3 sm:px-4 lg:px-6 py-2 sm:py-3">
            <div className="flex items-center justify-between">
              {/* Left side - Logo and Title */}
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 overflow-hidden">
                  <Image
                    src="/paint-palette.gif"
                    alt="Image to SVG Converter logo"
                    className="w-full h-full object-contain"
                    width={40}
                    height={40}
                    unoptimized
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-800 leading-tight">
                    Convert Image to SVG Online – Free & Instant
                  </h1>
                </div>
              </div>
              
              {/* Right side - Visitor Count */}
              <ClientOnly fallback={<div className="w-20 h-8 bg-gray-200 rounded animate-pulse" />}>
                <ChunkErrorBoundary fallback={<div className="w-20 h-8 bg-gray-200 rounded animate-pulse" />}>
                  <React.Suspense fallback={<div className="w-20 h-8 bg-gray-200 rounded animate-pulse" />}>
                    <LazyVisitorCounter />
                  </React.Suspense>
                </ChunkErrorBoundary>
              </ClientOnly>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4 main-content">
          {/* Custom Algorithm Tester - Development Only */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-6">
              <CustomAlgorithmTester />
            </div>
          )}
          
          {/* SEO Content Section */}
          <div className="hidden">
            <div className="text-center space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
                How to Convert Image to SVG
              </h2>
              <p className="text-gray-600 text-sm sm:text-base max-w-3xl mx-auto">
                Transform your JPG, PNG, GIF, or BMP images into scalable SVG vector graphics in just 3 simple steps. 
                No software installation required - everything happens in your browser for maximum privacy and speed.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl font-bold text-blue-600">1</span>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">Upload Image</h3>
                  <p className="text-sm text-gray-600">Drag & drop or click to upload your image file</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl font-bold text-green-600">2</span>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">Convert to SVG</h3>
                  <p className="text-sm text-gray-600">Click convert and wait for processing to complete</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl font-bold text-purple-600">3</span>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">Download Result</h3>
                  <p className="text-sm text-gray-600">Download your SVG file or copy the code</p>
                </div>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 bg-red-50/95 backdrop-blur-sm border border-red-200 rounded-2xl p-3 shadow-lg">
              <div className="flex items-start sm:items-center space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-red-800">Conversion Error</h3>
                  <p className="text-xs text-red-700 mt-1 break-words">{error}</p>
                </div>
              </div>
            </div>
          )}

        {/* Bulk Mode Toggle */}
        <div className="mb-4 flex justify-center">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-2 border border-white/40 shadow-lg">
            <div className="flex space-x-1">
              <button
                onClick={() => setUseBulkMode(false)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  !useBulkMode
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                Single Image
              </button>
              <button
                onClick={() => setUseBulkMode(true)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  useBulkMode
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                Bulk Convert (New!)
              </button>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6 mb-4 main-grid items-stretch">
          {/* Left Panel - Image Upload */}
          <div className="h-full flex flex-col">
            <div className="bg-white/80 backdrop-blur-md rounded-2xl lg:rounded-3xl shadow-2xl border border-white/40 p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-center sm:text-left">
                  <h2 className="text-xl font-bold text-gray-900">
                    {useBulkMode ? 'Original Images' : 'Original Image'}
                  </h2>
                  <p className="text-xs text-gray-600 mt-1">
                    {useBulkMode ? 'Upload multiple images to convert' : 'Upload your image to convert'}
                  </p>
                </div>
              </div>
              
              {useBulkMode ? (
                <BulkImageUploader 
                  onImagesSelect={setImages} 
                  onClear={() => {
                    setImages([]);
                    setConversionResults([]);
                  }}
                  currentImages={images}
                  isProcessing={isBulkProcessing}
                />
              ) : (
                <ImageUploader 
                  onImageSelect={setImage} 
                  onClear={handleClearImage}
                  currentImage={image}
                />
              )}
              
              {/* Bulk Conversion Queue */}
              {useBulkMode && images.length > 0 && (
                <div className="mt-4">
                  <ConversionQueue
                    files={images}
                    onConversionComplete={setConversionResults}
                    onQueueUpdate={() => {}}
                    conversionSettings={conversionSettings}
                    onProcessingStateChange={setIsBulkProcessing}
                  />
                </div>
              )}
              

              
              {/* Usage Instructions */}
              <div className="hidden">
                  <div className="flex items-start space-x-2">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Quick Tips:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Drag & drop images directly onto the upload area</li>
                        <li>• Press <kbd className="px-1 py-0.5 bg-blue-200 rounded text-xs">Ctrl+V</kbd> to paste from clipboard</li>
                        <li>• Supported formats: JPG, PNG, GIF, BMP, WebP</li>
                        <li>• Maximum file size: 10MB for best results</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                {image && (
                  <div className="mt-4 space-y-3">
                    {/* Action Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={handleConvert}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                      >
                        {loading ? (
                          <div className="flex items-center justify-center space-x-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                            <span>Converting...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center space-x-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span>Convert to SVG</span>
                          </div>
                        )}
                      </button>
                      
                      <button
                        onClick={handleClearImage}
                        className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-4 rounded-xl font-bold hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Clear Image</span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - SVG Preview */}
            <div className="h-full flex flex-col">
              <div className="bg-white/80 backdrop-blur-md rounded-2xl lg:rounded-3xl shadow-2xl border border-white/40 p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-center sm:text-left">
                    <h2 className="text-xl font-bold text-gray-900">SVG Preview</h2>
                    <p className="text-xs text-gray-600 mt-1">Your converted vector graphic</p>
                  </div>
                </div>

                <div className="border-2 border-dashed border-gray-300/60 rounded-xl sm:rounded-2xl p-3 sm:p-4 min-h-40 sm:min-h-48 flex items-center justify-center bg-gray-50/60 backdrop-blur-sm">
                  {loading ? (
                    <div className="text-center space-y-3">
                      <div className="relative">
                        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                        <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-blue-400 rounded-full animate-spin mx-auto" style={{ animationDelay: '0.5s' }}></div>
                      </div>
                      <div>
                        <p className="text-base font-bold text-gray-700">Converting...</p>
                        <p className="text-xs text-gray-500 mt-1">This may take a few moments</p>
                      </div>
                    </div>
                  ) : useBulkMode && conversionResults.length > 0 ? (
                    <div className="w-full space-y-4">
                      <div className="text-center mb-3">
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">
                          {conversionResults.length} SVG{conversionResults.length !== 1 ? 's' : ''} Converted
                        </h3>
                        <p className="text-sm text-gray-600">Preview your converted vector graphics</p>
                      </div>
                      
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {memoizedConversionResults.map((result, index) => (
                          <div key={index} className="bg-white/95 backdrop-blur-sm border border-gray-200/60 rounded-xl p-3 shadow-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-medium text-gray-800 truncate" title={result.fileName}>
                                {result.fileName.replace(/\.[^/.]+$/, '.svg')}
                              </h4>
                              <span className="text-xs text-gray-500">#{index + 1}</span>
                            </div>
                            <div 
                              className="w-full h-32 flex items-center justify-center bg-white rounded-lg border border-gray-100 overflow-hidden"
                              style={{ 
                                minHeight: '128px',
                                aspectRatio: 'auto'
                              }}
                            >
                              <div 
                                dangerouslySetInnerHTML={{ __html: result.renderedSVG }} 
                                className="w-full h-full flex items-center justify-center"
                                style={{ 
                                  backgroundColor: 'white',
                                  minWidth: '120px',
                                  minHeight: '120px',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '6px',
                                  objectFit: 'contain',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="text-center mb-4">
                        <p className="text-sm text-gray-600 mb-3">
                          All conversions completed successfully!
                        </p>
                        
                        {/* ZIP Downloader integrated into the right panel */}
                        <ZipDownloader
                          conversionResults={conversionResults}
                          isVisible={true}
                        />
                        
                        {/* Share Button for bulk results */}
                        <div className="mt-4">
                          <ShareButton 
                            svgContent={createCombinedSVG(conversionResults)}
                            fileName={`bulk-conversion-${conversionResults.length}-files.svg`}
                          />
                        </div>
                      </div>
                    </div>
                  ) : svg ? (
                    <div className="w-full space-y-4">
                      <div className="bg-white/95 backdrop-blur-sm border border-gray-200/60 rounded-2xl p-3 shadow-lg">
                        <div 
                          className="w-full h-40 flex items-center justify-center bg-white rounded-xl border border-gray-100 overflow-hidden"
                          style={{ 
                            minHeight: '160px',
                            aspectRatio: 'auto'
                          }}
                        >
                          <div 
                            dangerouslySetInnerHTML={{ __html: memoizedSVG || '' }} 
                            className="w-full h-full flex items-center justify-center"
                            style={{ 
                              backgroundColor: 'white',
                              minWidth: '150px',
                              minHeight: '150px',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              objectFit: 'contain',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <button
                          onClick={handleDownload}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2 px-4 rounded-2xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 text-xs"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>Download SVG</span>
                        </button>
                        
                        <button
                          onClick={() => setShowSvgEditor(true)}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 px-4 rounded-2xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 text-xs"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span>Edit SVG</span>
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          onClick={handleCopyCode}
                          className={`py-2 px-4 rounded-2xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 text-xs ${
                            copySuccess 
                              ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white' 
                              : 'bg-gray-600 text-white hover:bg-gray-700'
                          }`}
                        >
                          {copySuccess ? (
                            <>
                              <svg className="w-4 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              <span>Copy Code</span>
                            </>
                          )}
                        </button>
                        
                        <ShareButton 
                          svgContent={svg} 
                          fileName={image?.name || 'converted.svg'}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-3">
                      <div className="text-4xl lg:text-5xl text-gray-300">🎨</div>
                      <div>
                        <p className="text-lg font-bold text-gray-500">
                          {useBulkMode ? 'Ready for bulk conversion' : 'SVG preview will appear here'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {useBulkMode ? 'Upload images and start converting to see results here' : 'Upload an image and convert it to see the result'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* Benefits Section */}
      <div className="relative z-10 bg-white/90 backdrop-blur-md py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
              Why Use Our SVG Converter?
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Discover the advantages of converting your images to scalable vector graphics
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Lightning Fast</h3>
              <p className="text-gray-600">Convert images to SVG in seconds, not minutes. Our optimized algorithms ensure quick processing.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">100% Private</h3>
              <p className="text-gray-600">Your images never leave your browser. All processing happens locally for complete privacy.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Completely Free</h3>
              <p className="text-gray-600">No hidden costs, no watermarks, no limitations. Convert as many images as you want.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">High Quality</h3>
              <p className="text-gray-600">Advanced vectorization algorithms ensure your SVGs maintain crisp quality at any size.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Mobile Friendly</h3>
              <p className="text-gray-600">Works perfectly on all devices - desktop, tablet, and mobile. Convert images anywhere.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Multiple Formats</h3>
              <p className="text-gray-600">Support for JPG, PNG, GIF, BMP, and WebP. Convert any image format to SVG.</p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="relative z-10 bg-gray-50/80 backdrop-blur-md py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600">
              Everything you need to know about converting images to SVG
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Is this tool really free?</h3>
              <p className="text-gray-600">Yes! Our image to SVG converter is completely free to use. No registration required, no hidden costs, and no watermarks on your converted files.</p>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Do you store my images?</h3>
              <p className="text-gray-600">No, we never store your images. All processing happens locally in your browser, ensuring complete privacy and security of your files.</p>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">What image formats are supported?</h3>
              <p className="text-gray-600">We support JPG, JPEG, PNG, GIF, BMP, and WebP formats. Simply upload any of these image types and convert them to SVG.</p>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Can I edit the SVG after conversion?</h3>
              <p className="text-gray-600">Absolutely! SVGs are fully editable vector files. You can open them in Adobe Illustrator, Figma, Inkscape, or any vector graphics editor.</p>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Why should I convert to SVG?</h3>
              <p className="text-gray-600">SVGs are scalable without quality loss, have smaller file sizes, and are perfect for logos, icons, and web graphics. They also work great with cutting machines like Cricut.</p>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">How long does conversion take?</h3>
              <p className="text-gray-600">Most images convert in under 10 seconds. Complex images with many colors may take a bit longer, but our optimized algorithms ensure fast processing.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Always at Bottom */}
      <div className="relative z-10 flex-shrink-0">
        {/* Glass effect background */}
        <div className="iphone-glass-gradient rounded-t-3xl">
          {/* Content */}
          <div className="text-center text-gray-700 text-xs sm:text-sm px-6 sm:px-8 py-6 sm:py-8">
            <p className="leading-relaxed font-medium">
              Powered by <span className="font-bold text-gray-700">
              <a href="https://x.com/nikunj_rohit10" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 transition-colors">@nikunj_rohit10</a>
                </span> with ❤️ 
              <a href="https://github.com/nik132-eng/img-to-svg" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:text-gray-800 transition-colors"> GitHub</a>
              <span className="hidden sm:inline"> Supports multiple image formats • Optimized SVG output</span>
              <span className="sm:hidden"> Multiple formats • Optimized output</span>
            </p>
          </div>
        </div>
      </div>

      {/* Conversion Settings Modal */}
      <ChunkErrorBoundary fallback={<div className="p-4 bg-gray-100 rounded animate-pulse">Settings failed to load</div>}>
        <React.Suspense fallback={<div className="p-4 bg-gray-100 rounded animate-pulse">Loading settings...</div>}>
          <LazyConversionSettings
            onSettingsChange={setConversionSettings}
            isOpen={showSettings}
            onToggle={() => setShowSettings(!showSettings)}
          />
        </React.Suspense>
      </ChunkErrorBoundary>



      {/* Structured Data: WebApplication */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'Free Image to SVG Converter Online',
            description: 'Convert JPG, PNG, or GIF images to SVG vector format online for free. No software needed. Fast, easy, and privacy-friendly.',
            applicationCategory: 'MultimediaApplication',
            operatingSystem: 'Any',
            browserRequirements: 'Requires JavaScript. Requires HTML5.',
            offers: { 
              '@type': 'Offer', 
              price: '0', 
              priceCurrency: 'USD',
              description: 'Completely free to use'
            },
            url: '/',
            author: {
              '@type': 'Person',
              name: 'Nikunj Rohit',
              url: 'https://x.com/nikunj_rohit10'
            },
            featureList: [
              'Convert JPG to SVG',
              'Convert PNG to SVG', 
              'Convert GIF to SVG',
              'Convert BMP to SVG',
              'Convert WebP to SVG',
              'Free online tool',
              'No registration required',
              'Privacy-focused processing',
              'High-quality vectorization',
              'Mobile-friendly interface'
            ],
            screenshot: '/og-image.png',
            softwareVersion: '1.0',
            releaseNotes: 'Free online image to SVG converter with advanced vectorization algorithms'
          }),
        }}
      />

      {/* Structured Data: HowTo */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'HowTo',
            name: 'How to convert an image to SVG online',
            description: 'Use this free online tool to convert PNG, JPG, JPEG, GIF, BMP, or WebP images into scalable SVG vector graphics.',
            totalTime: 'PT1M',
            estimatedCost: {
              '@type': 'MonetaryAmount',
              currency: 'USD',
              value: '0'
            },
            step: [
              {
                '@type': 'HowToStep',
                name: 'Upload your image',
                text: 'Click Upload and choose a PNG, JPG, JPEG, GIF, BMP, or WebP file, or paste an image from your clipboard.',
                image: '/og-image.png'
              },
              {
                '@type': 'HowToStep',
                name: 'Adjust settings (optional)',
                text: 'Open Advanced Settings to fine‑tune color precision, speckle filter, and tracing mode for best results.',
                image: '/og-image.png'
              },
              {
                '@type': 'HowToStep',
                name: 'Convert to SVG',
                text: 'Press Convert to SVG and wait a moment for vectorization to complete.',
                image: '/og-image.png'
              },
              {
                '@type': 'HowToStep',
                name: 'Download or copy code',
                text: 'Preview the result, then download the SVG file or copy the SVG code to your clipboard.',
                image: '/og-image.png'
              },
            ],
          }),
        }}
      />

      {/* Structured Data: FAQPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'Is this tool really free?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes! Our image to SVG converter is completely free to use. No registration required, no hidden costs, and no watermarks on your converted files.',
                },
              },
              {
                '@type': 'Question',
                name: 'Do you store my images?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'No, we never store your images. All processing happens locally in your browser, ensuring complete privacy and security of your files.',
                },
              },
              {
                '@type': 'Question',
                name: 'What image formats are supported?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'We support JPG, JPEG, PNG, GIF, BMP, and WebP formats. Simply upload any of these image types and convert them to SVG.',
                },
              },
              {
                '@type': 'Question',
                name: 'Can I edit the SVG after conversion?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Absolutely! SVGs are fully editable vector files. You can open them in Adobe Illustrator, Figma, Inkscape, or any vector graphics editor.',
                },
              },
              {
                '@type': 'Question',
                name: 'Why should I convert to SVG?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'SVGs are scalable without quality loss, have smaller file sizes, and are perfect for logos, icons, and web graphics. They also work great with cutting machines like Cricut.',
                },
              },
              {
                '@type': 'Question',
                name: 'How long does conversion take?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Most images convert in under 10 seconds. Complex images with many colors may take a bit longer, but our optimized algorithms ensure fast processing.',
                },
              },
            ],
          }),
        }}
      />
      
      {/* Performance Monitor - Development Only */}
      {/* {process.env.NODE_ENV === 'development' && (
        <React.Suspense fallback={null}>
          <PerformanceMonitor />
        </React.Suspense>
      )} */}

      {/* SVG Editor */}
      {svg && (
        <ChunkErrorBoundary fallback={<div>Editor failed to load</div>}>
          <React.Suspense fallback={null}>
            <LazySvgEditor
              svgContent={svg}
              onSvgChange={setSvg}
              isOpen={showSvgEditor}
              onToggle={() => setShowSvgEditor(!showSvgEditor)}
            />
          </React.Suspense>
        </ChunkErrorBoundary>
      )}
    </div>
  );
}
