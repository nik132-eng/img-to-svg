"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import React from "react";

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  onClear?: () => void;
  currentImage?: File | null;
}

export function ImageUploader({
  onImageSelect,
  onClear,
  currentImage,
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(
    currentImage ? URL.createObjectURL(currentImage) : null
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        onImageSelect(file);
        
        // Create preview
        if (preview) {
          URL.revokeObjectURL(preview);
        }
        const newPreview = URL.createObjectURL(file);
        setPreview(newPreview);
      }
    },
    [onImageSelect, preview]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      accept: { "image/*": [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"] },
      onDrop,
      multiple: false,
      maxSize: 10 * 1024 * 1024, // 10MB
    });

  const handleClear = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
    if (onClear) {
      onClear();
    }
  };

  // Sync preview with currentImage prop
  React.useEffect(() => {
    if (currentImage) {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
      const newPreview = URL.createObjectURL(currentImage);
      setPreview(newPreview);
    } else {
      if (preview) {
        URL.revokeObjectURL(preview);
        setPreview(null);
      }
    }
  }, [currentImage]);

  // Cleanup preview URL when component unmounts
  React.useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  return (
    <>
      {/* Enhanced Drop Zone - Matching BulkImageUploader Design */}
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-2xl p-6 transition-all duration-300 ${
          isDragActive
            ? "border-blue-500 bg-blue-50/50"
            : "border-gray-300/60 bg-gray-50/30"
        } ${isDragReject ? "border-red-400 bg-red-50/50" : ""}`}
      >
        <input {...getInputProps()} />
        
        <div className="text-center space-y-3">
          {!preview ? (
            <>
              <div className="text-4xl lg:text-5xl text-gray-300">📁</div>
              <div>
                <p className="text-lg font-bold text-gray-500">
                  {isDragActive ? "Drop image here" : "Drag & drop image here"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  or click to browse files
                </p>
              </div>
              <p className="text-xs text-gray-400">
                Supports JPG, PNG, GIF, BMP, WebP • Max 10MB
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto bg-green-100/80 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-700">
                  1 image ready
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {isDragActive ? "Drop new image here" : "Drag new image or click to replace"}
                </p>
              </div>
              <p className="text-xs text-gray-400">
                1/1 file • 10MB max
              </p>
            </>
          )}
        </div>
      </div>

      {/* Image Preview */}
      {preview && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">
              Selected Image
            </h3>
            <button
              onClick={handleClear}
              className="text-red-600 hover:text-red-700 text-sm font-medium hover:bg-red-50 px-2 py-1 rounded-md transition-colors"
            >
              Clear Image
            </button>
          </div>
          
          <div className="bg-white/95 backdrop-blur-sm border border-gray-200/60 rounded-xl p-3 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start space-x-3">
              {/* Image Preview */}
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Image
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-cover rounded-lg"
                  width={48}
                  height={48}
                />
              </div>
              
              {/* Image Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate" title={currentImage?.name}>
                  {currentImage?.name || 'Image'}
                </p>
                <p className="text-xs text-gray-500">
                  {(currentImage?.size || 0) / 1024 / 1024 > 1 
                    ? `${((currentImage?.size || 0) / 1024 / 1024).toFixed(2)} MB`
                    : `${Math.round((currentImage?.size || 0) / 1024)} KB`
                  }
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Ready
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
