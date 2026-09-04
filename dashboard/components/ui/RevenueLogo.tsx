import React from 'react';

interface RevenueLogoIconProps {
  className?: string;
  size?: number;
}

export const RevenueLogoIcon: React.FC<RevenueLogoIconProps> = ({
  className = '',
  size = 40,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Speedometer Arc Gradient: Blue -> Cyan -> Emerald */}
        <linearGradient id="meterGrad" x1="45" y1="12" x2="90" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="50%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>

        {/* Solid brand blue for R and Arrow */}
        <linearGradient id="brandBlue" x1="20" y1="30" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>

      {/* Speedometer Arc Segments (Upper Right Meter) */}
      {/* Segment 1: Top */}
      <path
        d="M 46 16 C 53 14 60 14 66 16"
        stroke="url(#meterGrad)"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      {/* Segment 2: Upper Right */}
      <path
        d="M 73 19 C 81 24 87 31 90 40"
        stroke="url(#meterGrad)"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      {/* Segment 3: Right / Lower Right */}
      <path
        d="M 92 48 C 93 54 91 61 87 67"
        stroke="url(#meterGrad)"
        strokeWidth="4.5"
        strokeLinecap="round"
      />

      {/* Lightning Bolt inside Meter */}
      <path
        d="M 72 26 L 64 39 H 71 L 66 51 L 78 37 H 71 L 75 26 Z"
        fill="#2563EB"
      />

      {/* Letter 'R' */}
      {/* Vertical Stem */}
      <rect x="20" y="32" width="13" height="46" rx="3" fill="url(#brandBlue)" />

      {/* Upper Bowl Outer */}
      <path
        d="M 28 32 H 49 C 59 32 66 38 66 47 C 66 56 59 62 49 62 H 28 V 32 Z"
        fill="url(#brandBlue)"
      />
      {/* Upper Bowl Inner Cutout */}
      <path
        d="M 33 42 H 48 C 52 42 55 44 55 47 C 55 50 52 52 48 52 H 33 V 42 Z"
        fill="#FFFFFF"
      />

      {/* Dynamic Arrow Lower Leg */}
      {/* Down-right to V-vertex, then up-right toward arrow tip */}
      <path
        d="M 37 57 L 51 77 L 67 56"
        stroke="url(#brandBlue)"
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Arrowhead pointing up-right (45 deg) */}
      <path
        d="M 58 54 L 79 50 L 75 71 Z"
        fill="url(#brandBlue)"
      />
    </svg>
  );
};

export const RevenueLogo: React.FC<{
  className?: string;
  iconSize?: number;
  showText?: boolean;
  subtitle?: string;
  variant?: 'sidebar' | 'header' | 'standalone';
}> = ({
  className = '',
  iconSize = 34,
  showText = true,
  subtitle = 'Razorpay Decisioning',
  variant = 'sidebar',
}) => {
  if (variant === 'sidebar') {
    return (
      <div className={`flex items-center gap-3.5 ${className}`}>
        {/* Blended badge container */}
        <div className="relative w-11 h-11 rounded-2xl bg-white p-1.5 shadow-md shadow-blue-950/20 flex items-center justify-center flex-shrink-0 border border-white/30 transition-transform duration-200 hover:scale-105">
          <RevenueLogoIcon size={iconSize} />
        </div>
        {showText && (
          <div className="flex flex-col">
            <span className="font-extrabold text-[15px] text-white tracking-tight leading-tight">
              RevenueEngine
            </span>
            {subtitle && (
              <span className="text-[10px] text-white/75 font-semibold tracking-wider uppercase leading-tight mt-0.5">
                {subtitle}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="w-10 h-10 rounded-xl bg-white p-1 shadow-sm border border-slate-100 flex items-center justify-center">
        <RevenueLogoIcon size={iconSize} />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className="font-extrabold text-[15px] text-slate-900 tracking-tight leading-tight">
            RevenueEngine
          </span>
          {subtitle && (
            <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase leading-tight mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
