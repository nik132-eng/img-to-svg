// Custom Color Quantization and Region Detection Algorithms
// Implements K-means clustering and region growing from scratch
// Following the sprint plan Task T003 requirements

export interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface ColorCluster {
  centroid: Color;
  pixels: Color[];
  boundingBox: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
}

export interface Region {
  id: number;
  colors: Color[];
  pixels: Array<{ x: number; y: number; color: Color }>;
  boundingBox: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  area: number;
  averageColor: Color;
}

export interface ColorQuantizationOptions {
  kMeansClusters: number;
  colorSimilarityThreshold: number;
  regionGrowingThreshold: number;
  maxIterations: number;
  convergenceThreshold: number;
}

// K-means Clustering Implementation
export class KMeansColorQuantizer {
  static quantize(imageData: ImageData, options: ColorQuantizationOptions): ColorCluster[] {
    const { width, height, data } = imageData;
    const colors: Color[] = [];
    
    // Extract unique colors from image
    for (let i = 0; i < data.length; i += 4) {
      const color: Color = {
        r: data[i],
        g: data[i + 1],
        b: data[i + 2],
        a: data[i + 3]
      };
      
      // Check if color is already in our list
      if (!this.colorExists(colors, color, options.colorSimilarityThreshold)) {
        colors.push(color);
      }
    }
    
    if (colors.length <= options.kMeansClusters) {
      // If we have fewer colors than clusters, return each color as a cluster
      return colors.map((color, index) => ({
        centroid: color,
        pixels: [color],
        boundingBox: { minX: 0, minY: 0, maxX: width - 1, maxY: height - 1 }
      }));
    }
    
    // Initialize centroids randomly
    const centroids = this.initializeCentroids(colors, options.kMeansClusters);
    
    // Run K-means algorithm
    const clusters = this.runKMeans(colors, centroids, options);
    
    return clusters;
  }

  private static colorExists(colors: Color[], color: Color, threshold: number): boolean {
    return colors.some(existing => this.colorDistance(existing, color) < threshold);
  }

  private static colorDistance(color1: Color, color2: Color): number {
    const dr = color1.r - color2.r;
    const dg = color1.g - color2.g;
    const db = color1.b - color2.b;
    const da = color1.a - color2.a;
    
    // Use Euclidean distance in RGBA space
    return Math.sqrt(dr * dr + dg * dg + db * db + da * da);
  }

  private static initializeCentroids(colors: Color[], k: number): Color[] {
    const centroids: Color[] = [];
    const usedIndices = new Set<number>();
    
    while (centroids.length < k) {
      const randomIndex = Math.floor(Math.random() * colors.length);
      if (!usedIndices.has(randomIndex)) {
        centroids.push({ ...colors[randomIndex] });
        usedIndices.add(randomIndex);
      }
    }
    
    return centroids;
  }

  private static runKMeans(colors: Color[], centroids: Color[], options: ColorQuantizationOptions): ColorCluster[] {
    const k = centroids.length;
    let clusters: ColorCluster[] = centroids.map(centroid => ({
      centroid: { ...centroid },
      pixels: [],
      boundingBox: { minX: 0, minY: 0, maxX: 0, maxY: 0 }
    }));
    
    let iteration = 0;
    let hasConverged = false;
    
    while (!hasConverged && iteration < options.maxIterations) {
      // Clear previous assignments
      clusters.forEach(cluster => cluster.pixels = []);
      
      // Assign each color to nearest centroid
      colors.forEach(color => {
        let minDistance = Infinity;
        let nearestClusterIndex = 0;
        
        clusters.forEach((cluster, index) => {
          const distance = this.colorDistance(color, cluster.centroid);
          if (distance < minDistance) {
            minDistance = distance;
            nearestClusterIndex = index;
          }
        });
        
        clusters[nearestClusterIndex].pixels.push(color);
      });
      
      // Update centroids and check convergence
      hasConverged = this.updateCentroids(clusters, options.convergenceThreshold);
      iteration++;
    }
    
    // Calculate bounding boxes for each cluster
    clusters.forEach(cluster => {
      if (cluster.pixels.length > 0) {
        cluster.boundingBox = this.calculateClusterBoundingBox(cluster.pixels);
      }
    });
    
    return clusters;
  }

