"use client";

import React, { useRef, useEffect } from 'react';

interface NoiseProps {
  patternSize?: number;
  patternScaleX?: number; // How much to scale the noise pattern tiling horizontally
  patternScaleY?: number; // How much to scale the noise pattern tiling vertically
  patternRefreshInterval?: number;
  patternAlpha?: number;
  intensity?: number;
}

let globalPatternCanvas: HTMLCanvasElement | null = null;

function getSharedPatternCanvas(patternSize = 80, intensity = 1, patternAlpha = 40): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  if (globalPatternCanvas) return globalPatternCanvas;

  try {
    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = patternSize;
    patternCanvas.height = patternSize;
    const patternCtx = patternCanvas.getContext('2d');
    if (!patternCtx) return null;

    const patternData = patternCtx.createImageData(patternSize, patternSize);
    const patternPixelDataLength = patternSize * patternSize * 4;
    for (let i = 0; i < patternPixelDataLength; i += 4) {
      const value = Math.random() * 255 * intensity;
      patternData.data[i] = value;
      patternData.data[i + 1] = value;
      patternData.data[i + 2] = value;
      patternData.data[i + 3] = patternAlpha;
    }
    patternCtx.putImageData(patternData, 0, 0);
    globalPatternCanvas = patternCanvas;
    return globalPatternCanvas;
  } catch {
    return null;
  }
}

