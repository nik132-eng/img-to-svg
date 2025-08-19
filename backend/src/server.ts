import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import cors from '@fastify/cors';
import { convertToSVG } from './vtracer.service';
import { optimizeSVG } from './svgo.service';

const server = Fastify({ 
  logger: true,
  trustProxy: true
});

// Register plugins
await server.register(multipart, {
  limits: { fileSize: 4_000_000 } // 4MB limit
});

await server.register(cors, {
  origin: true,
  credentials: true
});

// Health check endpoint
server.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Main conversion endpoint
server.post('/api/convert', async (request, reply) => {
  try {
    const data = await request.file();
    if (!data) {
      return reply.code(400).send({ error: 'No file provided' });
    }

    // Validate file type
    const mimeType = data.mimetype;
    if (!mimeType || !mimeType.startsWith('image/')) {
      return reply.code(400).send({ error: 'Invalid file type. Only images are allowed.' });
    }

    // Get conversion parameters from query with proper typing
    const query = request.query as Record<string, string | undefined>;
    const colorMode = (query.colorMode || 'color') as 'color' | 'binary';
    const colorPrecision = query.colorPrecision ? parseInt(query.colorPrecision) : 6;
    const filterSpeckle = query.filterSpeckle ? parseInt(query.filterSpeckle) : 4;
    const spliceThreshold = query.spliceThreshold ? parseInt(query.spliceThreshold) : 45;
    const cornerThreshold = query.cornerThreshold ? parseInt(query.cornerThreshold) : 60;
    const hierarchical = (query.hierarchical || 'stacked') as 'stacked' | 'cutout';
    const mode = (query.mode || 'spline') as 'spline' | 'polygon';
    const layerDifference = query.layerDifference ? parseInt(query.layerDifference) : 5;
    const lengthThreshold = query.lengthThreshold ? parseInt(query.lengthThreshold) : 5;
    const maxIterations = query.maxIterations ? parseInt(query.maxIterations) : 2;
    const pathPrecision = query.pathPrecision ? parseInt(query.pathPrecision) : 5;

    // Convert file to buffer
    const buffer = await data.toBuffer();
    
    // Convert image to SVG
    const svg = await convertToSVG(buffer as Buffer, {
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
    });

    // Optimize SVG
    const optimizedSvg = optimizeSVG(svg);

    return { 
      svg: optimizedSvg,
      originalSize: (buffer as Buffer).length,
      svgSize: optimizedSvg.length
    };
  } catch (error) {
    server.log.error('Conversion error:', error);
    return reply.code(500).send({ 
      error: 'Conversion failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Start server
const start = async () => {
  try {
    await server.listen({ 
      port: 3001, 
      host: '0.0.0.0' 
    });
    console.log('🚀 Server running on http://localhost:3001');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
