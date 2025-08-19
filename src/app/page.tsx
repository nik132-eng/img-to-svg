'use client';

import { useState, useEffect } from 'react';
import { ImageUploader } from '@/components/ImageUploader';
import { ThreeBackground } from '@/components/ThreeBackground';
import { VisitorCounter } from '@/components/VisitorCounter';
import { ConversionSettings, ConversionSettings as ConversionSettingsType } from '@/components/ConversionSettings';

export default function HomePage() {
  const [image, setImage] = useState<File | null>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
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
    setSvg(null);
    setError(null);
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

  const renderSVG = (svgContent: string) => {
    try {
      console.log('renderSVG called with content length:', svgContent.length);
      console.log('SVG content preview:', svgContent.substring(0, 200) + '...');
      
      // Create a temporary div to parse and validate the SVG
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = svgContent;
      
      // Check if we have a valid SVG element
      const svgElement = tempDiv.querySelector('svg');
      if (!svgElement) {
        console.error('No SVG element found in content');
        throw new Error('Invalid SVG content');
      }
      
      console.log('SVG element found:', svgElement);

      // Preserve original viewBox if it exists
      const originalViewBox = svgElement.getAttribute('viewBox');
      
      // Set proper styling for the SVG to prevent stretching
      svgElement.style.width = '100%';
      svgElement.style.height = '100%';
      svgElement.style.maxWidth = '100%';
      svgElement.style.maxHeight = '100%';
      svgElement.style.objectFit = 'contain';
      svgElement.style.overflow = 'visible';
      svgElement.style.display = 'block';
      svgElement.style.margin = '0 auto';
      
      // Ensure viewBox is set for proper scaling
      if (!originalViewBox) {
        // Try to get dimensions from the SVG content
        const width = svgElement.getAttribute('width');
        const height = svgElement.getAttribute('height');
        
        if (width && height && !isNaN(Number(width)) && !isNaN(Number(height))) {
          svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
        } else {
          // Fallback to default viewBox
          svgElement.setAttribute('viewBox', '0 0 100 100');
        }
      }

      // Add a white background to make the SVG visible
      svgElement.style.backgroundColor = 'white';
      
      // Ensure the SVG container has proper dimensions and aspect ratio
      svgElement.style.minWidth = '200px';
      svgElement.style.minHeight = '200px';
      
      // Preserve aspect ratio
      svgElement.style.aspectRatio = 'auto';
      svgElement.style.objectFit = 'contain';

      return tempDiv.innerHTML;
    } catch (err) {
      console.error('SVG rendering error:', err);
      // Return a fallback SVG if rendering fails
      return `<svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%; object-fit: contain; aspect-ratio: auto;">
        <rect width="100%" height="100%" fill="white"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#666" font-family="Arial, sans-serif" font-size="14">
          SVG Preview
        </text>
      </svg>`;
    }
  };

  return (
    <div className="relative overflow-hidden w-full App min-h-screen flex flex-col">
      {/* Three.js Background */}
      <ThreeBackground />
      
      {/* Content Overlay */}
      <div className="relative z-10 flex-1 flex flex-col bg-transparent content-overlay">
        {/* Header */}
        <div className="bg-white/70 backdrop-blur-md shadow-lg border-b border-white/30 w-full header flex-shrink-0">
          <div className="w-full px-3 sm:px-4 lg:px-6 py-2 sm:py-3">
            <div className="flex items-center justify-between">
              {/* Left side - Logo and Title */}
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 overflow-hidden">
                  <img
                    src="/paint-palette.gif"
                    alt="Image to SVG Converter logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-800 leading-tight">
                    Image to SVG Converter
                  </h1>
                </div>
              </div>
              
              {/* Right side - Visitor Count */}
              <VisitorCounter />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4 main-content">
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

          {/* Main Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6 mb-4 main-grid">
            {/* Left Panel - Image Upload */}
            <div className="space-y-4">
              <div className="bg-white/80 backdrop-blur-md rounded-2xl lg:rounded-3xl shadow-2xl border border-white/40 p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gray-700 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-center sm:text-left">
                    <h2 className="text-xl font-bold text-gray-900">Original Image</h2>
                    <p className="text-xs text-gray-600 mt-1">Upload your image to convert</p>
                  </div>
                </div>
                
                <ImageUploader 
                  onImageSelect={setImage} 
                  onClear={handleClearImage}
                  currentImage={image}
                />
                
                {image && (
                  <div className="mt-3 sm:mt-4 space-y-3">
                    {/* Action Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      <button
                        onClick={handleConvert}
                        disabled={loading}
                        className="w-full bg-gray-700 text-white py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl sm:rounded-2xl font-bold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl text-xs sm:text-sm"
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
                        className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl sm:rounded-2xl font-bold hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl text-xs sm:text-sm"
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
            <div className="space-y-4">
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
                            dangerouslySetInnerHTML={{ __html: renderSVG(svg) }} 
                            className="w-full h-full flex items-center justify-center"
                            style={{ 
                              backgroundColor: 'white',
                              minWidth: '150px',
                              minHeight: '150px',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              objectFit: 'contain',
                              aspectRatio: 'auto'
                            }}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                          onClick={handleCopyCode}
                          className={`py-2 px-4 rounded-2xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 text-xs ${
                            copySuccess 
                              ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white' 
                              : 'bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:from-gray-700 hover:to-gray-800'
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
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-3">
                      <div className="text-4xl lg:text-5xl text-gray-300">🎨</div>
                      <div>
                        <p className="text-lg font-bold text-gray-500">SVG preview will appear here</p>
                        <p className="text-xs text-gray-400 mt-1">Upload an image and convert it to see the result</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
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
              Powered by <span className="font-bold text-gray-700">Nikunj Rohit</span> with ❤️ • 
              <span className="hidden sm:inline"> Supports multiple image formats • Optimized SVG output</span>
              <span className="sm:hidden"> Multiple formats • Optimized output</span>
            </p>
          </div>
        </div>
      </div>

      {/* Conversion Settings Modal */}
      <ConversionSettings
        onSettingsChange={setConversionSettings}
        isOpen={showSettings}
        onToggle={() => setShowSettings(!showSettings)}
      />

      {/* Structured Data: SoftwareApplication */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'Image to SVG Converter',
            applicationCategory: 'MultimediaApplication',
            operatingSystem: 'Web',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            url: '/',
            description:
              'Free online image to SVG converter. Instantly vectorize PNG, JPG, GIF, BMP, and WebP images to clean, scalable SVGs.',
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
            description:
              'Use this free online tool to convert PNG, JPG, JPEG, GIF, BMP, or WebP images into scalable SVG vector graphics.',
            totalTime: 'PT1M',
            step: [
              {
                '@type': 'HowToStep',
                name: 'Upload your image',
                text: 'Click Upload and choose a PNG, JPG, JPEG, GIF, BMP, or WebP file, or paste an image from your clipboard.',
              },
              {
                '@type': 'HowToStep',
                name: 'Adjust settings (optional)',
                text: 'Open Advanced Settings to fine‑tune color precision, speckle filter, and tracing mode for best results.',
              },
              {
                '@type': 'HowToStep',
                name: 'Convert to SVG',
                text: 'Press Convert to SVG and wait a moment for vectorization to complete.',
              },
              {
                '@type': 'HowToStep',
                name: 'Download or copy code',
                text: 'Preview the result, then download the SVG file or copy the SVG code to your clipboard.',
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
                name: 'What is an SVG file?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text:
                    'SVG (Scalable Vector Graphics) is a vector image format that scales without losing quality and is ideal for logos, icons, and illustrations.',
                },
              },
              {
                '@type': 'Question',
                name: 'Why convert PNG or JPG to SVG?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text:
                    'SVGs remain crisp at any size, can be edited in vector design tools, and often have smaller file sizes compared to raster images.',
                },
              },
              {
                '@type': 'Question',
                name: 'Can I edit the SVG after conversion?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text:
                    'Yes. You can open the SVG in tools like Adobe Illustrator, Figma, or Inkscape, or edit the XML directly in a code editor.',
                },
              },
            ],
          }),
        }}
      />
    </div>
  );
}