// Noise component integrated into the background
function Noise({
  patternSize = 80,
  patternScaleX = 1,
  patternScaleY = 1,
  patternRefreshInterval = 0,
  patternAlpha = 40,
  intensity = 1,
}: NoiseProps) {
  const grainRef = useRef<HTMLCanvasElement | null>(null);
  const canvasCssSizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });

  useEffect(() => {
    const canvas = grainRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let patternCanvas = getSharedPatternCanvas(patternSize, intensity, patternAlpha);
    if (!patternCanvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      let newCssWidth = window.innerWidth;
      let newCssHeight = window.innerHeight;

      if (canvas.parentElement) {
        const parentRect = canvas.parentElement.getBoundingClientRect();
        newCssWidth = parentRect.width;
        newCssHeight = parentRect.height;
      }

      canvasCssSizeRef.current = { width: newCssWidth, height: newCssHeight };
      canvas.width = newCssWidth * dpr;
      canvas.height = newCssHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const drawGrain = () => {
      const { width: cssWidth, height: cssHeight } = canvasCssSizeRef.current;
      if (cssWidth === 0 || cssHeight === 0) return;

      ctx.clearRect(0, 0, cssWidth, cssHeight);
      ctx.save();
      const safePatternScaleX = Math.max(0.001, patternScaleX);
      const safePatternScaleY = Math.max(0.001, patternScaleY);
      ctx.scale(safePatternScaleX, safePatternScaleY);

      if (patternCanvas) {
        const fillPattern = ctx.createPattern(patternCanvas, 'repeat');
        if (fillPattern) {
          ctx.fillStyle = fillPattern;
          ctx.fillRect(0, 0, cssWidth / safePatternScaleX, cssHeight / safePatternScaleY);
        }
      }
      ctx.restore();
    };

    let rafId: number | null = null;
    const handleResize = () => {
      resize();
      drawGrain();
    };

    window.addEventListener('resize', handleResize);

    // Yield to browser main thread before drawing noise texture
    rafId = window.requestAnimationFrame(() => {
      resize();
      drawGrain();
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [patternSize, patternScaleX, patternScaleY, patternRefreshInterval, patternAlpha, intensity]);

  return <canvas className="absolute inset-0 w-full h-full pointer-events-none" ref={grainRef} />;
}

export interface ColorStop {
  color: string;
  stop: string;
}

export type GradientType = 'radial-gradient' | 'linear-gradient' | 'conic-gradient' | string;

export type GradientOrigin =
  | 'bottom-middle'
  | 'bottom-left'
  | 'bottom-right'
  | 'top-middle'
  | 'top-left'
  | 'top-right'
  | 'left-middle'
  | 'right-middle'
  | 'center'
  | string;

export interface GradientBackgroundProps {
  gradientType?: GradientType;
  gradientSize?: string;
  gradientOrigin?: GradientOrigin;
  colors?: ColorStop[];
  enableNoise?: boolean;
  noisePatternSize?: number;
  noisePatternScaleX?: number;
  noisePatternScaleY?: number;
  noisePatternRefreshInterval?: number;
  noisePatternAlpha?: number;
  noiseIntensity?: number;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  customGradient?: string | null;
}

// Main gradient background component
function GradientBackground({
  // Gradient customization
  gradientType = 'radial-gradient',
  gradientSize = '125% 125%',
  gradientOrigin = 'bottom-middle',
  colors = [
    { color: 'rgba(245,87,2,1)', stop: '10.5%' },
    { color: 'rgba(245,120,2,1)', stop: '16%' },
    { color: 'rgba(245,140,2,1)', stop: '17.5%' },
    { color: 'rgba(245,170,100,1)', stop: '25%' },
    { color: 'rgba(238,174,202,1)', stop: '40%' },
    { color: 'rgba(202,179,214,1)', stop: '65%' },
    { color: 'rgba(148,201,233,1)', stop: '100%' }
  ],
  
  // Noise customization
  enableNoise = true,
  noisePatternSize = 100,
  noisePatternScaleX = 1,
  noisePatternScaleY = 1,
  noisePatternRefreshInterval = 0, // Default to static grain (0 = zero continuous CPU draw)
  noisePatternAlpha = 50,
  noiseIntensity = 1,
  
  // Additional styling
  className = '',
  style = {},
  children,
  
  // Custom gradient string (overrides other gradient props if provided)
  customGradient = null
}: GradientBackgroundProps) {
  // Generate gradient string from colors array
  const generateGradient = () => {
    if (customGradient) return customGradient;
    
    const getGradientPosition = (origin: string) => {
      const positions: Record<string, string> = {
        'bottom-middle': '50% 101%',
        'bottom-left': '0% 101%',
        'bottom-right': '100% 101%',
        'top-middle': '50% -1%',
        'top-left': '0% -1%',
        'top-right': '100% -1%',
        'left-middle': '-1% 50%',
        'right-middle': '101% 50%',
        'center': '50% 50%'
      };
      return positions[origin] || positions['bottom-middle'];
    };
    
    const position = getGradientPosition(gradientOrigin);
    const colorStops = colors.map(({ color, stop }) => `${color} ${stop}`).join(',');
    
    if (gradientType === 'radial-gradient') {
      return `radial-gradient(${gradientSize} at ${position},${colorStops})`;
    } else if (gradientType === 'linear-gradient') {
      const angleMap: Record<string, string> = {
        'bottom-middle': '0deg',    // to top
        'bottom-left': '45deg',   // to top-right
        'bottom-right': '315deg', // to top-left
        'top-middle': '180deg',   // to bottom
        'top-left': '135deg',    // to bottom-right
        'top-right': '225deg',   // to bottom-left
        'left-middle': '90deg',   // to right
        'right-middle': '270deg', // to left
        'center': '0deg' // Default for center, though linear usually implies direction
      };
      const angle = angleMap[gradientOrigin] || angleMap['bottom-middle'];
      return `linear-gradient(${angle},${colorStops})`;
    } else if (gradientType === 'conic-gradient') {
      // Conic gradients usually need a 'from <angle>' and 'at <position>'
      // For simplicity, we'll use the position and a default 'from' angle.
      return `conic-gradient(from 0deg at ${position},${colorStops})`;
    }
    
    // Fallback for unknown gradient types or simple color stop list
    return `${gradientType}(${colorStops})`;
  };

  const gradientStyle: React.CSSProperties = {
    background: generateGradient(),
    ...style
  };

  return (
    <div 
      className={`absolute inset-0 w-full h-full pointer-events-none select-none z-0 ${className}`}
      style={gradientStyle}
    >
      {enableNoise && (
        <Noise
          patternSize={noisePatternSize}
          patternScaleX={noisePatternScaleX}
          patternScaleY={noisePatternScaleY}
          patternRefreshInterval={noisePatternRefreshInterval}
          patternAlpha={noisePatternAlpha}
          intensity={noiseIntensity}
        />
      )}
      {children}
    </div>
  );
}

export { GradientBackground, Noise };
