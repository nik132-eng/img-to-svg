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
    <div className="bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Success Message */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100/80 rounded-full flex items-center justify-center">
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
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">
              Converted {conversionResults.length} image
              {conversionResults.length !== 1 ? "s" : ""} to SVG
            </p>
            <p className="text-xs text-gray-500">Ready for download</p>
          </div>
        </div>

        {/* Download Button */}
        {!downloadReady ? (
          <button
            onClick={createAndDownloadZip}
            disabled={isCreating}
            className={`bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-all hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed ${
              isCreating ? "cursor-wait" : ""
            }`}
          >
            {isCreating ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                <span>Creating...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
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
                    d="M12 10v6m0 0l-3-3m3 3l3-3"
                  />
                </svg>
                <span>Download ZIP</span>
              </div>
            )}
          </button>
        ) : (
          <button
            onClick={downloadZip}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all"
          >
            <div className="flex items-center space-x-2">
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
                  d="M12 10v6m0 0l-3-3m3 3l3-3"
                />
              </svg>
              <span>Download</span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
