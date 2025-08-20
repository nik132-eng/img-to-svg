"use client";

import { useState, useEffect } from "react";
import { ConversionSettings as ConversionSettingsType } from "@/components/ConversionSettings";

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
}

export function ConversionQueue({
  files,
  onConversionComplete,
  onQueueUpdate,
  conversionSettings,
}: ConversionQueueProps) {
  const [queue, setQueue] = useState<ConversionJob[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);

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
      onQueueUpdate(newJobs);
    }
  }, [files, onQueueUpdate]);

  const startProcessing = async () => {
    if (queue.length === 0 || isProcessing) return;

    setIsProcessing(true);
    setCompletedCount(0);
    setErrorCount(0);

    const results: { fileName: string; svgContent: string }[] = [];

    // Process files sequentially to avoid overwhelming the API
    for (let i = 0; i < queue.length; i++) {
      const job = queue[i];

      // Update job status to processing
      updateJobStatus(job.id, "processing", 0);

      try {
        // Simulate processing time (remove this in production)
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Convert the file
        const result = await convertFile(job.file, conversionSettings);

        // Update job status to completed
        updateJobStatus(job.id, "completed", 100, undefined, result);
        setCompletedCount((prev) => prev + 1);

        // Add to results array immediately
        results.push({
          fileName: job.fileName,
          svgContent: result,
        });
      } catch (error) {
        // Update job status to error
        updateJobStatus(
          job.id,
          "error",
          0,
          error instanceof Error ? error.message : "Conversion failed"
        );
        setErrorCount((prev) => prev + 1);
      }
    }

    setIsProcessing(false);

    // Send results to parent component
    if (results.length > 0) {
      console.log("Sending conversion results to parent:", results.length);
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
      colorMode: settings.colorMode,
      colorPrecision: settings.colorPrecision.toString(),
      filterSpeckle: settings.filterSpeckle.toString(),
      spliceThreshold: settings.spliceThreshold.toString(),
      cornerThreshold: settings.cornerThreshold.toString(),
      hierarchical: settings.hierarchical,
      mode: settings.mode,
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

  const pauseProcessing = () => {
    setIsProcessing(false);
  };

  const retryJob = async (jobId: string) => {
    const job = queue.find((j) => j.id === jobId);
    if (!job) return;

    updateJobStatus(jobId, "ready", 0);

    if (isProcessing) {
      // If currently processing, wait for current queue to finish
      return;
    }

    // Start processing from this job
    const jobIndex = queue.findIndex((j) => j.id === jobId);
    const remainingJobs = queue.slice(jobIndex);

    setIsProcessing(true);

    for (const remainingJob of remainingJobs) {
      if (remainingJob.status === "ready") {
        updateJobStatus(remainingJob.id, "processing", 0);

        try {
          const result = await convertFile(
            remainingJob.file,
            conversionSettings
          );
          updateJobStatus(remainingJob.id, "completed", 100, undefined, result);
          setCompletedCount((prev) => prev + 1);
        } catch (error) {
          updateJobStatus(
            remainingJob.id,
            "error",
            0,
            error instanceof Error ? error.message : "Conversion failed"
          );
          setErrorCount((prev) => prev + 1);
        }
      }
    }

    setIsProcessing(false);
  };

  const getStatusColor = (status: ConversionJob["status"]) => {
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

  const getStatusText = (status: ConversionJob["status"]) => {
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

  const getProcessingTime = (job: ConversionJob) => {
    if (!job.startTime) return "";
    if (job.status === "processing") {
      const elapsed = Date.now() - job.startTime.getTime();
      return `${Math.round(elapsed / 1000)}s`;
    }
    if (job.endTime && job.startTime) {
      const elapsed = job.endTime.getTime() - job.startTime.getTime();
      return `${Math.round(elapsed / 1000)}s`;
    }
    return "";
  };

  if (queue.length === 0) {
    return null;
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/40 shadow-lg">
      {/* Queue Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Conversion Queue
          </h3>
          <p className="text-sm text-gray-600">
            {completedCount} completed • {errorCount} errors •{" "}
            {queue.filter((j) => j.status === "ready").length} ready
          </p>
        </div>

        <div className="flex space-x-2">
          {!isProcessing ? (
            <button
              onClick={startProcessing}
              disabled={queue.length === 0}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Convert to SVG
            </button>
          ) : (
            <button
              onClick={pauseProcessing}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-yellow-700 transition-colors"
            >
              Pause
            </button>
          )}
        </div>
      </div>

      {/* Progress Overview */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Overall Progress</span>
          <span>{Math.round((completedCount / queue.length) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(completedCount / queue.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Queue Items */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {queue.map((job) => (
          <div
            key={job.id}
            className="bg-gray-50 rounded-lg p-3 border border-gray-200"
          >
            <div className="flex items-center space-x-3">
              {/* Status Indicator */}
              <div className="flex-shrink-0">
                <span
                  className={`w-3 h-3 rounded-full ${getStatusColor(
                    job.status
                  )}`}
                ></span>
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p
                    className="text-sm font-medium text-gray-800 truncate"
                    title={job.fileName}
                  >
                    {job.fileName}
                  </p>
                  <span className="text-xs text-gray-500">
                    {getStatusText(job.status)}
                  </span>
                </div>

                {/* Progress Bar */}
                {job.status === "processing" && (
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${job.progress}%` }}
                    ></div>
                  </div>
                )}

                {/* Processing Time */}
                {getProcessingTime(job) && (
                  <p className="text-xs text-gray-500">
                    Time: {getProcessingTime(job)}
                  </p>
                )}

                {/* Error Message */}
                {job.error && (
                  <p className="text-xs text-red-600 mt-1">{job.error}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex-shrink-0">
                {job.status === "error" && (
                  <button
                    onClick={() => retryJob(job.id)}
                    className="text-blue-600 hover:text-blue-800 text-xs font-medium transition-colors"
                  >
                    Retry
                  </button>
                )}
                {job.status === "completed" && (
                  <svg
                    className="w-5 h-5 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
