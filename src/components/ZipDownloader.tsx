"use client";

import { useState, useEffect, useCallback } from "react";

interface ZipDownloaderProps {
  conversionResults: { fileName: string; svgContent: string }[];
  isVisible: boolean;
}

export function ZipDownloader({
  conversionResults,
  isVisible,
}: ZipDownloaderProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [downloadReady, setDownloadReady] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    if (conversionResults.length > 0 && !downloadReady) {
      setDownloadReady(false);
      setDownloadUrl(null);
    }
  }, [conversionResults, downloadReady]);

  const createAndDownloadZip = async () => {
    if (conversionResults.length === 0) return;

    setIsCreating(true);

    try {
      // Dynamic import of JSZip to avoid SSR issues
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      // Add each SVG file to the zip
      conversionResults.forEach((result) => {
        const fileName = result.fileName.replace(/\.[^/.]+$/, ".svg"); // Replace extension with .svg
        zip.file(fileName, result.svgContent);
      });

      // Generate zip file
      const zipBlob = await zip.generateAsync({ type: "blob" });

      // Create download URL
      const url = URL.createObjectURL(zipBlob);
      setDownloadUrl(url);
      setDownloadReady(true);

      // Auto-download after a short delay
      setTimeout(() => {
        const link = document.createElement("a");
        link.href = url;
        link.download = `svg-conversions-${new Date()
          .toISOString()
          .slice(0, 10)}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, 500);
    } catch (error) {
      console.error("Error creating zip file:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const downloadZip = () => {
    if (downloadUrl) {
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `svg-conversions-${new Date()
        .toISOString()
        .slice(0, 10)}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const cleanupDownloadUrl = useCallback(() => {
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }
  }, [downloadUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupDownloadUrl();
    };
  }, [cleanupDownloadUrl]);

  if (!isVisible || conversionResults.length === 0) {
    return null;
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-2xl p-4 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg
              className="w-4 h-4 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-800">
              {conversionResults.length} SVG
              {conversionResults.length !== 1 ? "s" : ""} Ready
            </h3>
            <p className="text-sm text-gray-600">
              Download all files as a single ZIP archive
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-lg font-bold text-blue-600">
            {conversionResults.length}
          </div>
          <div className="text-xs text-gray-500">files</div>
        </div>
      </div>

      {/* File List Preview */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Files to include:
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-24 overflow-y-auto">
          {conversionResults.map((result, index) => {
            const fileName = result.fileName.replace(/\.[^/.]+$/, ".svg");
            return (
              <div key={index} className="flex items-center space-x-2 text-sm">
                <svg
                  className="w-3 h-3 text-blue-500 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-gray-600 truncate" title={fileName}>
                  {fileName}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        {!downloadReady ? (
          <button
            onClick={createAndDownloadZip}
            disabled={isCreating}
            className="flex-1 bg-blue-600 text-white py-2.5 px-4 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
          >
            {isCreating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                <span>Creating ZIP...</span>
              </>
            ) : (
              <>
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
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span>Download ZIP</span>
              </>
            )}
          </button>
        ) : (
          <button
            onClick={downloadZip}
            className="flex-1 bg-blue-600 text-white py-2.5 px-4 rounded-xl font-medium hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
          >
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
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span>Download Again</span>
          </button>
        )}

        <button
          onClick={cleanupDownloadUrl}
          className="px-3 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors"
        >
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Success Message */}
      {downloadReady && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg
              className="w-4 h-4 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm text-blue-700 font-medium">
              ZIP file created successfully! Download should start
              automatically.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
