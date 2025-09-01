'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Color, Region, RegionGrowingDetector } from '../utils/colorQuantization';

interface BackgroundRemovalToolProps {
  imageData: ImageData | null;
  onBackgroundRemoved: (processedImageData: ImageData) => void;
  isOpen: boolean;
  onToggle: () => void;
}

interface UndoState {
  imageData: ImageData;
  timestamp: number;
}

export function BackgroundRemovalTool({ 
  imageData, 
  onBackgroundRemoved, 
  isOpen, 
  onToggle 
}: BackgroundRemovalToolProps) {
  const [selectedColors, setSelectedColors] = useState<Color[]>([]);
  const [tolerance, setTolerance] = useState(30);
  const [isProcessing, setIsProcessing] = useState(false);
  const [undoStack, setUndoStack] = useState<UndoState[]>([]);
  const [redoStack, setRedoStack] = useState<UndoState[]>([]);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Save current state to undo stack
  const saveToUndoStack = useCallback((currentImageData: ImageData) => {
    const undoState: UndoState = {
      imageData: new ImageData(
        new Uint8ClampedArray(currentImageData.data),
        currentImageData.width,
        currentImageData.height
      ),
      timestamp: Date.now()
    };
    
    setUndoStack(prev => [...prev, undoState]);
    setRedoStack([]); // Clear redo stack when new action is performed
  }, []);

  // Initialize canvas when image data changes
  useEffect(() => {
    if (imageData && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        ctx.putImageData(imageData, 0, 0);
        
        // Save initial state to undo stack
        saveToUndoStack(imageData);
      }
    }
  }, [imageData, saveToUndoStack]);

  // Undo functionality
  const undo = useCallback(() => {
    if (undoStack.length > 1) {
      const currentState = undoStack[undoStack.length - 1];
      const previousState = undoStack[undoStack.length - 2];
      
      // Move current state to redo stack
      setRedoStack(prev => [...prev, currentState]);
      
      // Restore previous state
      setUndoStack(prev => prev.slice(0, -1));
      
      // Apply the previous state
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.putImageData(previousState.imageData, 0, 0);
          onBackgroundRemoved(previousState.imageData);
        }
      }
    }
  }, [undoStack, onBackgroundRemoved]);

  // Redo functionality
  const redo = useCallback(() => {
    if (redoStack.length > 0) {
      const nextState = redoStack[redoStack.length - 1];
      
      // Move current state to undo stack
      const currentState = undoStack[undoStack.length - 1];
      setUndoStack(prev => [...prev, currentState]);
      
      // Remove from redo stack
      setRedoStack(prev => prev.slice(0, -1));
      
      // Apply the next state
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.putImageData(nextState.imageData, 0, 0);
          onBackgroundRemoved(nextState.imageData);
        }
      }
    }
  }, [redoStack, undoStack, onBackgroundRemoved]);

  // Color-based background removal
  const removeBackgroundByColor = useCallback(async () => {
    if (!imageData || !canvasRef.current) return;
    
    setIsProcessing(true);
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const newImageData = new ImageData(
        new Uint8ClampedArray(imageData.data),
        imageData.width,
        imageData.height
      );
      
      // Process each pixel
      for (let i = 0; i < newImageData.data.length; i += 4) {
        const r = newImageData.data[i];
        const g = newImageData.data[i + 1];
        const b = newImageData.data[i + 2];
        const a = newImageData.data[i + 3];
        
        const currentColor: Color = { r, g, b, a };
        
        // Check if current color matches any selected color within tolerance
        const shouldRemove = selectedColors.some(selectedColor => {
          const distance = colorDistance(currentColor, selectedColor);
          return distance <= tolerance;
        });
        
        if (shouldRemove) {
          // Make pixel transparent
          newImageData.data[i + 3] = 0;
        }
      }
      
      // Apply the processed image
      ctx.putImageData(newImageData, 0, 0);
      
      // Save to undo stack and notify parent
      saveToUndoStack(newImageData);
      onBackgroundRemoved(newImageData);
      
    } catch (error) {
      console.error('Error removing background by color:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [imageData, selectedColors, tolerance, saveToUndoStack, onBackgroundRemoved]);

  // Region-based background removal
  const removeBackgroundByRegion = useCallback(async () => {
    if (!imageData || !canvasRef.current) return;
    
    setIsProcessing(true);
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Use region growing to detect background regions
      const regions = RegionGrowingDetector.detectRegions(imageData, {
        colorSimilarityThreshold: tolerance,
        regionGrowingThreshold: tolerance * 0.5,
        kMeansClusters: 8,
        maxIterations: 10,
        convergenceThreshold: 0.01
      });
      
      // Find background regions (usually larger regions at edges)
      const backgroundRegions = regions.filter((region: Region) => {
        const { minX, minY, maxX, maxY } = region.boundingBox;
        const isAtEdge = minX === 0 || minY === 0 || 
                        maxX === imageData.width - 1 || 
                        maxY === imageData.height - 1;
        const isLarge = region.area > (imageData.width * imageData.height * 0.1);
        
        return isAtEdge && isLarge;
      });
      
      const newImageData = new ImageData(
        new Uint8ClampedArray(imageData.data),
        imageData.width,
        imageData.height
      );
      
      // Remove background regions
      backgroundRegions.forEach((region: Region) => {
        region.pixels.forEach(({ x, y }: { x: number; y: number }) => {
          const index = (y * imageData.width + x) * 4;
          newImageData.data[index + 3] = 0; // Make transparent
        });
      });
      
      // Apply the processed image
      ctx.putImageData(newImageData, 0, 0);
      
      // Save to undo stack and notify parent
      saveToUndoStack(newImageData);
      onBackgroundRemoved(newImageData);
      
    } catch (error) {
      console.error('Error removing background by region:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [imageData, tolerance, saveToUndoStack, onBackgroundRemoved]);

  // One-click background removal (combines both methods)
  const removeBackgroundOneClick = useCallback(async () => {
    if (!imageData || !canvasRef.current) return;
    
    setIsProcessing(true);
    
    try {
      // First, try region-based removal
      await removeBackgroundByRegion();
      
      // Then, apply color-based removal for any remaining background pixels
      setTimeout(() => {
        removeBackgroundByColor();
      }, 100);
      
    } catch (error) {
      console.error('Error in one-click background removal:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [imageData, removeBackgroundByRegion, removeBackgroundByColor]);

  // Color distance calculation
  const colorDistance = (color1: Color, color2: Color): number => {
    const dr = color1.r - color2.r;
    const dg = color1.g - color2.g;
    const db = color1.b - color2.b;
    const da = color1.a - color2.a;
    
    return Math.sqrt(dr * dr + dg * dg + db * db + da * da);
  };

  // Add color to selection
  const addColorToSelection = useCallback((color: Color) => {
    setSelectedColors(prev => [...prev, color]);
  }, []);

  // Remove color from selection
  const removeColorFromSelection = useCallback((index: number) => {
    setSelectedColors(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Color picker from canvas
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const pixel = ctx.getImageData(x, y, 1, 1);
      const color: Color = {
        r: pixel.data[0],
        g: pixel.data[1],
        b: pixel.data[2],
        a: pixel.data[3]
      };
      
      addColorToSelection(color);
    }
  }, [addColorToSelection]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Background Removal Tool</h2>
          <button
            onClick={onToggle}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left side - Canvas and controls */}
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">Image Preview</h3>
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  onClick={handleCanvasClick}
                  className="border rounded cursor-crosshair max-w-full h-auto"
                  style={{ maxHeight: '400px' }}
                />
                <div className="text-sm text-gray-600 mt-2">
                  Click on the image to select colors for removal
                </div>
              </div>
            </div>

            {/* Undo/Redo controls */}
            <div className="flex gap-2">
              <button
                onClick={undo}
                disabled={undoStack.length <= 1}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Undo
              </button>
              <button
                onClick={redo}
                disabled={redoStack.length === 0}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Redo
              </button>
            </div>
          </div>

          {/* Right side - Controls and settings */}
          <div className="space-y-4">
            {/* Tolerance control */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">Color Tolerance</h3>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={tolerance}
                  onChange={(e) => setTolerance(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-mono w-12">{tolerance}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Higher values remove more similar colors
              </p>
            </div>

            {/* Selected colors */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">Selected Colors ({selectedColors.length})</h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {selectedColors.map((color, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded border"
                      style={{
                        backgroundColor: `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a / 255})`
                      }}
                    />
                    <span className="text-sm font-mono">
                      RGB({color.r}, {color.g}, {color.b})
                    </span>
                    <button
                      onClick={() => removeColorFromSelection(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {selectedColors.length === 0 && (
                  <p className="text-sm text-gray-500">No colors selected. Click on the image to add colors.</p>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <button
                onClick={removeBackgroundByColor}
                disabled={isProcessing || selectedColors.length === 0}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Remove Background by Color'}
              </button>
              
              <button
                onClick={removeBackgroundByRegion}
                disabled={isProcessing}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Remove Background by Region'}
              </button>
              
              <button
                onClick={removeBackgroundOneClick}
                disabled={isProcessing}
                className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'One-Click Background Removal'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
