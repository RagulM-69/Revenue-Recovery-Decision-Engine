'use client';

import React, { useState } from 'react';
import { TrendingUp, Calendar, Info, Layers, CheckCircle2 } from 'lucide-react';
import { formatINR } from '@/lib/data-access';

interface TrajectoryPoint {
  day: number;
  label: string;
  date: string;
  cumulativeNet: number;
  dailyRecovered: number;
  retries: number;
  successes: number;
}

const TRAJECTORY_DATA: TrajectoryPoint[] = [
  { day: 21, label: 'Day 21', date: 'Aug 21', cumulativeNet: 428500, dailyRecovered: 432100, retries: 72, successes: 46 },
  { day: 22, label: 'Day 22', date: 'Aug 22', cumulativeNet: 894200, dailyRecovered: 468300, retries: 76, successes: 49 },
  { day: 23, label: 'Day 23', date: 'Aug 23', cumulativeNet: 1386100, dailyRecovered: 495100, retries: 81, successes: 53 },
  { day: 24, label: 'Day 24', date: 'Aug 24', cumulativeNet: 1845200, dailyRecovered: 461900, retries: 74, successes: 47 },
  { day: 25, label: 'Day 25', date: 'Aug 25', cumulativeNet: 2321400, dailyRecovered: 479100, retries: 78, successes: 51 },
  { day: 26, label: 'Day 26', date: 'Aug 26', cumulativeNet: 2854900, dailyRecovered: 536400, retries: 85, successes: 55 },
  { day: 27, label: 'Day 27', date: 'Aug 27', cumulativeNet: 3341800, dailyRecovered: 489700, retries: 79, successes: 50 },
  { day: 28, label: 'Day 28', date: 'Aug 28', cumulativeNet: 3812500, dailyRecovered: 473500, retries: 75, successes: 48 },
  { day: 29, label: 'Day 29', date: 'Aug 29', cumulativeNet: 4210300, dailyRecovered: 400100, retries: 68, successes: 42 },
  { day: 30, label: 'Day 30', date: 'Aug 30', cumulativeNet: 4516993, dailyRecovered: 311200, retries: 60, successes: 39 },
];

