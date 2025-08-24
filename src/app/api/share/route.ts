import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

// In-memory storage for shared SVGs (in production, use Redis or database)
// This is temporary storage that will be cleared after 24 hours
const sharedSvgs = new Map<string, { svgContent: string; fileName: string; createdAt: number }>();

// Debug logging
console.log('🔄 Share API initialized. Current shared SVGs count:', sharedSvgs.size);

// Clean up old entries every hour
setInterval(() => {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  
  let cleanedCount = 0;
  for (const [id, data] of sharedSvgs.entries()) {
    if (now - data.createdAt > oneDay) {
      sharedSvgs.delete(id);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned up ${cleanedCount} expired share links. Remaining: ${sharedSvgs.size}`);
  }
}, 60 * 60 * 1000); // Run every hour

export async function POST(request: NextRequest) {
  try {
    const { svgContent, fileName } = await request.json();

    if (!svgContent) {
      return NextResponse.json(
        { error: 'SVG content is required' },
        { status: 400 }
      );
    }

    // Generate a unique 8-character share ID
    const shareId = randomBytes(4).toString('hex');
    
    // Store the SVG content with metadata
    sharedSvgs.set(shareId, {
      svgContent,
      fileName: fileName || 'converted.svg',
      createdAt: Date.now(),
    });

    console.log(`✅ Share link created: ${shareId} for file: ${fileName || 'converted.svg'}`);
    console.log(`📊 Total shared SVGs: ${sharedSvgs.size}`);

    // Return the share ID
    return NextResponse.json({
      shareId,
      message: 'Share link created successfully',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
    });

  } catch (error) {
    console.error('❌ Error creating share link:', error);
    return NextResponse.json(
      { error: 'Failed to create share link' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shareId = searchParams.get('id');

    if (!shareId) {
      console.log('❌ GET request missing share ID');
      return NextResponse.json(
        { error: 'Share ID is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Looking for share ID: ${shareId}`);
    console.log(`📊 Available share IDs: ${Array.from(sharedSvgs.keys()).join(', ')}`);

    const sharedData = sharedSvgs.get(shareId);
    
    if (!sharedData) {
      console.log(`❌ Share ID ${shareId} not found`);
      return NextResponse.json(
        { error: 'Share link not found or expired' },
        { status: 404 }
      );
    }

    console.log(`✅ Found share ID: ${shareId} for file: ${sharedData.fileName}`);

    // Return the shared SVG data
    return NextResponse.json({
      shareId,
      svgContent: sharedData.svgContent,
      fileName: sharedData.fileName,
      createdAt: sharedData.createdAt,
      expiresAt: new Date(sharedData.createdAt + 24 * 60 * 60 * 1000).toISOString(),
    });

  } catch (error) {
    console.error('❌ Error retrieving shared SVG:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve shared SVG' },
      { status: 500 }
    );
  }
}
