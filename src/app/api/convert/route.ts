import { NextRequest, NextResponse } from 'next/server';
import { optimize } from 'svgo';
import { parseSettingsFromParams, validateConversionSettings } from '@/utils/conversion';

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

    // Use VTracer for now (custom algorithms can be added later)
    const { vectorize } = await import('@neplex/vectorizer');
    
    // Convert our settings to VTracer format
    const vtracerSettings = {
      colorMode: conversionSettings.colorMode as number,
      colorPrecision: conversionSettings.colorPrecision,
      filterSpeckle: conversionSettings.filterSpeckle,
      spliceThreshold: conversionSettings.spliceThreshold,
      cornerThreshold: conversionSettings.cornerThreshold,
      hierarchical: conversionSettings.hierarchical as number,
      mode: conversionSettings.mode as number,
      layerDifference: conversionSettings.layerDifference,
      lengthThreshold: conversionSettings.lengthThreshold,
      maxIterations: conversionSettings.maxIterations,
      pathPrecision: conversionSettings.pathPrecision,
    };
    
    let svgContent = await vectorize(buffer, vtracerSettings);

    console.log('Converting image with VTracer');

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
