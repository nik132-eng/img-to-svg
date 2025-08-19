'use client';

import { useState } from 'react';
import { ImageUploader } from '@/components/ImageUploader';
import { ConversionSettings, ConversionSettings as ConversionSettingsType } from '@/components/ConversionSettings';

export function UploadSection() {
  const [image, setImage] = useState<File | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [conversionSettings, setConversionSettings] = useState<ConversionSettingsType>({
    colorMode: 'color',
    colorPrecision: 6,
    filterSpeckle: 4,
    spliceThreshold: 45,
    cornerThreshold: 60,
    hierarchical: 'stacked',
    mode: 'spline',
    layerDifference: 5,
    lengthThreshold: 5,
    maxIterations: 2,
    pathPrecision: 5,
  });

  return (
    <section className="space-y-4">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-xl">
        <ImageUploader onImageSelect={setImage} currentImage={image} />
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setShowSettings(true)}
            className="text-sm font-medium text-blue-700 hover:text-blue-800"
          >
            Advanced settings
          </button>
          <span className="text-xs text-gray-500">PNG, JPG, JPEG, GIF, BMP, WebP</span>
        </div>
      </div>

      <ConversionSettings
        isOpen={showSettings}
        onToggle={() => setShowSettings((s) => !s)}
        onSettingsChange={setConversionSettings}
      />
    </section>
  );
}


