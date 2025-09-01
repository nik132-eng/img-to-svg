// Custom Edge Detection Algorithms - Complete Implementation
// Following the sprint plan Task T001 requirements

import { rgbToGrayscale, create2DArray, isWithinBounds } from './common';

export interface EdgeDetectionResult {
  edges: ImageData;
  magnitude: number[][];
  direction: number[][];
}

export interface EdgeDetectionOptions {
  threshold: number;
  lowThreshold?: number;
  highThreshold?: number;
  gaussianBlur?: number;
}

// Complete Sobel Edge Detection Implementation
export class SobelEdgeDetector {
  static detect(imageData: ImageData, options: EdgeDetectionOptions): EdgeDetectionResult {
    const { width, height, data } = imageData;
    const result = new ImageData(width, height);
    const magnitude = create2DArray(width, height, 0);
    const direction = create2DArray(width, height, 0);

    // Sobel kernels
    const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
    const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0, gy = 0;
        
        // Apply Sobel kernels
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixelIndex = ((y + ky) * width + (x + kx)) * 4;
            const grayValue = rgbToGrayscale(data[pixelIndex], data[pixelIndex + 1], data[pixelIndex + 2]);
            
            gx += grayValue * sobelX[ky + 1][kx + 1];
            gy += grayValue * sobelY[ky + 1][kx + 1];
          }
        }
        
        // Calculate magnitude and direction
        const mag = Math.sqrt(gx * gx + gy * gy);
        const dir = Math.atan2(gy, gx);
        
        magnitude[y][x] = mag;
        direction[y][x] = dir;
        
        // Apply threshold
        const edgeValue = mag > options.threshold ? 255 : 0;
        const pixelIndex = (y * width + x) * 4;
        
        result.data[pixelIndex] = edgeValue;
        result.data[pixelIndex + 1] = edgeValue;
        result.data[pixelIndex + 2] = edgeValue;
        result.data[pixelIndex + 3] = 255;
      }
    }

    return { edges: result, magnitude, direction };
  }
}

// Complete Canny Edge Detection Implementation
export class CannyEdgeDetector {
  static detect(imageData: ImageData, options: EdgeDetectionOptions): EdgeDetectionResult {
    const { width, height } = imageData;
    const lowThreshold = options.lowThreshold || 25;
    const highThreshold = options.highThreshold || 75;
    
    // Step 1: Apply Gaussian blur
            const blurred = this.applyGaussianBlur(imageData);
    
    // Step 2: Apply Sobel edge detection
    const sobelResult = SobelEdgeDetector.detect(blurred, { threshold: 0 });
    
    // Step 3: Non-maximum suppression
    const suppressed = this.nonMaximumSuppression(sobelResult.magnitude, sobelResult.direction, width, height);
    
    // Step 4: Double thresholding and edge tracking
    const edges = this.doubleThresholding(suppressed, lowThreshold, highThreshold, width, height);
    
    // Convert to ImageData
    const result = new ImageData(width, height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixelIndex = (y * width + x) * 4;
        const edgeValue = edges[y][x] ? 255 : 0;
        
        result.data[pixelIndex] = edgeValue;
        result.data[pixelIndex + 1] = edgeValue;
        result.data[pixelIndex + 2] = edgeValue;
        result.data[pixelIndex + 3] = 255;
      }
    }
    