export const InteractiveTrajectoryChart: React.FC = () => {
  const [activeIdx, setActiveIdx] = useState<number>(9); // default to Day 30 (final)
  const [viewMode, setViewMode] = useState<'cumulative' | 'daily'>('cumulative');

  const activePoint = TRAJECTORY_DATA[activeIdx];
  const maxCumulative = 4600000;
  const maxDaily = 600000;

  // Compute SVG coordinates
  const svgWidth = 680;
  const svgHeight = 180;
  const paddingX = 30;
  const usableWidth = svgWidth - paddingX * 2;
  const stepX = usableWidth / (TRAJECTORY_DATA.length - 1);

  const points = TRAJECTORY_DATA.map((p, i) => {
    const x = paddingX + i * stepX;
    const val = viewMode === 'cumulative' ? p.cumulativeNet : p.dailyRecovered;
    const maxVal = viewMode === 'cumulative' ? maxCumulative : maxDaily;
    const y = svgHeight - 20 - (val / maxVal) * (svgHeight - 45);
    return { x, y, ...p };
  });

  // Create smooth bezier path string
  const pathD = points.reduce((acc, pt, i, arr) => {
    if (i === 0) return `M ${pt.x},${pt.y}`;
    const prev = arr[i - 1];
    const cp1x = prev.x + (pt.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (pt.x - prev.x) / 2;
    const cp2y = pt.y;
    return `${acc} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${pt.x},${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x},${svgHeight - 15} L ${points[0].x},${svgHeight - 15} Z`;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-2xs flex flex-col justify-between">
      {/* Chart Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
            Recovery Value Trajectory
          </span>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 metric-value">
              {formatINR(viewMode === 'cumulative' ? activePoint.cumulativeNet : activePoint.dailyRecovered)}
            </span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {activePoint.label} · {activePoint.successes} Recoveries ({activePoint.retries} Retries)
            </span>
          </div>
        </div>

        {/* View Mode Toggle Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-slate-200/80 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('cumulative')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'cumulative'
                ? 'bg-white text-[#2E5BFF] shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Cumulative Net
          </button>
          <button
            onClick={() => setViewMode('daily')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'daily'
                ? 'bg-white text-[#2E5BFF] shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Daily Velocity
          </button>
        </div>
      </div>

      {/* Interactive SVG Canvas */}
      <div className="relative w-full h-56 my-3">
        {/* Dynamic Tooltip following active scrubber point */}
        <div
          className="absolute z-20 pointer-events-none transition-all duration-150 ease-out"
          style={{
            left: `${(points[activeIdx].x / svgWidth) * 100}%`,
            top: `${Math.max(10, (points[activeIdx].y / svgHeight) * 100 - 32)}%`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="bg-slate-950 text-white px-3.5 py-2 rounded-2xl shadow-xl border border-slate-700/80 text-center whitespace-nowrap">
            <div className="text-[10px] font-semibold text-slate-400">
              {activePoint.date} · {activePoint.label}
            </div>
            <div className="text-xs font-extrabold text-emerald-400 metric-value mt-0.5">
              {formatINR(viewMode === 'cumulative' ? activePoint.cumulativeNet : activePoint.dailyRecovered)}
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5">
              Success Rate: {((activePoint.successes / activePoint.retries) * 100).toFixed(0)}%
            </div>
            <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 bg-slate-950 rotate-45 border-r border-b border-slate-700" />
          </div>
        </div>

        {/* SVG Curve */}
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="curveGradientFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2E5BFF" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#2E5BFF" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={paddingX} y1="35" x2={svgWidth - paddingX} y2="35" stroke="#F1F5F9" strokeDasharray="3 3" />
          <line x1={paddingX} y1="80" x2={svgWidth - paddingX} y2="80" stroke="#F1F5F9" strokeDasharray="3 3" />
          <line x1={paddingX} y1="125" x2={svgWidth - paddingX} y2="125" stroke="#F1F5F9" strokeDasharray="3 3" />
          <line x1={paddingX} y1={svgHeight - 15} x2={svgWidth - paddingX} y2={svgHeight - 15} stroke="#E2E8F0" />

          {/* Area Fill */}
          <path d={areaD} fill="url(#curveGradientFill)" />

          {/* Spline Path */}
          <path
            d={pathD}
            fill="none"
            stroke="#2E5BFF"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Active Vertical Guideline */}
          <line
            x1={points[activeIdx].x}
            y1="20"
            x2={points[activeIdx].x}
            y2={svgHeight - 15}
            stroke="#2E5BFF"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />

          {/* Interactive Clickable/Hoverable Data Points */}
          {points.map((pt, i) => (
            <g
              key={pt.day}
              className="cursor-pointer group"
              onMouseEnter={() => setActiveIdx(i)}
              onClick={() => setActiveIdx(i)}
            >
              {/* Invisible large hit area for effortless hover */}
              <rect
                x={pt.x - stepX / 2}
                y="0"
                width={stepX}
                height={svgHeight}
                fill="transparent"
              />
              {/* Outer halo */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={activeIdx === i ? 7 : 4}
                fill="#FFFFFF"
                stroke="#2E5BFF"
                strokeWidth={activeIdx === i ? 3 : 2}
                className="transition-all duration-150"
              />
              {activeIdx === i && (
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={3}
                  fill="#2E5BFF"
                />
              )}
            </g>
          ))}
        </svg>
      </div>

      {/* X-Axis Scrub Buttons */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-400 font-bold px-1">
        {TRAJECTORY_DATA.map((p, i) => (
          <button
            key={p.day}
            onClick={() => setActiveIdx(i)}
            onMouseEnter={() => setActiveIdx(i)}
            className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
              activeIdx === i
                ? 'text-[#2E5BFF] bg-blue-50 font-extrabold'
                : 'hover:text-slate-700'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
};
