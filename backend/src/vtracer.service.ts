import { vectorize, ColorMode, Hierarchical, PathSimplifyMode } from '@neplex/vectorizer';

export interface ConversionOptions {
  colorMode?: 'color' | 'binary';
  colorPrecision?: number;
  filterSpeckle?: number;
  spliceThreshold?: number;
  cornerThreshold?: number;
  hierarchical?: 'stacked' | 'cutout';
  mode?: 'spline' | 'polygon';
  layerDifference?: number;
  lengthThreshold?: number;
  maxIterations?: number;
  pathPrecision?: number;
}

export async function convertToSVG(buffer: Buffer, options: ConversionOptions = {}): Promise<string> {
  try {
    const vectorizeOptions = {
      colorMode: options.colorMode === 'binary' ? ColorMode.Binary : ColorMode.Color,
      colorPrecision: options.colorPrecision || 6,
      filterSpeckle: options.filterSpeckle || 4,
      spliceThreshold: options.spliceThreshold || 45,
      cornerThreshold: options.cornerThreshold || 60,
      hierarchical: options.hierarchical === 'cutout' ? Hierarchical.Cutout : Hierarchical.Stacked,
      mode: options.mode === 'polygon' ? PathSimplifyMode.Polygon : PathSimplifyMode.Spline,
      layerDifference: options.layerDifference || 5,
      lengthThreshold: options.lengthThreshold || 5,
      maxIterations: options.maxIterations || 2,
      pathPrecision: options.pathPrecision || 5,
    };
    
    const result = await vectorize(buffer, vectorizeOptions);
    
    return result;
  } catch (error) {
    console.error('VTracer conversion error:', error);
    throw new Error('Failed to convert image to SVG');
  }
}
