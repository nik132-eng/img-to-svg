// Custom Vectorization Engine
// Integrates all custom algorithms: edge detection, path tracing, and color quantization
// Following the sprint plan Epic 1 requirements

import { SobelEdgeDetector, CannyEdgeDetector, AdaptiveEdgeDetector, EdgeDetectionResult, EdgeDetectionOptions } from './edgeDetection';
import { PathTracingFactory, PathTracingOptions, Path } from './pathTracing';
import { RegionGrowingDetector, HierarchicalRegionOrganizer, ColorQuantizationOptions, Region } from './colorQuantization';
import { ConversionSettings, CustomAlgorithmSettings, VectorizationResult, EdgeDetectionType, PathTracingAlgorithm } from '@/types/conversion';
import { measurePerformance } from './common';

export interface CustomVectorizationOptions {
  edgeDetection: EdgeDetectionOptions;
  pathTracing: PathTracingOptions;
  colorQuantization: ColorQuantizationOptions;
  conversionSettings: ConversionSettings;
  customSettings: CustomAlgorithmSettings;
}

export class CustomVectorizer {
  private static readonly DEFAULT_OPTIONS: CustomVectorizationOptions = {
    edgeDetection: {
      threshold: 50,
      lowThreshold: 25,
      highThreshold: 75,
      gaussianBlur: 1
    },
    pathTracing: {
      algorithm: 'moore-neighbor',
      smoothingFactor: 0.3,
      simplificationThreshold: 2,
      minPathLength: 10
    },
    colorQuantization: {
      kMeansClusters: 8,
      colorSimilarityThreshold: 30,
      regionGrowingThreshold: 25,
      maxIterations: 100,
      convergenceThreshold: 5
    },
    conversionSettings: {
      colorMode: 0,
      colorPrecision: 6,
      filterSpeckle: 4,
      spliceThreshold: 45,
      cornerThreshold: 60,
      hierarchical: 0,
      mode: 2,
      layerDifference: 5,
      lengthThreshold: 5,
      maxIterations: 2,
      pathPrecision: 5
    },
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
        kMeansClusters: 8,
        colorSimilarityThreshold: 30,
        regionGrowingThreshold: 25
      }
    }
  };

  static async vectorize(imageData: ImageData, options?: Partial<CustomVectorizationOptions>): Promise<VectorizationResult> {
    const startTime = performance.now();
    const finalOptions = { ...this.DEFAULT_OPTIONS, ...options };
    
    try {
      console.log('Starting custom vectorization with options:', finalOptions);
      
      // Step 1: Edge Detection
      const edgeResult = await measurePerformance('Edge Detection', () => 
        this.performEdgeDetection(imageData, finalOptions)
      );
      console.log('Edge detection completed, found edges:', edgeResult.result.edges);
      
      // Step 2: Path Tracing
      const paths = await measurePerformance('Path Tracing', () => 
        this.performPathTracing(edgeResult.result, finalOptions)
      );
      console.log('Path tracing completed, found paths:', paths.result.length);
      
      // Step 3: Color Quantization and Region Detection
      const regions = await measurePerformance('Color Quantization', () => 
        this.performColorQuantization(imageData, finalOptions)
      );
      console.log('Color quantization completed, found regions:', regions.result.length);
      
      // Step 4: Generate SVG
      const svg = await measurePerformance('SVG Generation', () => 
        this.generateSVG(paths.result, regions.result, imageData, finalOptions)
      );
      console.log('SVG generation completed, length:', svg.result.length);
      
      // Step 5: Calculate quality metrics
      const quality = this.calculateQualityMetrics(imageData, svg.result, startTime);
      
      // Step 6: Calculate metadata
      const metadata = this.calculateMetadata(imageData, paths.result, regions.result);
      
      const processingTime = performance.now() - startTime;
      console.log(`Custom vectorization completed in ${processingTime.toFixed(2)}ms`);
      
      return {
        svg: svg.result,
        quality,
        metadata
      };
      
    } catch (error) {
      console.error('Custom vectorization failed:', error);
      throw new Error(`Custom vectorization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async performEdgeDetection(
    imageData: ImageData, 
    options: CustomVectorizationOptions
  ): Promise<EdgeDetectionResult> {
    const { type } = options.customSettings.edgeDetection;
    
    switch (type) {
      case EdgeDetectionType.Sobel:
        return SobelEdgeDetector.detect(imageData, {
          ...options.edgeDetection,
          threshold: options.customSettings.edgeDetection.sobelThreshold
        });
        
      case EdgeDetectionType.Canny:
        return CannyEdgeDetector.detect(imageData, {
          ...options.edgeDetection,
          lowThreshold: options.customSettings.edgeDetection.cannyLowThreshold,
          highThreshold: options.customSettings.edgeDetection.cannyHighThreshold
        });
        
      case EdgeDetectionType.Adaptive:
      default:
        return AdaptiveEdgeDetector.detect(imageData, {
          ...options.edgeDetection,
          threshold: options.customSettings.edgeDetection.adaptiveThreshold
        });
    }
  }

  private static async performPathTracing(
    edgeResult: EdgeDetectionResult, 
    options: CustomVectorizationOptions
  ): Promise<Path[]> {
    // Convert edge detection result to boolean array for path tracing
    const edgeMap = this.imageDataToBooleanArray(edgeResult.edges);
    
    // Use the specified path tracing algorithm
    const pathTracingOptions: PathTracingOptions = {
      ...options.pathTracing,
      algorithm: options.customSettings.pathTracing.algorithm,
      smoothingFactor: options.customSettings.pathTracing.smoothingFactor,
      simplificationThreshold: options.customSettings.pathTracing.simplificationThreshold
    };
    
    return PathTracingFactory.traceAllPaths(edgeMap, pathTracingOptions);
  }

  private static async performColorQuantization(
    imageData: ImageData, 
    options: CustomVectorizationOptions
  ): Promise<Region[]> {
    // Perform K-means clustering (stored for potential future use)
    // const _clusters = KMeansColorQuantizer.quantize(imageData, {
    //   ...options.colorQuantization,
    //   kMeansClusters: options.customSettings.colorQuantization.kMeansClusters,
    //   colorSimilarityThreshold: options.customSettings.colorQuantization.colorSimilarityThreshold
    // });
    
    // Perform region growing
    const regions = RegionGrowingDetector.detectRegions(imageData, {
      ...options.colorQuantization,
      regionGrowingThreshold: options.customSettings.colorQuantization.regionGrowingThreshold
    });
    
    // Organize regions hierarchically
    const hierarchicalMode = options.conversionSettings.hierarchical === 0 ? 'stacked' : 'cutout';
    const organizedRegions = HierarchicalRegionOrganizer.organizeRegions(regions, hierarchicalMode);
    
    // Merge similar regions if needed
    return HierarchicalRegionOrganizer.mergeSimilarRegions(
      organizedRegions, 
      options.colorQuantization.colorSimilarityThreshold
    );
  }

  private static async generateSVG(
    paths: Path[], 
    regions: Region[], 
    imageData: ImageData, 
    options: CustomVectorizationOptions
  ): Promise<string> {
    const { width, height } = imageData;
    
    // Start building SVG
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">\n`;
    
    // Add definitions for gradients and filters
    svg += this.generateSVGDefinitions(regions);
    
    // Add regions as filled shapes
    regions.forEach(region => {
      svg += this.generateRegionSVG(region);
    });
    
    // Add paths from edge detection
    paths.forEach(path => {
      svg += this.generatePathSVG(path, options);
    });
    
    svg += '</svg>';
    
    return svg;
  }

  private static generateSVGDefinitions(regions: Region[]): string {
    let definitions = '  <defs>\n';
    
    // Add gradients for regions
    regions.forEach((region, index) => {
      const color = region.averageColor;
      definitions += `    <linearGradient id="gradient-${index}" x1="0%" y1="0%" x2="100%" y2="100%">\n`;
      definitions += `      <stop offset="0%" style="stop-color:rgb(${color.r},${color.g},${color.b});stop-opacity:${color.a / 255}" />\n`;
      definitions += `      <stop offset="100%" style="stop-color:rgb(${color.r},${color.g},${color.b});stop-opacity:${color.a / 255}" />\n`;
      definitions += `    </linearGradient>\n`;
    });
    
    definitions += '  </defs>\n';
    return definitions;
  }

  private static generateRegionSVG(region: Region): string {
    const { boundingBox } = region;
    const color = region.averageColor;
    
    // Generate a simple rectangle for the region
    // In a more sophisticated implementation, you'd generate the actual region shape
    return `  <rect x="${boundingBox.minX}" y="${boundingBox.minY}" width="${boundingBox.maxX - boundingBox.minX}" height="${boundingBox.maxY - boundingBox.minY}" fill="rgb(${color.r},${color.g},${color.b})" opacity="${color.a / 255}" />\n`;
  }

  private static generatePathSVG(path: Path, options: CustomVectorizationOptions): string {
    if (path.points.length < 2) return '';
    
    // Convert path points to SVG path data
    let pathData = `M ${path.points[0].x} ${path.points[0].y}`;
    
    for (let i = 1; i < path.points.length; i++) {
      pathData += ` L ${path.points[i].x} ${path.points[i].y}`;
    }
    
    if (path.isClosed) {
      pathData += ' Z';
    }
    
    // Apply path settings based on conversion options
    const strokeWidth = Math.max(1, options.conversionSettings.pathPrecision);
    const strokeColor = options.conversionSettings.colorMode === 0 ? '#000000' : '#ffffff';
    
    return `  <path d="${pathData}" stroke="${strokeColor}" stroke-width="${strokeWidth}" fill="none" />\n`;
  }

  private static imageDataToBooleanArray(imageData: ImageData): boolean[][] {
    const { width, height, data } = imageData;
    const result: boolean[][] = Array(height).fill(0).map(() => Array(width).fill(false));
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        // Consider a pixel as an edge if any RGB channel is above threshold
        result[y][x] = data[index] > 0 || data[index + 1] > 0 || data[index + 2] > 0;
      }
    }
    
    return result;
  }

  private static calculateQualityMetrics(
    originalImage: ImageData, 
    svg: string, 
    startTime: number
  ): VectorizationResult['quality'] {
    const processingTime = performance.now() - startTime;
    
    // Calculate file size
    const fileSize = new Blob([svg]).size;
    
    // Calculate accuracy (simplified - in reality you'd compare vector vs raster)
    const accuracy = Math.min(95, Math.max(60, 100 - (processingTime / 1000) * 10));
    
    // Calculate smoothness (simplified - based on path count and complexity)
    const pathCount = (svg.match(/<path/g) || []).length;
    const smoothness = Math.min(90, Math.max(50, 100 - pathCount * 2));
    
    return {
      accuracy: Math.round(accuracy),
      smoothness: Math.round(smoothness),
      fileSize,
      processingTime: Math.round(processingTime)
    };
  }

  private static calculateMetadata(
    imageData: ImageData, 
    paths: Path[], 
    regions: Region[]
  ): VectorizationResult['metadata'] {
    const { width, height } = imageData;
    
    // Calculate vectorized dimensions (same as original for now)
    const vectorizedWidth = width;
    const vectorizedHeight = height;
    
    // Count total paths
    const pathCount = paths.reduce((total, path) => total + path.points.length, 0);
    
    // Count unique colors
    const uniqueColors = new Set<string>();
    regions.forEach(region => {
      region.colors.forEach(color => {
        uniqueColors.add(`${color.r},${color.g},${color.b},${color.a}`);
      });
    });
    
    return {
      originalSize: { width, height },
      vectorizedSize: { width: vectorizedWidth, height: vectorizedHeight },
      pathCount,
      colorCount: uniqueColors.size
    };
  }

  // Utility method to compare with VTracer results
  static async compareWithVTracer(
    imageData: ImageData, 
    vtracerResult: string, 
    options?: Partial<CustomVectorizationOptions>
  ): Promise<{
    customResult: VectorizationResult;
    vtracerResult: VectorizationResult;
    comparison: {
      qualityDifference: number;
      fileSizeDifference: number;
      processingTimeDifference: number;
    };
  }> {
    const customResult = await this.vectorize(imageData, options);
    
    // Parse VTracer result for comparison
    const vtracerParsed: VectorizationResult = {
      svg: vtracerResult,
      quality: {
        accuracy: 85, // Default values for comparison
        smoothness: 80,
        fileSize: new Blob([vtracerResult]).size,
        processingTime: 0
      },
      metadata: {
        originalSize: { width: imageData.width, height: imageData.height },
        vectorizedSize: { width: imageData.width, height: imageData.height },
        pathCount: (vtracerResult.match(/<path/g) || []).length,
        colorCount: (vtracerResult.match(/fill=/g) || []).length
      }
    };
    
    const comparison = {
      qualityDifference: customResult.quality.accuracy - vtracerParsed.quality.accuracy,
      fileSizeDifference: customResult.quality.fileSize - vtracerParsed.quality.fileSize,
      processingTimeDifference: customResult.quality.processingTime - vtracerParsed.quality.processingTime
    };
    
    return {
      customResult,
      vtracerResult: vtracerParsed,
      comparison
    };
  }
}
