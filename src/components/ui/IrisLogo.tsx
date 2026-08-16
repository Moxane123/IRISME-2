import React from 'react';

interface IrisLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  textClassName?: string;
  variant?: 'full' | 'icon' | 'badge';
}

export const IrisLogo: React.FC<IrisLogoProps> = ({
  size = 36,
  className = '',
  showText = false,
  textClassName = '',
  variant = 'icon',
}) => {
  const uniqueId = React.useId().replace(/:/g, '');

  const svgIcon = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`flex-shrink-0 ${className}`}
    >
      <defs>
        {/* Gradient 1: Top Upper Arc Cyan to Violet */}
        <linearGradient
          id={`iris-top-arc-${uniqueId}`}
          x1="10"
          y1="50"
          x2="90"
          y2="25"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#00E5FF" />
          <stop offset="35%" stopColor="#0072FF" />
          <stop offset="70%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#FF0080" />
        </linearGradient>

        {/* Gradient 2: Upper Mid Eyelid Sweep */}
        <linearGradient
          id={`iris-upper-mid-${uniqueId}`}
          x1="20"
          y1="50"
          x2="85"
          y2="30"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#00D2FE" />
          <stop offset="45%" stopColor="#6366F1" />
          <stop offset="85%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#FF007A" />
        </linearGradient>

        {/* Gradient 3: Inner Left Swirl */}
        <linearGradient
          id={`iris-swirl-left-${uniqueId}`}
          x1="25"
          y1="60"
          x2="55"
          y2="35"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#0099FF" />
          <stop offset="50%" stopColor="#00E5FF" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>

        {/* Gradient 4: Inner Right Swirl (Magenta/Pink) */}
        <linearGradient
          id={`iris-swirl-right-${uniqueId}`}
          x1="45"
          y1="35"
          x2="80"
          y2="65"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="50%" stopColor="#D946EF" />
          <stop offset="100%" stopColor="#FF0080" />
        </linearGradient>

        {/* Gradient 5: Bottom Lower Eyelid Curve */}
        <linearGradient
          id={`iris-lower-arc-${uniqueId}`}
          x1="15"
          y1="65"
          x2="85"
          y2="65"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#00F0FF" />
          <stop offset="35%" stopColor="#0072FF" />
          <stop offset="70%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>

        {/* Radial Gradient: Center Glowing 3D Iris Sphere */}
        <radialGradient
          id={`iris-sphere-${uniqueId}`}
          cx="42%"
          cy="38%"
          r="58%"
          fx="38%"
          fy="32%"
        >
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="25%" stopColor="#67E8F9" />
          <stop offset="55%" stopColor="#3B82F6" />
          <stop offset="85%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#312E81" />
        </radialGradient>

        {/* Glow Filter for Logo */}
        <filter id={`iris-glow-${uniqueId}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Group: Stylized Eye Geometry from IRISME Brandmark */}
      <g>
        {/* Upper Outer Eyelid Layer */}
        <path
          d="M 22 47 C 35 28 65 24 85 46 C 72 32 45 31 22 47 Z"
          fill={`url(#iris-top-arc-${uniqueId})`}
        />

        {/* Upper Secondary Curved Hood */}
        <path
          d="M 24 45 C 38 29 64 26 80 43 C 65 33 42 33 24 45 Z"
          fill={`url(#iris-upper-mid-${uniqueId})`}
        />

        {/* Left Eyelid Curved Blade */}
        <path
          d="M 23 48 C 30 38 48 31 56 31 C 45 35 34 44 28 54 C 25 52 23 50 23 48 Z"
          fill={`url(#iris-swirl-left-${uniqueId})`}
        />

        {/* Right Eyelid Wing Sweep */}
        <path
          d="M 52 32 C 64 32 78 37 84 46 C 77 47 67 42 56 42 C 54 38 53 35 52 32 Z"
          fill={`url(#iris-swirl-right-${uniqueId})`}
        />

        {/* Inner Aperture / Swirling Sclera Layer - Left Lower Sweep */}
        <path
          d="M 29 55 C 34 63 46 66 58 64 C 47 63 38 57 34 49 C 32 51 30 53 29 55 Z"
          fill={`url(#iris-swirl-left-${uniqueId})`}
        />

        {/* Inner Aperture - Right Arc Layer */}
        <path
          d="M 62 43 C 69 49 69 57 63 63 C 58 60 56 55 58 48 C 59 46 61 44 62 43 Z"
          fill={`url(#iris-swirl-right-${uniqueId})`}
        />

        {/* Aperture Bottom Connecting Arc */}
        <path
          d="M 44 64 C 54 65 64 61 68 54 C 64 58 56 60 48 58 C 46 60 45 62 44 64 Z"
          fill={`url(#iris-lower-arc-${uniqueId})`}
        />

        {/* Center Iris Glowing Sphere */}
        <circle
          cx="50"
          cy="48"
          r="10.5"
          fill={`url(#iris-sphere-${uniqueId})`}
        />

        {/* Inner Pupil Specular Highlight */}
        <circle
          cx="47.5"
          cy="45"
          r="2.5"
          fill="#FFFFFF"
          opacity="0.85"
        />

        {/* Bottom Lower Eyelid Dynamic Sweep */}
        <path
          d="M 18 53 C 32 66 68 67 82 56 C 68 64 34 63 18 53 Z"
          fill={`url(#iris-lower-arc-${uniqueId})`}
        />
      </g>
    </svg>
  );

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-2 p-1.5 pr-3 rounded-xl bg-gradient-to-r from-[#00D2FE]/10 via-[#7C3AED]/10 to-[#FF0080]/10 border border-[#8B5CF6]/30 ${className}`}>
        {svgIcon}
        <span className="font-extrabold tracking-wider bg-gradient-to-r from-[#00D2FE] via-[#A855F7] to-[#FF0080] bg-clip-text text-transparent">
          IRISME
        </span>
      </div>
    );
  }

  if (showText || variant === 'full') {
    return (
      <div className={`inline-flex items-center gap-2.5 ${className}`}>
        {svgIcon}
        <span className={`font-black tracking-tight leading-none bg-gradient-to-r from-[#00D2FE] via-[#A855F7] to-[#FF0080] bg-clip-text text-transparent ${textClassName || 'text-xl'}`}>
          IRISME
        </span>
      </div>
    );
  }

  return svgIcon;
};