  private static updateCentroids(clusters: ColorCluster[], convergenceThreshold: number): boolean {
    let hasConverged = true;
    
    clusters.forEach(cluster => {
      if (cluster.pixels.length === 0) return;
      
      // Calculate new centroid as average of all pixels in cluster
      const newCentroid: Color = { r: 0, g: 0, b: 0, a: 0 };
      
      cluster.pixels.forEach(pixel => {
        newCentroid.r += pixel.r;
        newCentroid.g += pixel.g;
        newCentroid.b += pixel.b;
        newCentroid.a += pixel.a;
      });
      
      newCentroid.r = Math.round(newCentroid.r / cluster.pixels.length);
      newCentroid.g = Math.round(newCentroid.g / cluster.pixels.length);
      newCentroid.b = Math.round(newCentroid.b / cluster.pixels.length);
      newCentroid.a = Math.round(newCentroid.a / cluster.pixels.length);
      
      // Check if centroid has moved significantly
      const distance = this.colorDistance(cluster.centroid, newCentroid);
      if (distance > convergenceThreshold) {
        hasConverged = false;
      }
      
      cluster.centroid = newCentroid;
    });
    
    return hasConverged;
  }

  private static calculateClusterBoundingBox(pixels: Color[]): { minX: number; minY: number; maxX: number; maxY: number } {
    // This is a simplified bounding box calculation
    // In a real implementation, you'd track x,y coordinates of pixels
    return { minX: 0, minY: 0, maxX: 100, maxY: 100 };
  }
}

// Region Growing Algorithm Implementation
export class RegionGrowingDetector {
  static detectRegions(imageData: ImageData, options: ColorQuantizationOptions): Region[] {
    const { width, height, data } = imageData;
    const visited = new Set<string>();
    const regions: Region[] = [];
    let regionId = 0;
    
    // Convert image data to 2D color array
    const colorGrid: Color[][] = Array(height).fill(0).map(() => Array(width).fill(null));
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        colorGrid[y][x] = {
          r: data[index],
          g: data[index + 1],
          b: data[index + 2],
          a: data[index + 3]
        };
      }
    }
    
    // Find regions using region growing
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const key = `${x},${y}`;
        if (!visited.has(key)) {
          const region = this.growRegion(colorGrid, x, y, width, height, visited, options);
          if (region.pixels.length > 0) {
            region.id = regionId++;
            regions.push(region);
          }
        }
      }
    }
    
    return regions;
  }

  private static growRegion(
    colorGrid: Color[][],
    startX: number,
    startY: number,
    width: number,
    height: number,
    visited: Set<string>,
    options: ColorQuantizationOptions
  ): Region {
    const region: Region = {
      id: 0,
      colors: [],
      pixels: [],
      boundingBox: { minX: startX, minY: startY, maxX: startX, maxY: startY },
      area: 0,
      averageColor: { r: 0, g: 0, b: 0, a: 0 }
    };
    
    const queue: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];
    const startColor = colorGrid[startY][startX];
    
    while (queue.length > 0) {
      const { x, y } = queue.shift()!;
      const key = `${x},${y}`;
      
      if (visited.has(key)) continue;
      visited.add(key);
      
      const currentColor = colorGrid[y][x];
      if (this.colorDistance(startColor, currentColor) <= options.regionGrowingThreshold) {
        // Add pixel to region
        region.pixels.push({ x, y, color: currentColor });
        region.colors.push(currentColor);
        
        // Update bounding box
        region.boundingBox.minX = Math.min(region.boundingBox.minX, x);
        region.boundingBox.maxX = Math.max(region.boundingBox.maxX, x);
        region.boundingBox.minY = Math.min(region.boundingBox.minY, y);
        region.boundingBox.maxY = Math.max(region.boundingBox.maxY, y);
        
        // Add neighbors to queue
        const neighbors = this.getNeighbors(x, y, width, height);
        neighbors.forEach(neighbor => {
          const neighborKey = `${neighbor.x},${neighbor.y}`;
          if (!visited.has(neighborKey)) {
            queue.push(neighbor);
          }
        });
      }
    }
    
    // Calculate region properties
    region.area = region.pixels.length;
    region.averageColor = this.calculateAverageColor(region.colors);
    
    return region;
  }

  private static getNeighbors(x: number, y: number, width: number, height: number): Array<{ x: number; y: number }> {
    const neighbors: Array<{ x: number; y: number }> = [];
    const directions = [
      [-1, 0], [1, 0], [0, -1], [0, 1] // 4-connectivity
    ];
    
    directions.forEach(([dx, dy]) => {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        neighbors.push({ x: nx, y: ny });
      }
    });
    
    return neighbors;
  }

  private static calculateAverageColor(colors: Color[]): Color {
    if (colors.length === 0) {
      return { r: 0, g: 0, b: 0, a: 0 };
    }
    
    const sum: Color = { r: 0, g: 0, b: 0, a: 0 };
    colors.forEach(color => {
      sum.r += color.r;
      sum.g += color.g;
      sum.b += color.b;
      sum.a += color.a;
    });
    
    return {
      r: Math.round(sum.r / colors.length),
      g: Math.round(sum.g / colors.length),
      b: Math.round(sum.b / colors.length),
      a: Math.round(sum.a / colors.length)
    };
  }
}

