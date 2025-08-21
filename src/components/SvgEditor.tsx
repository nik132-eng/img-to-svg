'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { optimize } from 'svgo';

interface SvgEditorProps {
  svgContent: string;
  onSvgChange: (newSvg: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function SvgEditor({ svgContent, onSvgChange, isOpen, onToggle }: SvgEditorProps) {
  const [svgCode, setSvgCode] = useState(svgContent);
  const [simplificationLevel, setSimplificationLevel] = useState(1);
  const [optimizedSize, setOptimizedSize] = useState<{ original: number; optimized: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isValidSvg, setIsValidSvg] = useState(true);
  const previewRef = useRef<HTMLDivElement>(null);

  // Update code when SVG content changes from parent
  useEffect(() => {
    setSvgCode(svgContent);
    setError(null);
    setIsValidSvg(true);
  }, [svgContent]);

  // Validate SVG and update preview
  const validateAndUpdateSvg = useCallback((code: string) => {
    try {
      // Basic SVG validation
      if (!code.includes('<svg') || !code.includes('</svg>')) {
        setIsValidSvg(false);
        setError('Invalid SVG format');
        return false;
      }

      // Try to parse the SVG
      const parser = new DOMParser();
      const doc = parser.parseFromString(code, 'image/svg+xml');
      const svgElement = doc.querySelector('svg');
      
      if (!svgElement) {
        setIsValidSvg(false);
        setError('Could not parse SVG');
        return false;
      }

      // Check for parsing errors
      const parseError = doc.querySelector('parsererror');
      if (parseError) {
        setIsValidSvg(false);
        setError('SVG parsing error');
        return false;
      }

      setIsValidSvg(true);
      setError(null);
      
      // Update the preview
      if (previewRef.current) {
        previewRef.current.innerHTML = code;
      }

      // Update parent component
      onSvgChange(code);
      
      return true;
    } catch {
      setIsValidSvg(false);
      setError('Invalid SVG code');
      return false;
    }
  }, [onSvgChange]);

  // Handle code changes
  const handleCodeChange = (newCode: string) => {
    setSvgCode(newCode);
    
    // Debounce validation to avoid excessive updates
    const timeoutId = setTimeout(() => {
      validateAndUpdateSvg(newCode);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  // Optimize SVG
  const optimizeSvg = () => {
    try {
      const result = optimize(svgCode, {
        plugins: [
          {
            name: 'convertPathData',
            params: {
              floatPrecision: simplificationLevel
            }
          },
          {
            name: 'convertTransform',
            params: {
              floatPrecision: simplificationLevel
            }
          },
          {
            name: 'removeComments'
          },
          {
            name: 'removeEmptyAttrs'
          },
          {
            name: 'removeEmptyText'
          },
          {
            name: 'removeHiddenElems'
          },
          {
            name: 'removeEmptyContainers'
          }
        ]
      });

      if (result.data) {
        const originalSize = new Blob([svgCode]).size;
        const optimizedSize = new Blob([result.data]).size;
        
        setOptimizedSize({
          original: originalSize,
          optimized: optimizedSize
        });

        setSvgCode(result.data);
        validateAndUpdateSvg(result.data);
      }
    } catch (error) {
      console.error('Error optimizing SVG:', error);
      setError('Failed to optimize SVG');
    }
  };

  // Prettify SVG code
  const prettifySvg = () => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgCode, 'image/svg+xml');
      const serializer = new XMLSerializer();
      const prettySvg = serializer.serializeToString(doc);
      
      // Basic formatting (add line breaks and indentation)
      const formatted = prettySvg
        .replace(/></g, '>\n<')
        .replace(/^<svg/, '<svg')
        .split('\n')
        .map((line) => {
          if (line.includes('<svg')) return line;
          if (line.includes('</svg>')) return line;
          if (line.trim().startsWith('<')) {
            const depth = line.match(/^(\s*)/)?.[1]?.length || 0;
            return '  '.repeat(depth + 1) + line.trim();
          }
          return line;
        })
        .join('\n');

      setSvgCode(formatted);
      validateAndUpdateSvg(formatted);
    } catch (error) {
      console.error('Error prettifying SVG:', error);
      setError('Failed to prettify SVG');
    }
  };

  // Clear SVG
  const clearSvg = () => {
    setSvgCode('');
    setError(null);
    setIsValidSvg(false);
    if (previewRef.current) {
      previewRef.current.innerHTML = '';
    }
  };

  // Reset to original
  const resetToOriginal = () => {
    setSvgCode(svgContent);
    setError(null);
    setIsValidSvg(true);
    validateAndUpdateSvg(svgContent);
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-6 left-6 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 z-50"
        title="Edit SVG"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">SVG Editor</h2>
            <button
              onClick={onToggle}
              className="text-white hover:text-blue-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex h-full">
          {/* Left Panel - Code Editor */}
          <div className="w-1/2 bg-gray-900 p-4 flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4 text-white">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm font-mono">SVG Code Editor</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {optimizedSize && (
                  <div className="text-xs bg-green-600 px-2 py-1 rounded">
                    {Math.round((optimizedSize.original - optimizedSize.optimized) / optimizedSize.original * 100)}% smaller
                  </div>
                )}
                <button
                  onClick={optimizeSvg}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  Optimize
                </button>
                <button
                  onClick={prettifySvg}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  Prettify
                </button>
                <button
                  onClick={clearSvg}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Path Simplification Control */}
            <div className="mb-4 p-3 bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between text-white text-sm mb-2">
                <span>Path Precision: {simplificationLevel}</span>
                <span className="text-gray-400">High Detail ← → Low Detail</span>
              </div>
              <input
                type="range"
                min="0"
                max="3"
                step="0.5"
                value={simplificationLevel}
                onChange={(e) => setSimplificationLevel(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-3 bg-red-900 text-red-100 rounded-lg text-sm">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Code Editor */}
            <div className="flex-1 bg-gray-800 rounded-lg p-4 overflow-hidden">
              <textarea
                value={svgCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                className="w-full h-full bg-gray-800 text-green-400 font-mono text-sm resize-none outline-none border-none"
                placeholder="Paste your SVG code here..."
                spellCheck={false}
              />
            </div>

            {/* Actions */}
            <div className="mt-4 flex space-x-2">
              <button
                onClick={resetToOriginal}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Reset to Original
              </button>
              <button
                onClick={() => onSvgChange(svgCode)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Apply Changes
              </button>
            </div>
          </div>

          {/* Right Panel - SVG Preview */}
          <div className="w-1/2 bg-white p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">SVG Preview</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {svgCode ? `${new Blob([svgCode]).size} bytes` : '0 bytes'}
                </span>
              </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 overflow-auto">
              <div 
                ref={previewRef}
                className="w-full h-full flex items-center justify-center p-4"
                dangerouslySetInnerHTML={{ __html: svgCode }}
              />
              {!svgCode && (
                <div className="text-center text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-lg font-medium">SVG Preview</p>
                  <p className="text-sm">Edit the code on the left to see changes here</p>
                </div>
              )}
            </div>

            {/* Status */}
            <div className="mt-4 p-3 bg-gray-100 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  Status: {isValidSvg ? 'Valid SVG' : 'Invalid SVG'}
                </span>
                {svgCode && (
                  <span className="text-gray-500">
                    Elements: {(svgCode.match(/<[^>]+>/g) || []).length}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
