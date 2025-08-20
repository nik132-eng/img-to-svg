"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import React from "react";

interface BulkImageUploaderProps {
  onImagesSelect: (files: File[]) => void;
  onClear?: () => void;
  currentImages?: File[];
  maxFiles?: number;
  maxFileSize?: number; // in bytes
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
}: BulkImageUploaderProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);

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
          return [...prev, ...filesToAdd];
        } else {
          return [...prev, ...newFiles];
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
      return prev.filter((f) => f.id !== fileId);
    });
  };

  const clearAllFiles = () => {
    // Clean up all object URLs before clearing
    files.forEach((file) => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setFiles([]);
    if (onClear) onClear();
  };

  const addMoreFiles = () => {
    // Trigger file input click
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = "image/*";
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files) {
        const fileArray = Array.from(target.files);
        onDrop(fileArray);
      }
    };
    input.click();
  };

  const getFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusColor = (status: FileWithPreview["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "processing":
        return "bg-blue-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusText = (status: FileWithPreview["status"]) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "processing":
        return "Processing";
      case "error":
        return "Error";
      case "ready":
        return "Ready";
      default:
        return "Ready";
    }
  };

  // Store the callback in a ref to avoid dependency issues
  const onImagesSelectRef = React.useRef(onImagesSelect);
  const filesRef = React.useRef(files);

  React.useEffect(() => {
    onImagesSelectRef.current = onImagesSelect;
  }, [onImagesSelect]);

  React.useEffect(() => {
    filesRef.current = files;
  }, [files]);

  // Update parent component when files change
  React.useEffect(() => {
    if (files.length > 0) {
      onImagesSelectRef.current(files.map((f) => f as File));
    }
  }, [files]); // Only depend on files

  // Update files when currentImages changes (only when it's actually different)
  React.useEffect(() => {
    if (currentImages && currentImages.length > 0) {
      // Use a more efficient comparison
      const currentFileCount = filesRef.current.length;
      const newFileCount = currentImages.length;

      if (
        currentFileCount !== newFileCount ||
        currentImages.some(
          (file, index) => filesRef.current[index]?.name !== file.name
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
          setFiles(newFiles);
        }
      }
    } else if (
      currentImages &&
      currentImages.length === 0 &&
      filesRef.current.length > 0
    ) {
      setFiles([]);
    }
  }, [currentImages]); // Only depend on currentImages

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
    <div className="w-full space-y-4">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
          isDragActive
            ? "border-blue-500 bg-blue-50/80 backdrop-blur-sm shadow-lg shadow-blue-100"
            : isDragReject
            ? "border-red-500 bg-red-50/80 backdrop-blur-sm"
            : files.length >= maxFiles
            ? "border-gray-300 bg-gray-50/80 cursor-not-allowed"
            : "border-gray-300/60 hover:border-blue-400 hover:bg-gray-50/80 backdrop-blur-sm"
        }`}
      >
        <input {...getInputProps()} />

        {files.length === 0 ? (
          <div className="space-y-4">
            {/* Upload Icon */}
            <div className="relative">
              <div
                className={`w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg transition-transform duration-300 ${
                  isDragActive ? "scale-110" : ""
                }`}
              >
                <svg
                  className="w-8 h-8 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>

              {/* Animated Background Elements */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-2 left-2 w-4 h-4 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
                <div
                  className="absolute top-3 right-3 w-3 h-3 bg-indigo-300 rounded-full opacity-30 animate-pulse"
                  style={{ animationDelay: "1s" }}
                ></div>
                <div
                  className="absolute bottom-2 left-3 w-2 h-2 bg-purple-200 rounded-full opacity-25 animate-pulse"
                  style={{ animationDelay: "2s" }}
                ></div>
              </div>
            </div>

            <div className="space-y-3">
              <h3
                className={`text-xl font-bold transition-colors duration-300 ${
                  isDragActive
                    ? "text-blue-600"
                    : isDragReject
                    ? "text-red-600"
                    : files.length >= maxFiles
                    ? "text-gray-500"
                    : "text-gray-800"
                }`}
              >
                {isDragActive
                  ? "DROP YOUR IMAGES HERE!"
                  : isDragReject
                  ? "INVALID FILE TYPE"
                  : files.length >= maxFiles
                  ? "MAXIMUM FILES REACHED"
                  : "DRAG IMAGES HERE TO BEGIN"}
              </h3>

              {!isDragReject && !files.length && files.length < maxFiles && (
                <>
                  <p className="text-sm text-gray-600">or you can</p>

                  <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-3">
                    <button className="bg-gradient-to-r from-gray-700 to-gray-800 text-white py-3 px-6 rounded-xl font-bold hover:from-gray-800 hover:to-gray-900 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <span>PICK IMAGES TO VECTORIZE</span>
                    </button>
                  </div>
                </>
              )}

              {/* File Limits Info */}
              <div className="text-sm text-gray-500">
                <p>
                  Maximum {maxFiles} files • {getFileSize(maxFileSize)} per file
                </p>
                <p>Supported: PNG, JPG, GIF, BMP, WebP</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                {files.length} Image{files.length !== 1 ? "s" : ""} Selected
              </h3>
              <p className="text-sm text-gray-600">
                {files.length < maxFiles
                  ? "Drop more images or click to add more"
                  : "Maximum files reached"}
              </p>
            </div>

            {/* Add More Files Button */}
            {files.length < maxFiles && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addMoreFiles();
                }}
                className="bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                + Add More Files
              </button>
            )}
          </div>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/40 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-800">
              Selected Files ({files.length}/{maxFiles})
            </h4>
            <button
              onClick={clearAllFiles}
              className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
            {files.map((file) => (
              <div
                key={file.id}
                className="bg-gray-50 rounded-lg p-3 border border-gray-200"
              >
                <div className="flex items-start space-x-3">
                  {/* Thumbnail */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
                      {file.preview && (
                        <img
                          src={file.preview}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span
                        className={`w-2 h-2 rounded-full ${getStatusColor(
                          file.status
                        )}`}
                      ></span>
                      <span className="text-xs text-gray-500">
                        {getStatusText(file.status)}
                      </span>
                    </div>

                    <p
                      className="text-sm font-medium text-gray-800 truncate"
                      title={file.name}
                    >
                      {file.name}
                    </p>

                    <p className="text-xs text-gray-500">
                      {getFileSize(file.size)}
                    </p>

                    {file.error && (
                      <p className="text-xs text-red-600 mt-1">{file.error}</p>
                    )}
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFile(file.id)}
                    className="flex-shrink-0 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
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
