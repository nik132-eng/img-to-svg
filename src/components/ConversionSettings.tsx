'use client';

import { useState } from 'react';

interface ConversionSettingsProps {
  onSettingsChange: (settings: ConversionSettings) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export interface ConversionSettings {
  colorMode: 'color' | 'binary';
  colorPrecision: number;
  filterSpeckle: number;
  spliceThreshold: number;
  cornerThreshold: number;
  hierarchical: 'stacked' | 'cutout';
  mode: 'spline' | 'polygon';
  layerDifference: number;
  lengthThreshold: number;
  maxIterations: number;
  pathPrecision: number;
}

const defaultSettings: ConversionSettings = {
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
};

export function ConversionSettings({ onSettingsChange, isOpen, onToggle }: ConversionSettingsProps) {
  const [settings, setSettings] = useState<ConversionSettings>(defaultSettings);
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');

  const handleSettingChange = (key: keyof ConversionSettings, value: string | number) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const resetToDefaults = () => {
    setSettings(defaultSettings);
    onSettingsChange(defaultSettings);
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 z-50"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Advanced Conversion Settings</h2>
            <button
              onClick={onToggle}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-blue-100 mt-2">Customize your SVG conversion for optimal results</p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('basic')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                activeTab === 'basic'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Basic Settings
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                activeTab === 'advanced'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Advanced Options
            </button>
          </div>

          {activeTab === 'basic' && (
            <div className="space-y-6">
              {/* Color Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleSettingChange('colorMode', 'color')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      settings.colorMode === 'color'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-red-500 via-green-500 to-blue-500 rounded mx-auto mb-2"></div>
                      <span className="text-sm font-medium">Color</span>
                    </div>
                  </button>
                  <button
                    onClick={() => handleSettingChange('colorMode', 'binary')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      settings.colorMode === 'binary'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-black to-gray-600 rounded mx-auto mb-2"></div>
                      <span className="text-sm font-medium">Binary</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Color Precision */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color Precision: {settings.colorPrecision}
                </label>
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={settings.colorPrecision}
                  onChange={(e) => handleSettingChange('colorPrecision', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Low Quality</span>
                  <span>High Quality</span>
                </div>
              </div>

              {/* Filter Speckle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter Speckle: {settings.filterSpeckle}px
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={settings.filterSpeckle}
                  onChange={(e) => handleSettingChange('filterSpeckle', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Keep Details</span>
                  <span>Remove Noise</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="space-y-6">
              {/* Hierarchical */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shape Organization
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleSettingChange('hierarchical', 'stacked')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      settings.hierarchical === 'stacked'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="w-8 h-8 bg-gray-200 rounded mx-auto mb-2 flex items-center justify-center">
                        <div className="w-4 h-4 bg-blue-400 rounded"></div>
                      </div>
                      <span className="text-sm font-medium">Stacked</span>
                    </div>
                  </button>
                  <button
                    onClick={() => handleSettingChange('hierarchical', 'cutout')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      settings.hierarchical === 'cutout'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="w-8 h-8 bg-gray-200 rounded mx-auto mb-2 flex items-center justify-center">
                        <div className="w-4 h-4 bg-blue-400 rounded" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
                      </div>
                      <span className="text-sm font-medium">Cutout</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Curve Fitting
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleSettingChange('mode', 'spline')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      settings.mode === 'spline'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <svg className="w-8 h-8 mx-auto mb-2 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="text-sm font-medium">Spline</span>
                    </div>
                  </button>
                  <button
                    onClick={() => handleSettingChange('mode', 'polygon')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      settings.mode === 'polygon'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <svg className="w-8 h-8 mx-auto mb-2 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <span className="text-sm font-medium">Polygon</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Advanced Sliders */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Splice Threshold: {settings.spliceThreshold}°
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={settings.spliceThreshold}
                    onChange={(e) => handleSettingChange('spliceThreshold', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Corner Threshold: {settings.cornerThreshold}°
                  </label>
                  <input
                    type="range"
                    min="30"
                    max="90"
                    value={settings.cornerThreshold}
                    onChange={(e) => handleSettingChange('cornerThreshold', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-6 border-t border-gray-200">
            <button
              onClick={resetToDefaults}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Reset to Defaults
            </button>
            <button
              onClick={onToggle}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105"
            >
              Apply Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
