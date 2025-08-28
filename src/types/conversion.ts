// Custom Vectorization Algorithm Types and Enums
// This replaces the string-based approach with proper enums for better type safety

export enum ColorMode {
  Color = 0,
  Binary = 1
}

export enum HierarchicalMode {
  Stacked = 0,
  Cutout = 1
}

export enum PathSimplifyMode {
  Polygon = 1,
  Spline = 2
}

export enum EdgeDetectionType {
  Sobel = 'sobel',
  Canny = 'canny',
  Adaptive = 'adaptive'
}

export enum PathTracingAlgorithm {
  MooreNeighbor = 'moore-neighbor',
  SquareTracing = 'square-tracing',
  Custom = 'custom'
}

export interface ConversionSettings {
  colorMode: ColorMode;
  colorPrecision: number;
  filterSpeckle: number;
  spliceThreshold: number;
  cornerThreshold: number;
  hierarchical: HierarchicalMode;
  mode: PathSimplifyMode;
  layerDifference: number;
  lengthThreshold: number;
  maxIterations: number;
  pathPrecision: number;
}

export interface CustomAlgorithmSettings {
  edgeDetection: {
    type: EdgeDetectionType;
    sobelThreshold: number;
    cannyLowThreshold: number;
    cannyHighThreshold: number;
    adaptiveThreshold: number;
  };
  pathTracing: {
    algorithm: PathTracingAlgorithm;
    smoothingFactor: number;
    simplificationThreshold: number;
  };
  colorQuantization: {
    kMeansClusters: number;
    colorSimilarityThreshold: number;
    regionGrowingThreshold: number;
  };
}

export interface VectorizationResult {
  svg: string;
  quality: {
    accuracy: number;
    smoothness: number;
    fileSize: number;
    processingTime: number;
  };
  metadata: {
    originalSize: { width: number; height: number };
    vectorizedSize: { width: number; height: number };
    pathCount: number;
    colorCount: number;
  };
}
