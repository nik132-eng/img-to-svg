// Custom Path Tracing Algorithms
// Implements Moore-Neighbor and Square Tracing algorithms from scratch
// Following the sprint plan Task T002 requirements

export interface PathPoint {
  x: number;
  y: number;
}

export interface Path {
  points: PathPoint[];
  isClosed: boolean;
  boundingBox: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
}

export interface PathTracingOptions {
  algorithm: 'moore-neighbor' | 'square-tracing' | 'custom';
  smoothingFactor: number;
  simplificationThreshold: number;
  minPathLength: number;
}

// Moore-Neighbor Tracing Algorithm Implementation
export class MooreNeighborTracer {
  // 8-directional neighborhood (clockwise from top-left)
  private static readonly DIRECTIONS = [
    [-1, -1], [0, -1], [1, -1],  // Top-left, Top, Top-right
    [1, 0], [1, 1], [0, 1],      // Right, Bottom-right, Bottom
    [-1, 1], [-1, 0]             // Bottom-left, Left
  ];

  static tracePath(edgeMap: boolean[][], startPoint: PathPoint): Path {
    const height = edgeMap.length;
    const width = edgeMap[0].length;
    const path: PathPoint[] = [];
    const visited = new Set<string>();
    
    let currentPoint = { ...startPoint };
    let direction = 0; // Start with top-left direction
    
    do {
      const key = `${currentPoint.x},${currentPoint.y}`;
      if (visited.has(key)) break;
      
      visited.add(key);
      path.push({ ...currentPoint });
      
      // Find next edge pixel
      const nextPoint = this.findNextPixel(edgeMap, currentPoint, direction, width, height);
      if (!nextPoint) break;
      
      // Update direction for next iteration
      direction = this.updateDirection(currentPoint, nextPoint, direction);
      currentPoint = nextPoint;
      
    } while (path.length < width * height); // Safety limit
    
    return this.processPath(path);
  }

  private static findNextPixel(
    edgeMap: boolean[][], 
    current: PathPoint, 
    startDirection: number, 
    width: number, 
    height: number
  ): PathPoint | null {
    // Search in 8 directions starting from startDirection
    for (let i = 0; i < 8; i++) {
      const dirIndex = (startDirection + i) % 8;
      const [dx, dy] = this.DIRECTIONS[dirIndex];
      const nextX = current.x + dx;
      const nextY = current.y + dy;
      
      if (this.isValidPixel(nextX, nextY, width, height) && edgeMap[nextY][nextX]) {
        return { x: nextX, y: nextY };
      }
    }
    
    return null;
  }

  private static updateDirection(current: PathPoint, next: PathPoint, currentDirection: number): number {
    const dx = next.x - current.x;
    const dy = next.y - current.y;
    
    // Find the direction index
    for (let i = 0; i < this.DIRECTIONS.length; i++) {
      const [dirDx, dirDy] = this.DIRECTIONS[i];
      if (dirDx === dx && dirDy === dy) {
        // Return the opposite direction for next search
        return (i + 4) % 8;
      }
    }
    
    return currentDirection;
  }

  private static isValidPixel(x: number, y: number, width: number, height: number): boolean {
    return x >= 0 && x < width && y >= 0 && y < height;
  }

  private static processPath(points: PathPoint[]): Path {
    if (points.length === 0) {
      return { points: [], isClosed: false, boundingBox: { minX: 0, minY: 0, maxX: 0, maxY: 0 } };
    }

    // Calculate bounding box
    const minX = Math.min(...points.map(p => p.x));
    const maxX = Math.max(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y));
    const maxY = Math.max(...points.map(p => p.y));

    // Check if path is closed (start and end points are close)
    const isClosed = points.length > 2 && 
      Math.abs(points[0].x - points[points.length - 1].x) <= 1 &&
      Math.abs(points[0].y - points[points.length - 1].y) <= 1;

    return {
      points,
      isClosed,
      boundingBox: { minX, minY, maxX, maxY }
    };
  }
}

// Square Tracing Algorithm Implementation
export class SquareTracer {
  static tracePath(edgeMap: boolean[][], startPoint: PathPoint): Path {
    const height = edgeMap.length;
    const width = edgeMap[0].length;
    const path: PathPoint[] = [];
    const visited = new Set<string>();
    
    let currentPoint = { ...startPoint };
    let direction = 0; // 0: right, 1: down, 2: left, 3: up
    
    do {
      const key = `${currentPoint.x},${currentPoint.y}`;
      if (visited.has(key)) break;
      
      visited.add(key);
      path.push({ ...currentPoint });
      
      // Find next edge pixel using square tracing
      const nextPoint = this.findNextPixel(edgeMap, currentPoint, direction, width, height);
      if (!nextPoint) break;
      
      // Update direction based on next pixel position
      direction = this.updateDirection(currentPoint, nextPoint, direction);
      currentPoint = nextPoint;
      
    } while (path.length < width * height); // Safety limit
    
    return this.processPath(path);
  }

  private static findNextPixel(
    edgeMap: boolean[][], 
    current: PathPoint, 
    direction: number, 
    width: number, 
    height: number
  ): PathPoint | null {
    // Square tracing: check 4 directions in order
    const directions = [
      [1, 0],   // Right
      [0, 1],   // Down
      [-1, 0],  // Left
      [0, -1]   // Up
    ];
    
    // Start checking from current direction
    for (let i = 0; i < 4; i++) {
      const dirIndex = (direction + i) % 4;
      const [dx, dy] = directions[dirIndex];
      const nextX = current.x + dx;
      const nextY = current.y + dy;
      
      if (this.isValidPixel(nextX, nextY, width, height) && edgeMap[nextY][nextX]) {
        return { x: nextX, y: nextY };
      }
    }
    
    return null;
  }

