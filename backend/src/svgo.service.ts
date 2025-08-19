import { optimize } from 'svgo';

export function optimizeSVG(svg: string): string {
  try {
    const result = optimize(svg, {
      plugins: [
        { name: 'preset-default', params: { overrides: { removeViewBox: false } } },
        'convertStyleToAttrs',
        'removeXMLNS'
      ]
    });
    
    return result.data;
  } catch (error) {
    console.error('SVGO optimization error:', error);
    // Return original SVG if optimization fails
    return svg;
  }
}
