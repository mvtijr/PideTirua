import React from 'react';

interface NoiseProps {
  patternSize?: number;
  patternScaleX?: number;
  patternScaleY?: number;
  patternRefreshInterval?: number;
  patternAlpha?: number;
  intensity?: number;
}

const NOISE_SVG_DATA_URI =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E\")";

/**
 * Pure CSS SVG noise overlay: zero canvas allocations, zero forced reflows (getBoundingClientRect),
 * and zero client-side CPU overhead during bootup.
 */
function Noise({
  patternSize = 100,
  patternScaleX = 1,
  patternScaleY = 1,
  patternAlpha = 50,
  intensity = 1,
}: NoiseProps) {
  const opacity = Math.min(0.25, Math.max(0.03, (patternAlpha / 255) * 0.55 * intensity));
  const tileW = Math.max(40, Math.round(patternSize * patternScaleX));
  const tileH = Math.max(40, Math.round(patternSize * patternScaleY));

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{
        backgroundImage: NOISE_SVG_DATA_URI,
        backgroundRepeat: 'repeat',
        backgroundSize: `${tileW}px ${tileH}px`,
        opacity,
      }}
    />
  );
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

function GradientBackground({
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
  enableNoise = true,
  noisePatternSize = 100,
  noisePatternScaleX = 1,
  noisePatternScaleY = 1,
  noisePatternRefreshInterval = 0,
  noisePatternAlpha = 50,
  noiseIntensity = 1,
  className = '',
  style = {},
  children,
  customGradient = null
}: GradientBackgroundProps) {
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
        'bottom-middle': '0deg',
        'bottom-left': '45deg',
        'bottom-right': '315deg',
        'top-middle': '180deg',
        'top-left': '135deg',
        'top-right': '225deg',
        'left-middle': '90deg',
        'right-middle': '270deg',
        'center': '0deg'
      };
      const angle = angleMap[gradientOrigin] || angleMap['bottom-middle'];
      return `linear-gradient(${angle},${colorStops})`;
    } else if (gradientType === 'conic-gradient') {
      return `conic-gradient(from 0deg at ${position},${colorStops})`;
    }

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
