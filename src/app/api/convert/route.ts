import { NextRequest, NextResponse } from 'next/server';
import { vectorize } from '@neplex/vectorizer';
import { optimize } from 'svgo';

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

    // Get conversion settings from query parameters
    const searchParams = request.nextUrl.searchParams;
    const colorModeParam = searchParams.get('colorMode') || 'color';
    const colorPrecision = parseInt(searchParams.get('colorPrecision') || '6');
    const filterSpeckle = parseInt(searchParams.get('filterSpeckle') || '4');
    const spliceThreshold = parseInt(searchParams.get('spliceThreshold') || '45');
    const cornerThreshold = parseInt(searchParams.get('cornerThreshold') || '60');
    const hierarchicalParam = searchParams.get('hierarchical') || 'stacked';
    const modeParam = searchParams.get('mode') || 'spline';
    const layerDifference = parseInt(searchParams.get('layerDifference') || '5');
    const lengthThreshold = parseInt(searchParams.get('lengthThreshold') || '5');
    const maxIterations = parseInt(searchParams.get('maxIterations') || '2');
    const pathPrecision = parseInt(searchParams.get('pathPrecision') || '5');

    // Convert file to buffer
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Map string parameters to enum values
    const colorMode = colorModeParam === 'color' ? 0 : 1; // ColorMode.Color = 0, ColorMode.Binary = 1
    const hierarchical = hierarchicalParam === 'stacked' ? 0 : 1; // Hierarchical.Stacked = 0, Hierarchical.Cutout = 1
    const mode = modeParam === 'spline' ? 2 : 1; // PathSimplifyMode.Spline = 2, PathSimplifyMode.Polygon = 1

    // Configure VTracer options
    const options = {
      colorMode,
      colorPrecision,
      filterSpeckle,
      spliceThreshold,
      cornerThreshold,
      hierarchical,
      mode,
      layerDifference,
      lengthThreshold,
      maxIterations,
      pathPrecision,
    };

    console.log('Converting image with options:', options);

    // Convert image to SVG using VTracer
    const result = await vectorize(buffer, options);
    
    if (!result) {
      throw new Error('Vectorization failed - no output received');
    }

    let svgContent = result;

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
          colorMode,
          colorPrecision,
          filterSpeckle,
          spliceThreshold,
          cornerThreshold,
          hierarchical,
          mode,
          layerDifference,
          lengthThreshold,
          maxIterations,
          pathPrecision
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
