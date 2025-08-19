'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import React from 'react';

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  onClear?: () => void;
  currentImage?: File | null;
}

export function ImageUploader({ onImageSelect, currentImage }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'] },
    onDrop: acceptedFiles => {
      const file = acceptedFiles[0];
      if (file) {
        setPreview(URL.createObjectURL(file));
        onImageSelect(file);
      }
    },
    multiple: false,
    maxSize: 4 * 1024 * 1024 // 4MB
  });

  // Update preview when currentImage changes
  React.useEffect(() => {
    if (currentImage) {
      setPreview(URL.createObjectURL(currentImage));
    } else {
      setPreview(null);
    }
  }, [currentImage]);

  return (
    <div className="w-full space-y-3">
      <div 
        {...getRootProps()} 
        className={`relative border-2 border-dashed rounded-2xl p-4 sm:p-6 text-center cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
          isDragActive 
            ? 'border-blue-500 bg-blue-50/80 backdrop-blur-sm shadow-lg shadow-blue-100' 
            : isDragReject
            ? 'border-red-500 bg-red-50/80 backdrop-blur-sm'
            : 'border-gray-300/60 hover:border-blue-400 hover:bg-gray-50/80 backdrop-blur-sm'
        }`}
      >
        <input {...getInputProps()} />
        
        {preview ? (
          <div className="space-y-2">
            <div className="relative group">
              <img 
                src={preview} 
                alt="Preview" 
                className="max-h-28 sm:max-h-36 mx-auto rounded-lg shadow-lg transition-transform duration-300 group-hover:scale-105 object-contain" 
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 rounded-lg flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white bg-opacity-90 rounded-full p-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Click or drag to replace image</p>
              <div className="text-xs text-gray-500 bg-gray-100 rounded-full px-2 sm:px-3 py-1 inline-block">
                Image uploaded successfully
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {/* Professional Upload Area */}
            <div className="relative">
              <div className={`w-14 h-14 sm:w-18 sm:h-18 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg transition-transform duration-300 ${isDragActive ? 'scale-110' : ''}`}>
                <svg className="w-7 h-7 sm:w-9 sm:h-9 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              
              {/* Animated Background Elements */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-2 left-2 w-4 h-4 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
                <div className="absolute top-3 right-3 w-3 h-3 bg-indigo-300 rounded-full opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute bottom-2 left-3 w-2 h-2 bg-purple-200 rounded-full opacity-25 animate-pulse" style={{ animationDelay: '2s' }}></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className={`text-lg sm:text-xl font-bold transition-colors duration-300 ${
                isDragActive ? 'text-gray-600' : isDragReject ? 'text-red-600' : 'text-gray-800'
              }`}>
                {isDragActive 
                  ? 'DROP YOUR IMAGE HERE!' 
                  : isDragReject 
                  ? 'INVALID FILE TYPE'
                  : 'DRAG IMAGE HERE TO BEGIN'
                }
              </h3>
              
              {!isDragReject && (
                <p className="text-sm text-gray-600">or you can</p>
              )}
              
              {/* Upload Options */}
              {!isDragActive && !isDragReject && (
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-3">
                  <button className="bg-gradient-to-r from-gray-700 to-gray-800 text-white py-2.5 px-4 rounded-xl font-bold hover:from-gray-800 hover:to-gray-900 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2 text-xs sm:text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="hidden sm:inline">PICK IMAGE TO VECTORIZE</span>
                    <span className="sm:hidden">PICK IMAGE</span>
                  </button>
                  
                  <div className="flex items-center space-x-2 text-gray-600">
                    <span className="text-xs">or press</span>
                    <div className="flex items-center space-x-1">
                      <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs font-mono">CTRL</span>
                      <span className="text-gray-600">+</span>
                      <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs font-mono">V</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* File Type Icons - More Compact */}
              {!isDragActive && !isDragReject && (
                <div className="flex items-center justify-center space-x-2 sm:space-x-3 mt-3">
                  <div className="text-center">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-1">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                      </svg>
                    </div>
                    <span className="text-xs text-gray-600">PNG</span>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center mb-1">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                      </svg>
                    </div>
                    <span className="text-xs text-gray-600">JPG</span>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-1">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                      </svg>
                    </div>
                    <span className="text-xs text-gray-600">GIF</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Image Preview Section - More Compact */}
      {preview && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-white/40 shadow-lg">
          <div className="relative group">
            {/* Image Info */}
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
              <div className="bg-gray-50 rounded-lg px-2 py-1">
                <span className="font-medium">File:</span> {currentImage?.name || 'Unknown'}
              </div>
              <div className="bg-gray-50 rounded-lg px-2 py-1">
                <span className="font-medium">Size:</span> {currentImage ? `${(currentImage.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
