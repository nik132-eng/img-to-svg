import { ConversionSettings, ColorMode, HierarchicalMode, PathSimplifyMode } from '@/types/conversion';

// Map conversion settings to VTracer format (for backward compatibility)
export function mapSettingsToVTracer(settings: ConversionSettings) {
  return {
    colorMode: settings.colorMode,
    colorPrecision: settings.colorPrecision,
    filterSpeckle: settings.filterSpeckle,
    spliceThreshold: settings.spliceThreshold,
    cornerThreshold: settings.cornerThreshold,
    hierarchical: settings.hierarchical,
    mode: settings.mode,
    layerDifference: settings.layerDifference,
    lengthThreshold: settings.lengthThreshold,
    maxIterations: settings.maxIterations,
    pathPrecision: settings.pathPrecision,
  };
}

// Validate conversion settings
export function validateConversionSettings(settings: ConversionSettings): boolean {
  return (
    settings.colorPrecision >= 1 && settings.colorPrecision <= 8 &&
    settings.filterSpeckle >= 1 && settings.filterSpeckle <= 10 &&
    settings.spliceThreshold >= 10 && settings.spliceThreshold <= 90 &&
    settings.cornerThreshold >= 30 && settings.cornerThreshold <= 90 &&
    settings.layerDifference >= 1 && settings.layerDifference <= 10 &&
    settings.lengthThreshold >= 1 && settings.lengthThreshold <= 10 &&
    settings.maxIterations >= 1 && settings.maxIterations <= 5 &&
    settings.pathPrecision >= 1 && settings.pathPrecision <= 10
  );
}

// Convert string parameters to proper enum values
export function parseSettingsFromParams(searchParams: URLSearchParams): ConversionSettings {
  return {
    colorMode: searchParams.get('colorMode') === '1' ? ColorMode.Binary : ColorMode.Color,
    colorPrecision: parseInt(searchParams.get('colorPrecision') || '6'),
    filterSpeckle: parseInt(searchParams.get('filterSpeckle') || '4'),
    spliceThreshold: parseInt(searchParams.get('spliceThreshold') || '45'),
    cornerThreshold: parseInt(searchParams.get('cornerThreshold') || '60'),
    hierarchical: searchParams.get('hierarchical') === '1' ? HierarchicalMode.Cutout : HierarchicalMode.Stacked,
    mode: searchParams.get('mode') === '2' ? PathSimplifyMode.Spline : PathSimplifyMode.Polygon,
    layerDifference: parseInt(searchParams.get('layerDifference') || '5'),
    lengthThreshold: parseInt(searchParams.get('lengthThreshold') || '5'),
    maxIterations: parseInt(searchParams.get('maxIterations') || '2'),
    pathPrecision: parseInt(searchParams.get('pathPrecision') || '5'),
  };
}

// Get default settings
export function getDefaultSettings(): ConversionSettings {
  return {
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
}