  private static updateDirection(current: PathPoint, next: PathPoint, currentDirection: number): number {
    const dx = next.x - current.x;
    const dy = next.y - current.y;
    
    if (dx === 1 && dy === 0) return 0;      // Right
    if (dx === 0 && dy === 1) return 1;      // Down
    if (dx === -1 && dy === 0) return 2;     // Left
    if (dx === 0 && dy === -1) return 3;     // Up
    
    return currentDirection;
  }

  private static isValidPixel(x: number, y: number, width: number, height: number): boolean {
    return x >= 0 && x < width && y >= 0 && y < height;
  }

  private static processPath(points: PathPoint[]): Path {
    if (points.length === 0) {
      return { points: [], isClosed: false, boundingBox: { minX: 0, minY: 0, maxX: 0, maxY: 0 } };
    }

    // Calculate bounding box
    const minX = Math.min(...points.map(p => p.x));
    const maxX = Math.max(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y));
    const maxY = Math.max(...points.map(p => p.y));

    // Check if path is closed
    const isClosed = points.length > 2 && 
      Math.abs(points[0].x - points[points.length - 1].x) <= 1 &&
      Math.abs(points[0].y - points[points.length - 1].y) <= 1;

    return {
      points,
      isClosed,
      boundingBox: { minX, minY, maxX, maxY }
    };
  }
}

// Custom Path Tracing with Bezier Curve Fitting
export class CustomPathTracer {
  static tracePath(edgeMap: boolean[][], startPoint: PathPoint, options: PathTracingOptions): Path {
    // Use Moore-Neighbor for initial tracing
    const rawPath = MooreNeighborTracer.tracePath(edgeMap, startPoint);
    
    // Apply smoothing and simplification
    const smoothedPath = this.smoothPath(rawPath.points, options.smoothingFactor);
    const simplifiedPath = this.simplifyPath(smoothedPath, options.simplificationThreshold);
    
    // Filter out paths that are too short
    if (simplifiedPath.length < options.minPathLength) {
      return { points: [], isClosed: false, boundingBox: { minX: 0, minY: 0, maxX: 0, maxY: 0 } };
    }
    
    return {
      points: simplifiedPath,
      isClosed: rawPath.isClosed,
      boundingBox: this.calculateBoundingBox(simplifiedPath)
    };
  }

  private static smoothPath(points: PathPoint[], smoothingFactor: number): PathPoint[] {
    if (points.length < 3) return points;
    
    const smoothed: PathPoint[] = [];
    const factor = Math.max(0, Math.min(1, smoothingFactor));
    
    for (let i = 0; i < points.length; i++) {
      if (i === 0 || i === points.length - 1) {
        smoothed.push(points[i]);
        continue;
      }
      
      const prev = points[i - 1];
      const current = points[i];
      const next = points[i + 1];
      
      // Apply weighted average smoothing
      const smoothedX = current.x * (1 - factor) + (prev.x + next.x) * factor * 0.5;
      const smoothedY = current.y * (1 - factor) + (prev.y + next.y) * factor * 0.5;
      
      smoothed.push({
        x: Math.round(smoothedX),
        y: Math.round(smoothedY)
      });
    }
    
    return smoothed;
  }

  private static simplifyPath(points: PathPoint[], threshold: number): PathPoint[] {
    if (points.length < 3) return points;
    
    const simplified: PathPoint[] = [points[0]];
    let lastPoint = points[0];
    
    for (let i = 1; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      
      // Calculate perpendicular distance from current point to line segment
      const distance = this.perpendicularDistance(current, lastPoint, next);
      
      if (distance > threshold) {
        simplified.push(current);
        lastPoint = current;
      }
    }
    
    simplified.push(points[points.length - 1]);
    return simplified;
  }

  private static perpendicularDistance(point: PathPoint, lineStart: PathPoint, lineEnd: PathPoint): number {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) return Math.sqrt(A * A + B * B);
    
    const param = dot / lenSq;
    let xx, yy;
    
    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
    } else {
      xx = lineStart.x + param * C;
      yy = lineStart.y + param * D;
    }
    
    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private static calculateBoundingBox(points: PathPoint[]): { minX: number; minY: number; maxX: number; maxY: number } {
    if (points.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }

    const minX = Math.min(...points.map(p => p.x));
    const maxX = Math.max(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y));
    const maxY = Math.max(...points.map(p => p.y));

    return { minX, minY, maxX, maxY };
  }
}

// Path Tracing Factory
export class PathTracingFactory {
  static createTracer(algorithm: string): typeof MooreNeighborTracer | typeof SquareTracer | typeof CustomPathTracer {
    switch (algorithm) {
      case 'moore-neighbor':
        return MooreNeighborTracer;
      case 'square-tracing':
        return SquareTracer;
      case 'custom':
        return CustomPathTracer;
      default:
        return MooreNeighborTracer; // Default fallback
    }
  }

  static traceAllPaths(edgeMap: boolean[][], options: PathTracingOptions): Path[] {
    const height = edgeMap.length;
    const width = edgeMap[0].length;
    const paths: Path[] = [];
    const visited = new Set<string>();
    
    // Find all starting points (edge pixels that haven't been visited)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const key = `${x},${y}`;
        if (edgeMap[y][x] && !visited.has(key)) {
          const tracer = this.createTracer(options.algorithm);
          const path = tracer.tracePath(edgeMap, { x, y }, options);
          
          if (path.points.length >= options.minPathLength) {
            paths.push(path);
            
            // Mark all points in this path as visited
            path.points.forEach((point: PathPoint) => {
              visited.add(`${point.x},${point.y}`);
            });
          }
        }
      }
    }
    
    return paths;
  }
}
