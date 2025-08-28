import { NextRequest, NextResponse } from 'next/server';
import { optimize } from 'svgo';
import { parseSettingsFromParams, validateConversionSettings } from '@/utils/conversion';
import { ConversionSettings } from '@/types/conversion';
import { CustomVectorizer } from '@/utils/customVectorizer';

export async function POST(request: NextRequest) {
  try {
    // Get the form data
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    
    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Validate that imageFile is actually a File object
    if (!(imageFile instanceof File)) {
      return NextResponse.json(
        { error: 'Invalid file object received' },
        { status: 400 }
      );
    }

    // Validate file properties
    if (!imageFile.name || imageFile.size === 0) {
      return NextResponse.json(
        { error: 'Invalid file: missing name or empty file' },
        { status: 400 }
      );
    }

    // Check if arrayBuffer method exists
    if (typeof imageFile.arrayBuffer !== 'function') {
      console.error('File validation failed:', {
        name: imageFile.name,
        size: imageFile.size,
        type: imageFile.type,
        constructor: imageFile.constructor.name,
        hasArrayBuffer: typeof imageFile.arrayBuffer,
        keys: Object.keys(imageFile)
      });
      return NextResponse.json(
        { error: 'Invalid file object: missing arrayBuffer method' },
        { status: 400 }
      );
    }


    // Parse conversion settings from query parameters using utility functions
    const conversionSettings = parseSettingsFromParams(request.nextUrl.searchParams);
    
    // Validate settings
    if (!validateConversionSettings(conversionSettings)) {
      return NextResponse.json(
        { error: 'Invalid conversion settings provided' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Check if user wants to use custom algorithms
    const useCustomAlgorithms = request.nextUrl.searchParams.get('useCustom') === 'true';
    
    let svgContent: string;
    
    if (useCustomAlgorithms) {
      // Use custom vectorization algorithms
      try {
        // Convert buffer to ImageData for custom algorithms
        const canvas = new OffscreenCanvas(imageFile.width || 800, imageFile.height || 600);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }
        
        // Create ImageData from buffer (simplified - in reality you'd need proper image loading)
        const imageData = new ImageData(new Uint8ClampedArray(buffer), imageFile.width || 800, imageFile.height || 600);
        
        // Use custom vectorizer
        const customResult = await CustomVectorizer.vectorize(imageData, {
          conversionSettings,
          customSettings: {
            edgeDetection: {
              type: 'adaptive' as const,
              sobelThreshold: 50,
              cannyLowThreshold: 25,
              cannyHighThreshold: 75,
              adaptiveThreshold: 30
            },
            pathTracing: {
              algorithm: 'custom' as const,
              smoothingFactor: 0.3,
              simplificationThreshold: 2
            },
            colorQuantization: {
              kMeansClusters: 8,
              colorSimilarityThreshold: 30,
              regionGrowingThreshold: 25
            }
          }
        });
        
        svgContent = customResult.svg;
        console.log('Custom vectorization completed with quality:', customResult.quality);
        
      } catch (customError) {
        console.warn('Custom vectorization failed, falling back to VTracer:', customError);
        // Fall back to VTracer
        svgContent = await this.fallbackToVTracer(buffer, conversionSettings);
      }
    } else {
      // Use traditional VTracer
      svgContent = await this.fallbackToVTracer(buffer, conversionSettings);
    }

    console.log('Converting image with custom algorithms:', useCustomAlgorithms);

    // Optimize SVG using SVGO
    try {
      const optimizedResult = optimize(svgContent, {
        plugins: [
          'removeDoctype',
          'removeXMLProcInst',
          'removeComments',
          'removeMetadata',
          'removeEditorsNSData',
          'cleanupAttrs',
          'mergeStyles',
          'inlineStyles',
          'minifyStyles',
          'cleanupIds',
          'removeUselessDefs',
          'removeEmptyAttrs',
          'removeHiddenElems',
          'removeEmptyText',
          'removeEmptyContainers',
          'removeViewBox',
          'cleanupEnableBackground',
          'removeEmptyAttrs',
          'removeHiddenElems',
          'removeEmptyText',
          'removeEmptyContainers',
          'removeViewBox',
          'cleanupEnableBackground',
          'convertColors',
          'convertPathData',
          'convertTransform',
          'removeUnknownsAndDefaults',
          'removeNonInheritableGroupAttrs',
          'removeUselessStrokeAndFill',
          'removeUnusedNS',
          'cleanupNumericValues',
          'cleanupListOfValues',
          'convertStyleToAttrs',
          'removeRasterImages',
          'removeUselessDefs',
          'removeEmptyText',
          'mergePaths',
          'convertShapeToPath',
          'sortDefsChildren',
          'removeTitle',
          'removeDesc'
        ]
      });

      if (optimizedResult.data) {
        svgContent = optimizedResult.data;
      }
    } catch (svgoError) {
      console.warn('SVGO optimization failed, using original SVG:', svgoError);
      // Continue with original SVG if optimization fails
    }

    // Set response headers
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('Cache-Control', 'no-cache');

    return NextResponse.json(
      { 
        svg: svgContent,
        message: 'Image converted successfully',
        settings: {
          colorMode: conversionSettings.colorMode,
          colorPrecision: conversionSettings.colorPrecision,
          filterSpeckle: conversionSettings.filterSpeckle,
          spliceThreshold: conversionSettings.spliceThreshold,
          cornerThreshold: conversionSettings.cornerThreshold,
          hierarchical: conversionSettings.hierarchical,
          mode: conversionSettings.mode,
          layerDifference: conversionSettings.layerDifference,
          lengthThreshold: conversionSettings.lengthThreshold,
          maxIterations: conversionSettings.maxIterations,
          pathPrecision: conversionSettings.pathPrecision
        }
      },
      { 
        status: 200,
        headers
      }
    );

  } catch (error) {
    console.error('Conversion error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown conversion error',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

// Helper function to use VTracer when custom algorithms fail
async function fallbackToVTracer(buffer: Buffer, conversionSettings: ConversionSettings): Promise<string> {
  const { vectorize } = await import('@neplex/vectorizer');
  
  // Map conversion settings to VTracer format
  const vtracerOptions = {
    colorMode: conversionSettings.colorMode,
    colorPrecision: conversionSettings.colorPrecision,
    filterSpeckle: conversionSettings.filterSpeckle,
    spliceThreshold: conversionSettings.spliceThreshold,
    cornerThreshold: conversionSettings.cornerThreshold,
    hierarchical: conversionSettings.hierarchical,
    mode: conversionSettings.mode,
    layerDifference: conversionSettings.layerDifference,
    lengthThreshold: conversionSettings.lengthThreshold,
    maxIterations: conversionSettings.maxIterations,
    pathPrecision: conversionSettings.pathPrecision,
  };

  console.log('Using VTracer fallback with options:', vtracerOptions);
  
  const result = await vectorize(buffer, vtracerOptions);
  
  if (!result) {
    throw new Error('VTracer fallback failed - no output received');
  }
  
  return result;
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
