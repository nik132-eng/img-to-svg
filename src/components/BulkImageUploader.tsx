"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import React from "react";

interface BulkImageUploaderProps {
  onImagesSelect: (files: File[]) => void;
  onClear?: () => void;
  currentImages?: File[];
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  isProcessing?: boolean; // Add this prop to know when conversion is running
}

interface FileWithPreview extends File {
  preview?: string;
  id: string;
  status: "ready" | "processing" | "completed" | "error";
  error?: string;
}

export function BulkImageUploader({
  onImagesSelect,
  onClear,
  currentImages = [],
  maxFiles = 20,
  maxFileSize = 4 * 1024 * 1024, // 4MB default
  isProcessing = false, // Add this prop
}: BulkImageUploaderProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const isUpdatingFromParent = React.useRef(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Check if we're already at max files
      if (files.length >= maxFiles) {
        return;
      }

      const newFiles: FileWithPreview[] = acceptedFiles
        .map((file) => {
          // Validate that file is actually a File object
          if (!(file instanceof File)) {
            console.warn("Invalid file object received:", file);
            return null;
          }

          try {
            // Create a proper FileWithPreview object that extends File
            const fileWithPreview = Object.assign(file, {
              id: Math.random().toString(36).substr(2, 9),
              preview: URL.createObjectURL(file),
              status: "ready" as const,
            }) as FileWithPreview;

            return fileWithPreview;
          } catch (error) {
            console.error(
              "Error creating object URL for file:",
              file.name,
              error
            );
            return null;
          }
        })
        .filter(Boolean) as FileWithPreview[]; // Remove null entries

      if (newFiles.length === 0) {
        return;
      }

      // Check if adding these files would exceed maxFiles
      setFiles((prev) => {
        if (prev.length + newFiles.length > maxFiles) {
          const remainingSlots = maxFiles - prev.length;
          const filesToAdd = newFiles.slice(0, remainingSlots);
          const updatedFiles = [...prev, ...filesToAdd];
          return updatedFiles;
        } else {
          const updatedFiles = [...prev, ...newFiles];
          return updatedFiles;
        }
      });
    },
    [maxFiles, files.length]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      accept: { "image/*": [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"] },
      onDrop,
      multiple: true,
      maxSize: maxFileSize,
      maxFiles: maxFiles,
      disabled: false, // Remove dependency on files.length
    });

  const removeFile = (fileId: string) => {
    setFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === fileId);
      if (fileToRemove && fileToRemove.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      const updatedFiles = prev.filter((f) => f.id !== fileId);
      return updatedFiles;
    });
  };

  const clearAllFiles = () => {
    // Clean up all preview URLs
    files.forEach((file) => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setFiles([]);
    if (onClear) {
      onClear();
    }
  };

  // Notify parent component when files change (but not when updating from parent)
  React.useEffect(() => {
    if (!isUpdatingFromParent.current) {
      onImagesSelect(files);
    }
    isUpdatingFromParent.current = false;
  }, [files, onImagesSelect]);

  // Update files when currentImages changes (only when it's actually different)
  React.useEffect(() => {
    if (currentImages && currentImages.length > 0) {
      // Use a more efficient comparison
      const currentFileCount = files.length;
      const newFileCount = currentImages.length;

      if (
        currentFileCount !== newFileCount ||
        currentImages.some(
          (file, index) => files[index]?.name !== file.name
        )
      ) {
        const newFiles: FileWithPreview[] = currentImages
          .map((file: File) => {
            // Validate that file is actually a File object
            if (!(file instanceof File)) {
              console.warn("Invalid file object in currentImages:", file);
              return null;
            }

            try {
              // Create a proper FileWithPreview object that extends File
              const fileWithPreview = Object.assign(file, {
                id: Math.random().toString(36).substr(2, 9),
                preview: URL.createObjectURL(file),
                status: "ready" as const,
              }) as FileWithPreview;

              return fileWithPreview;
            } catch (error) {
              console.error(
                "Error creating object URL for file in currentImages:",
                file.name,
                error
              );
              return null;
            }
          })
          .filter(Boolean) as FileWithPreview[]; // Remove null entries

        if (newFiles.length > 0) {
          isUpdatingFromParent.current = true;
          setFiles(newFiles);
        }
      }
    } else if (
      currentImages &&
      currentImages.length === 0 &&
              files.length > 0
    ) {
      isUpdatingFromParent.current = true;
      setFiles([]);
    }
  }, [currentImages, files]); // Only depend on currentImages

  // Cleanup object URLs when files change or component unmounts
  React.useEffect(() => {
    // Store current files for cleanup
    const currentFiles = files;

    return () => {
      // Cleanup all object URLs when component unmounts or files change
      currentFiles.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [files]); // Include files to satisfy ESLint

  return (
    <div className="space-y-4">
      {/* Enhanced Drop Zone */}
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-2xl p-6 transition-all duration-300 ${
          isDragActive
            ? "border-blue-500 bg-blue-50/50"
            : "border-gray-300/60 bg-gray-50/30"
        } ${isDragReject ? "border-red-400 bg-red-50/50" : ""} ${
          files.length >= maxFiles ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        <input {...getInputProps()} />
        
        <div className="text-center space-y-3">
          {files.length === 0 ? (
            <>
              <div className="text-4xl lg:text-5xl text-gray-300">📁</div>
              <div>
                <p className="text-lg font-bold text-gray-500">
                  {isDragActive ? "Drop files here" : "Drag & drop images here"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  or click to browse files
                </p>
              </div>
              <p className="text-xs text-gray-400">
                Supports JPG, PNG, GIF, BMP, WebP • Max {maxFiles} files • {Math.round(maxFileSize / 1024 / 1024)}MB each
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
                  {files.length} file{files.length !== 1 ? "s" : ""} ready
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {isDragActive ? "Drop more files here" : "Drag more files or click to add"}
                </p>
              </div>
              <p className="text-xs text-gray-400">
                {files.length}/{maxFiles} files • {Math.round(maxFileSize / 1024 / 1024)}MB max each
              </p>
            </>
          )}
        </div>

        {/* Add More Files Button - Shows during processing */}
        {isProcessing && files.length < maxFiles && (
          <div className="absolute top-3 right-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                fileInput?.click();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-md"
            >
              + Add More
            </button>
          </div>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">
              Selected Files ({files.length}/{maxFiles})
            </h3>
            <button
              onClick={clearAllFiles}
              className="text-red-600 hover:text-red-700 text-sm font-medium hover:bg-red-50 px-2 py-1 rounded-md transition-colors"
            >
              Clear All
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
            {files.map((file) => (
              <div
                key={file.id}
                className="bg-white/95 backdrop-blur-sm border border-gray-200/60 rounded-xl p-3 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start space-x-3">
                  {/* File Preview */}
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    {file.preview ? (
                      <Image
                        src={file.preview}
                        alt={file.name}
                        className="w-full h-full object-cover rounded-lg"
                        width={48}
                        height={48}
                      />
                    ) : (
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                  
                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        file.status === 'ready' ? 'bg-blue-100 text-blue-800' :
                        file.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                        file.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {file.status === 'ready' && 'Ready'}
                        {file.status === 'processing' && 'Processing'}
                        {file.status === 'completed' && 'Completed'}
                        {file.status === 'error' && 'Error'}
                      </span>
                      {file.error && (
                        <span className="text-xs text-red-600" title={file.error}>
                          ⚠️ {file.error}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Remove Button */}
                  <button
                    onClick={() => removeFile(file.id)}
                    className="text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors flex-shrink-0"
                    title="Remove file"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