    return { edges: result, magnitude: sobelResult.magnitude, direction: sobelResult.direction };
  }

  private static applyGaussianBlur(imageData: ImageData): ImageData {
    const { width, height, data } = imageData;
    const result = new ImageData(width, height);
    
    // Simple 3x3 Gaussian kernel (sigma parameter could be used for dynamic kernel size)
    const kernel = [[1, 2, 1], [2, 4, 2], [1, 2, 1]];
    const kernelSum = 16;
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let r = 0, g = 0, b = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixelIndex = ((y + ky) * width + (x + kx)) * 4;
            const weight = kernel[ky + 1][kx + 1];
            
            r += data[pixelIndex] * weight;
            g += data[pixelIndex + 1] * weight;
            b += data[pixelIndex + 2] * weight;
          }
        }
        
        const pixelIndex = (y * width + x) * 4;
        result.data[pixelIndex] = r / kernelSum;
        result.data[pixelIndex + 1] = g / kernelSum;
        result.data[pixelIndex + 2] = b / kernelSum;
        result.data[pixelIndex + 3] = 255;
      }
    }
    
    return result;
  }

  private static nonMaximumSuppression(magnitude: number[][], direction: number[][], width: number, height: number): number[][] {
    const result = create2DArray(width, height, 0);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const mag = magnitude[y][x];
        const _dir = direction[y][x];
        
        // Quantize direction to 0°, 45°, 90°, 135°
        const quantizedDir = this.quantizeDirection(_dir);
        const neighbors = this.getNeighbors(x, y, quantizedDir, width, height);
        
        // Check if current pixel is local maximum
        let isLocalMax = true;
        for (const [nx, ny] of neighbors) {
          if (magnitude[ny][nx] > mag) {
            isLocalMax = false;
            break;
          }
        }
        
        result[y][x] = isLocalMax ? mag : 0;
      }
    }
    
    return result;
  }

  private static quantizeDirection(dir: number): number {
    // Normalize to 0-π range
    const normalized = ((dir % Math.PI) + Math.PI) % Math.PI;
    
    if (normalized < Math.PI / 8 || normalized >= 7 * Math.PI / 8) return 0; // 0°
    if (normalized < 3 * Math.PI / 8) return 1; // 45°
    if (normalized < 5 * Math.PI / 8) return 2; // 90°
    return 3; // 135°
  }

  private static getNeighbors(x: number, y: number, direction: number, width: number, height: number): Array<[number, number]> {
    const neighbors: Array<[number, number]> = [];
    
    switch (direction) {
      case 0: // 0° - horizontal
        if (x > 0) neighbors.push([x - 1, y]);
        if (x < width - 1) neighbors.push([x + 1, y]);
        break;
      case 1: // 45° - diagonal
        if (x > 0 && y > 0) neighbors.push([x - 1, y - 1]);
        if (x < width - 1 && y < height - 1) neighbors.push([x + 1, y + 1]);
        break;
      case 2: // 90° - vertical
        if (y > 0) neighbors.push([x, y - 1]);
        if (y < height - 1) neighbors.push([x, y + 1]);
        break;
      case 3: // 135° - diagonal
        if (x < width - 1 && y > 0) neighbors.push([x + 1, y - 1]);
        if (x > 0 && y < height - 1) neighbors.push([x - 1, y + 1]);
        break;
    }
    
    return neighbors;
  }

  private static doubleThresholding(magnitude: number[][], lowThreshold: number, highThreshold: number, width: number, height: number): boolean[][] {
    const strongEdges = create2DArray(width, height, false);
    const weakEdges = create2DArray(width, height, false);
    
    // First pass: identify strong and weak edges
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const mag = magnitude[y][x];
        if (mag >= highThreshold) {
          strongEdges[y][x] = true;
        } else if (mag >= lowThreshold) {
          weakEdges[y][x] = true;
        }
      }
    }
    
    // Second pass: edge tracking by hysteresis
    const result = create2DArray(width, height, false);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (strongEdges[y][x]) {
          this.trackEdges(x, y, strongEdges, weakEdges, result, width, height);
        }
      }
    }
    
    return result;
  }

  private static trackEdges(x: number, y: number, strongEdges: boolean[][], weakEdges: boolean[][], result: boolean[][], width: number, height: number) {
    if (!isWithinBounds(x, y, width, height) || result[y][x]) return;
    
    result[y][x] = true;
    
    // Check 8-connected neighbors
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        
        const nx = x + dx;
        const ny = y + dy;
        
        if (isWithinBounds(nx, ny, width, height)) {
          if (strongEdges[ny][nx] || weakEdges[ny][nx]) {
            this.trackEdges(nx, ny, strongEdges, weakEdges, result, width, height);
          }
        }
      }
    }
  }
}

// Complete Adaptive Edge Detection Implementation
export class AdaptiveEdgeDetector {
  static detect(imageData: ImageData, options: EdgeDetectionOptions): EdgeDetectionResult {
    const { data } = imageData;
    
    // Calculate adaptive threshold based on image statistics
    const adaptiveThreshold = this.calculateAdaptiveThreshold(data);
    
    // Use Canny with adaptive threshold
    return CannyEdgeDetector.detect(imageData, {
      ...options,
      lowThreshold: adaptiveThreshold * 0.5,
      highThreshold: adaptiveThreshold
    });
  }

  private static calculateAdaptiveThreshold(data: Uint8ClampedArray): number {
    let sum = 0;
    let count = 0;
    
    // Calculate mean intensity
    for (let i = 0; i < data.length; i += 4) {
      const gray = rgbToGrayscale(data[i], data[i + 1], data[i + 2]);
      sum += gray;
      count++;
    }
    
    const mean = sum / count;
    
    // Calculate standard deviation
    let variance = 0;
    for (let i = 0; i < data.length; i += 4) {
      const gray = rgbToGrayscale(data[i], data[i + 1], data[i + 2]);
      variance += Math.pow(gray - mean, 2);
    }
    
    const stdDev = Math.sqrt(variance / count);
    
    // Adaptive threshold: mean + k * stdDev
    return Math.min(255, Math.max(10, mean + 1.5 * stdDev));
  }
}