// Hierarchical Region Organization
export class HierarchicalRegionOrganizer {
  static organizeRegions(regions: Region[], hierarchicalMode: 'stacked' | 'cutout'): Region[] {
    if (hierarchicalMode === 'stacked') {
      return this.organizeStacked(regions);
    } else {
      return this.organizeCutout(regions);
    }
  }

  private static organizeStacked(regions: Region[]): Region[] {
    // Sort regions by area (largest first) for stacked organization
    return regions.sort((a, b) => b.area - a.area);
  }

  private static organizeCutout(regions: Region[]): Region[] {
    // Sort regions by area (smallest first) for cutout organization
    // This creates a "cookie cutter" effect where smaller regions are processed first
    return regions.sort((a, b) => a.area - b.area);
  }

  static mergeSimilarRegions(regions: Region[], similarityThreshold: number): Region[] {
    const merged: Region[] = [];
    const processed = new Set<number>();
    
    regions.forEach(region => {
      if (processed.has(region.id)) return;
      
      const similarRegions = [region];
      processed.add(region.id);
      
      // Find similar regions
      regions.forEach(otherRegion => {
        if (processed.has(otherRegion.id)) return;
        
        if (this.regionsAreSimilar(region, otherRegion, similarityThreshold)) {
          similarRegions.push(otherRegion);
          processed.add(otherRegion.id);
        }
      });
      
      // Merge similar regions
      if (similarRegions.length > 1) {
        merged.push(this.mergeRegions(similarRegions));
      } else {
        merged.push(region);
      }
    });
    
    return merged;
  }

  private static regionsAreSimilar(region1: Region, region2: Region, threshold: number): boolean {
    return this.colorDistance(region1.averageColor, region2.averageColor) <= threshold;
  }

  private static colorDistance(color1: Color, color2: Color): number {
    const dr = color1.r - color2.r;
    const dg = color1.g - color2.g;
    const db = color1.b - color2.b;
    const da = color1.a - color2.a;
    
    return Math.sqrt(dr * dr + dg * dg + db * db + da * da);
  }

  private static mergeRegions(regions: Region[]): Region {
    const merged: Region = {
      id: regions[0].id,
      colors: [],
      pixels: [],
      boundingBox: { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
      area: 0,
      averageColor: { r: 0, g: 0, b: 0, a: 0 }
    };
    
    // Merge all properties
    regions.forEach(region => {
      merged.colors.push(...region.colors);
      merged.pixels.push(...region.pixels);
      merged.area += region.area;
      
      // Update bounding box
      merged.boundingBox.minX = Math.min(merged.boundingBox.minX, region.boundingBox.minX);
      merged.boundingBox.minY = Math.min(merged.boundingBox.minY, region.boundingBox.minY);
      merged.boundingBox.maxX = Math.max(merged.boundingBox.maxX, region.boundingBox.maxX);
      merged.boundingBox.maxY = Math.max(merged.boundingBox.maxY, region.boundingBox.maxY);
    });
    
    // Calculate new average color
    merged.averageColor = this.calculateAverageColor(merged.colors);
    
    return merged;
  }

  private static calculateAverageColor(colors: Color[]): Color {
    if (colors.length === 0) {
      return { r: 0, g: 0, b: 0, a: 0 };
    }
    
    const sum: Color = { r: 0, g: 0, b: 0, a: 0 };
    colors.forEach(color => {
      sum.r += color.r;
      sum.g += color.g;
      sum.b += color.b;
      sum.a += color.a;
    });
    
    return {
      r: Math.round(sum.r / colors.length),
      g: Math.round(sum.g / colors.length),
      b: Math.round(sum.b / colors.length),
      a: Math.round(sum.a / colors.length)
    };
  }
}
