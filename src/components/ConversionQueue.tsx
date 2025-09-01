"use client";

import { useState, useEffect } from "react";
import { ConversionSettings as ConversionSettingsType } from "@/components/ConversionSettings";
import React from "react"; // Added missing import

interface ConversionJob {
  id: string;
  fileName: string;
  file: File;
  status: "ready" | "processing" | "completed" | "error";
  progress: number;
  error?: string;
  svgContent?: string;
  startTime?: Date;
  endTime?: Date;
}

interface ConversionQueueProps {
  files: File[];
  onConversionComplete: (
    results: { fileName: string; svgContent: string }[]
  ) => void;
  onQueueUpdate: (queue: ConversionJob[]) => void;
  conversionSettings: ConversionSettingsType;
  onProcessingStateChange?: (isProcessing: boolean) => void; // Add this prop
}

export function ConversionQueue({
  files,
  onConversionComplete,
  onQueueUpdate,
  conversionSettings,
  onProcessingStateChange, // Add this prop
}: ConversionQueueProps) {
  const [queue, setQueue] = useState<ConversionJob[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);

  // Debounced queue update to reduce unnecessary re-renders
  const timeoutRef = React.useRef<NodeJS.Timeout | undefined>(undefined);
  const debouncedQueueUpdate = React.useCallback((queue: ConversionJob[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      onQueueUpdate(queue);
    }, 100);
  }, [onQueueUpdate]);

  // Initialize queue when files change
  useEffect(() => {
    if (files.length > 0) {
      const newJobs: ConversionJob[] = files.map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        fileName: file.name,
        file,
        status: "ready",
        progress: 0,
      }));
      setQueue(newJobs);
      debouncedQueueUpdate(newJobs);
    } else {
      setQueue([]);
      debouncedQueueUpdate([]);
    }
  }, [files, debouncedQueueUpdate]);

  // Notify parent component of processing state changes
  useEffect(() => {
    if (onProcessingStateChange) {
      onProcessingStateChange(isProcessing);
    }
  }, [isProcessing, onProcessingStateChange]);



  const startProcessing = async () => {
    if (queue.length === 0 || isProcessing) return;

    setIsProcessing(true);
    setCompletedCount(0);
    setErrorCount(0);

    const results: { fileName: string; svgContent: string }[] = [];
    const batchSize = 3; // Process files in smaller batches to reduce blocking

    // Process files in batches to prevent main thread blocking
    for (let i = 0; i < queue.length; i += batchSize) {
      const batch = queue.slice(i, i + batchSize);
      
      // Process batch concurrently
      const batchPromises = batch.map(async (job) => {
        updateJobStatus(job.id, "processing", 0);
        
        try {
          // Process file directly via API
          const result = await convertFile(job.file, conversionSettings);
          updateJobStatus(job.id, "completed", 100, undefined, result);
          setCompletedCount((prev) => prev + 1);
          return { fileName: job.fileName, svgContent: result };
        } catch (error) {
          // Update job status to error
          updateJobStatus(
            job.id,
            "error",
            0,
            error instanceof Error ? error.message : "Conversion failed"
          );
          setErrorCount((prev) => prev + 1);
          return null;
        }
      });

      // Wait for batch to complete before processing next batch
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter(Boolean) as { fileName: string; svgContent: string }[]);
      
      // Small delay between batches to prevent blocking
      if (i + batchSize < queue.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    setIsProcessing(false);

    // Send results to parent component
    if (results.length > 0) {
      onConversionComplete(results);
    }
  };

  const updateJobStatus = (
    jobId: string,
    status: ConversionJob["status"],
    progress: number,
    error?: string,
    svgContent?: string
  ) => {
    setQueue((prev) =>
      prev.map((job) => {
        if (job.id === jobId) {
          const updatedJob = {
            ...job,
            status,
            progress,
            error,
            svgContent,
          };

          if (status === "processing") {
            updatedJob.startTime = new Date();
          } else if (status === "completed" || status === "error") {
            updatedJob.endTime = new Date();
          }

          return updatedJob;
        }
        return job;
      })
    );
  };

  const convertFile = async (
    file: File,
    settings: ConversionSettingsType
  ): Promise<string> => {
    const formData = new FormData();
    formData.append("image", file);

    // Add conversion settings as query parameters
    const params = new URLSearchParams({
      colorMode: settings.colorMode.toString(),
      colorPrecision: settings.colorPrecision.toString(),
      filterSpeckle: settings.filterSpeckle.toString(),
      spliceThreshold: settings.spliceThreshold.toString(),
      cornerThreshold: settings.cornerThreshold.toString(),
      hierarchical: settings.hierarchical.toString(),
      mode: settings.mode.toString(),
      layerDifference: settings.layerDifference.toString(),
      lengthThreshold: settings.lengthThreshold.toString(),
      maxIterations: settings.maxIterations.toString(),
      pathPrecision: settings.pathPrecision.toString(),
    });

    const response = await fetch(`/api/convert?${params}`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (data && data.svg) {
      return data.svg;
    } else {
      throw new Error("Invalid response format: missing SVG data");
    }
  };

  const stopProcessing = () => {
    setIsProcessing(false);
  };





  if (queue.length === 0) {
    return null;
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-2xl p-4 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Conversion Queue
          </h3>
          <p className="text-sm text-gray-600">
            {queue.length} file{queue.length !== 1 ? "s" : ""} ready to convert
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Processing Status */}
          {isProcessing && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <span>Processing...</span>
            </div>
          )}
          
          {/* Start/Stop Button */}
          <button
            onClick={isProcessing ? stopProcessing : startProcessing}
            disabled={queue.length === 0}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              isProcessing
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isProcessing ? "Stop" : "Start Converting"}
          </button>
        </div>
      </div>

      {/* Progress Summary */}
      {isProcessing && (
        <div className="mb-4 p-3 bg-blue-50/80 rounded-xl border border-blue-200/60">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-800 font-medium">Overall Progress</span>
            <span className="text-blue-600">
              {completedCount + errorCount}/{queue.length} completed
            </span>
          </div>
          <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((completedCount + errorCount) / queue.length) * 100}%`,
              }}
            ></div>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-blue-600">
            <span>✅ {completedCount} successful</span>
            <span>❌ {errorCount} failed</span>
          </div>
        </div>
      )}

      {/* Queue Items */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {queue.map((job) => (
          <div
            key={job.id}
            className={`p-3 rounded-xl border transition-all ${
              job.status === "ready"
                ? "bg-gray-50 border-gray-200"
                : job.status === "processing"
                ? "bg-blue-50 border-blue-200"
                : job.status === "completed"
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-800 truncate" title={job.fileName}>
                  {job.fileName}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  job.status === 'ready' ? 'bg-gray-100 text-gray-800' :
                  job.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                  job.status === 'completed' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {job.status === 'ready' && 'Ready'}
                  {job.status === 'processing' && 'Processing'}
                  {job.status === 'completed' && 'Completed'}
                  {job.status === 'error' && 'Error'}
                </span>
              </div>
              
              {job.status === "processing" && (
                <span className="text-xs text-blue-600">{job.progress}%</span>
              )}
            </div>

            {/* Progress Bar */}
            {job.status === "processing" && (
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${job.progress}%` }}
                ></div>
              </div>
            )}

            {/* Error Message */}
            {job.status === "error" && job.error && (
              <p className="text-xs text-red-600 mt-1">{job.error}</p>
            )}

            {/* Processing Time */}
            {job.startTime && job.endTime && (
              <p className="text-xs text-gray-500 mt-1">
                Completed in {Math.round((job.endTime.getTime() - job.startTime.getTime()) / 1000)}s
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {queue.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm">No files in queue</p>
          <p className="text-xs">Upload images to get started</p>
        </div>
      )}
    </div>
  );
}
