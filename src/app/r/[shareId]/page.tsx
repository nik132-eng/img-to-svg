'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface SharedSvgData {
  shareId: string;
  svgContent: string;
  fileName: string;
  createdAt: string;
  expiresAt: string;
}

export default function SharedSvgPage() {
  const params = useParams();
  const shareId = params.shareId as string;
  
  const [svgData, setSvgData] = useState<SharedSvgData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    const fetchSharedSvg = async () => {
      try {
        console.log(`🔍 Fetching shared SVG for ID: ${shareId}`);
        const response = await fetch(`/api/share?id=${shareId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            console.log(`❌ Share ID ${shareId} returned 404`);
            setError('This share link has expired or was not found. This commonly happens when the development server restarts.');
          } else {
            console.log(`❌ Share ID ${shareId} returned status: ${response.status}`);
            setError(`Failed to load shared SVG (HTTP ${response.status}).`);
          }
          return;
        }

        const data = await response.json();
        console.log(`✅ Successfully loaded share ID: ${shareId}`);
        setSvgData(data);
      } catch (error) {
        console.error('❌ Error fetching shared SVG:', error);
        setError('Failed to load shared SVG. Please check your internet connection and try again.');
      } finally {
        setLoading(false);
      }
    };

    if (shareId) {
      fetchSharedSvg();
    }
  }, [shareId]);

  const handleDownload = () => {
    if (!svgData) return;
    
    const blob = new Blob([svgData.svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = svgData.fileName.replace(/\.[^/.]+$/, '.svg') || 'shared.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyCode = async () => {
    if (!svgData) return;
    
    try {
      await navigator.clipboard.writeText(svgData.svgContent);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-400 rounded-full animate-spin mx-auto" style={{ animationDelay: '0.5s' }}></div>
          </div>
          <p className="text-lg font-medium text-gray-700">Loading shared SVG...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto px-4">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Link Not Found</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-2">
                <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Why did this happen?</p>
                  <ul className="mt-1 space-y-1 text-xs">
                    <li>• The development server may have restarted</li>
                    <li>• The share link has expired (24-hour limit)</li>
                    <li>• The original SVG was cleared from memory</li>
                  </ul>
                  <p className="mt-2 text-xs text-yellow-700">
                    <strong>Note:</strong> In production, share links are more reliable and persist longer.
                  </p>
                </div>
              </div>
            </div>
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

  if (!svgData) {
    return null;
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
                <p className="text-sm text-gray-600">File: {svgData.fileName.replace(/\.[^/.]+$/, '.svg')}</p>
              </div>
              
              <div className="bg-white rounded-2xl border border-gray-200 p-4 min-h-96 flex items-center justify-center overflow-hidden">
                <div 
                  dangerouslySetInnerHTML={{ __html: svgData.svgContent }}
                  className="w-full h-full flex items-center justify-center"
                  style={{ 
                    backgroundColor: 'white',
                    minWidth: '200px',
                    minHeight: '200px',
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
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* File Info */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/40 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">File Information</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Original Name</p>
                  <p className="text-sm font-medium text-gray-800">{svgData.fileName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Share ID</p>
                  <p className="text-sm font-mono text-gray-800 bg-gray-100 px-2 py-1 rounded">{svgData.shareId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="text-sm text-gray-800">{new Date(svgData.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Expires</p>
                  <p className="text-sm text-gray-800">{new Date(svgData.expiresAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

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
                  <span>Download SVG</span>
                </button>
                
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


          </div>
        </div>
      </div>
    </div>
  );
}
