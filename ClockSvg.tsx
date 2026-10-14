import React from 'react';

interface ClockSvgProps {
  hours: number;
  minutes: number;
  size?: number;
  showDigital?: boolean;
}

export const ClockSvg: React.FC<ClockSvgProps> = ({
  hours,
  minutes,
  size = 180,
  showDigital = true,
}) => {
  // Calculate angles
  // 12 hours = 360 degrees => 30 deg/hour + 0.5 deg/minute
  const hourAngle = ((hours % 12) + minutes / 60) * 30;
  // 60 minutes = 360 degrees => 6 deg/minute
  const minuteAngle = minutes * 6;

  // Format digital string
  const pad = (n: number) => n.toString().padStart(2, '0');
  const digitalTime = `${pad(hours)}:${pad(minutes)}`;

  return (
    <div className="flex flex-col items-center justify-center p-3 bg-gradient-to-b from-sky-50 to-white rounded-2xl border border-sky-100 shadow-inner">
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        className="drop-shadow-sm select-none"
      >
        <defs>
          <radialGradient id="clockFace" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="90%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </radialGradient>
          <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Outer Ring */}
        <circle
          cx="100"
          cy="100"
          r="94"
          fill="url(#clockFace)"
          stroke="#0284c7"
          strokeWidth="6"
        />
        <circle
          cx="100"
          cy="100"
          r="88"
          fill="none"
          stroke="#e0f2fe"
          strokeWidth="2"
        />

        {/* Minute ticks & numbers */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 30 * Math.PI) / 180;
          const x1 = 100 + 78 * Math.sin(angle);
          const y1 = 100 - 78 * Math.cos(angle);
          const x2 = 100 + 84 * Math.sin(angle);
          const y2 = 100 - 84 * Math.cos(angle);

          const numX = 100 + 66 * Math.sin(angle);
          const numY = 100 - 66 * Math.cos(angle) + 4.5;
          const num = i === 0 ? 12 : i;

          return (
            <g key={i}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#64748b"
                strokeWidth={i % 3 === 0 ? 3 : 1.5}
                strokeLinecap="round"
              />
              <text
                x={numX}
                y={numY}
                textAnchor="middle"
                className="text-[12px] font-bold fill-slate-700 select-none"
                style={{ fontFamily: 'sans-serif' }}
              >
                {num}
              </text>
            </g>
          );
        })}

        {/* Center Pivot Background */}
        <circle cx="100" cy="100" r="6" fill="#1e3a8a" />

        {/* Hour Hand */}
        <line
          x1="100"
          y1="100"
          x2={100 + 44 * Math.sin((hourAngle * Math.PI) / 180)}
          y2={100 - 44 * Math.cos((hourAngle * Math.PI) / 180)}
          stroke="#1d4ed8"
          strokeWidth="6"
          strokeLinecap="round"
          filter="url(#shadow)"
        />

        {/* Minute Hand */}
        <line
          x1="100"
          y1="100"
          x2={100 + 68 * Math.sin((minuteAngle * Math.PI) / 180)}
          y2={100 - 68 * Math.cos((minuteAngle * Math.PI) / 180)}
          stroke="#f97316"
          strokeWidth="4"
          strokeLinecap="round"
          filter="url(#shadow)"
        />

        {/* Center Pin Cap */}
        <circle cx="100" cy="100" r="3.5" fill="#facc15" stroke="#ea580c" strokeWidth="1" />
      </svg>

      {showDigital && (
        <div className="mt-2 text-center">
          <span className="font-mono text-sm tracking-widest font-semibold px-2.5 py-1 bg-white border border-sky-200 rounded-md text-sky-950 shadow-xs">
            {digitalTime}
          </span>
        </div>
      )}
    </div>
  );
};
