'use client';

import { useState } from 'react';
import { CustomVectorizer } from '@/utils/customVectorizer';
import { ConversionSettings, ColorMode, HierarchicalMode, PathSimplifyMode, EdgeDetectionType, PathTracingAlgorithm } from '@/types/conversion';

export function CustomAlgorithmTester() {
  const [testResult, setTestResult] = useState<string>('');
  const [isTesting, setIsTesting] = useState(false);

  const testCustomAlgorithms = async () => {
    setIsTesting(true);
    setTestResult('Testing custom algorithms...');
    
    try {
      // Create a simple test image (1x1 pixel)
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }
      
      // Draw a simple test pattern
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(0, 0, 50, 50);
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(50, 0, 50, 50);
      ctx.fillStyle = '#0000ff';
      ctx.fillRect(0, 50, 50, 50);
      ctx.fillStyle = '#ffff00';
      ctx.fillRect(50, 50, 50, 50);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, 100, 100);
      
      // Test custom vectorization
      const testSettings: ConversionSettings = {
        colorMode: ColorMode.Color,
        colorPrecision: 6,
        filterSpeckle: 4,
        spliceThreshold: 45,
        cornerThreshold: 60,
        hierarchical: HierarchicalMode.Stacked,
        mode: PathSimplifyMode.Spline,
        layerDifference: 5,
        lengthThreshold: 5,
        maxIterations: 2,
        pathPrecision: 5,
      };
      
      const result = await CustomVectorizer.vectorize(imageData, {
        conversionSettings: testSettings,
        customSettings: {
          edgeDetection: {
            type: EdgeDetectionType.Adaptive,
            sobelThreshold: 50,
            cannyLowThreshold: 25,
            cannyHighThreshold: 75,
            adaptiveThreshold: 30
          },
          pathTracing: {
            algorithm: PathTracingAlgorithm.Custom,
            smoothingFactor: 0.3,
            simplificationThreshold: 2
          },
          colorQuantization: {
            kMeansClusters: 4,
            colorSimilarityThreshold: 30,
            regionGrowingThreshold: 25
          }
        }
      });
      
      setTestResult(`✅ Custom algorithms test successful!
        
Quality Metrics:
- Accuracy: ${result.quality.accuracy}%
- Smoothness: ${result.quality.smoothness}%
- File Size: ${result.quality.fileSize} bytes
- Processing Time: ${result.quality.processingTime}ms

Metadata:
- Path Count: ${result.metadata.pathCount}
- Color Count: ${result.metadata.colorCount}
- Original Size: ${result.metadata.originalSize.width}x${result.metadata.originalSize.height}
- Vectorized Size: ${result.metadata.vectorizedSize.width}x${result.metadata.vectorizedSize.height}

SVG Length: ${result.svg.length} characters`);
      
    } catch (error) {
      setTestResult(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Custom Algorithm Tester</h2>
      
      <button
        onClick={testCustomAlgorithms}
        disabled={isTesting}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isTesting ? 'Testing...' : 'Test Custom Algorithms'}
      </button>
      
      {testResult && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <pre className="whitespace-pre-wrap text-sm">{testResult}</pre>
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-600">
        <p>This component tests the custom vectorization algorithms:</p>
        <ul className="list-disc list-inside mt-2">
          <li>Custom Edge Detection (Sobel, Canny, Adaptive)</li>
          <li>Custom Path Tracing (Moore-Neighbor, Square, Custom)</li>
          <li>Custom Color Quantization (K-means, Region Growing)</li>
        </ul>
      </div>
    </div>
  );
}
