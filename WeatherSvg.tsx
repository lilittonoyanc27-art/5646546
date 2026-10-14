import React from 'react';

interface WeatherSvgProps {
  type: 'sol' | 'lluvia' | 'nieve' | 'viento' | 'nubes' | 'niebla' | 'tormenta';
  size?: number;
}

export const WeatherSvg: React.FC<WeatherSvgProps> = ({ type, size = 120 }) => {
  return (
    <div className="flex items-center justify-center p-3 rounded-2xl bg-gradient-to-b from-sky-50/70 to-blue-50/40 border border-sky-100 shadow-xs">
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className="drop-shadow-sm select-none"
      >
        <defs>
          {/* Sun Gradient */}
          <linearGradient id="sunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="60%" stopColor="#facc15" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>

          {/* Cloud Gradient */}
          <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>

          {/* Rain Blue */}
          <linearGradient id="rainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
        </defs>

        {type === 'sol' && (
          <g>
            {/* Sun Rays */}
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i * 45 * Math.PI) / 180;
              const x1 = 50 + 26 * Math.sin(angle);
              const y1 = 50 - 26 * Math.cos(angle);
              const x2 = 50 + 38 * Math.sin(angle);
              const y2 = 50 - 38 * Math.cos(angle);
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#f59e0b"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              );
            })}
            {/* Sun Body */}
            <circle cx="50" cy="50" r="20" fill="url(#sunGrad)" stroke="#f59e0b" strokeWidth="1.5" />
          </g>
        )}

        {type === 'nubes' && (
          <g>
            {/* Background cloud */}
            <path
              d="M30 52a14 14 0 0 1 24-8 16 16 0 0 1 26 8 13 13 0 0 1-4 22H30a11 11 0 0 1 0-22z"
              fill="#94a3b8"
              opacity="0.4"
            />
            {/* Foreground cloud */}
            <path
              d="M24 58a15 15 0 0 1 26-9 18 18 0 0 1 30 8 15 15 0 0 1-5 25H24a12 12 0 0 1 0-24z"
              fill="url(#cloudGrad)"
              stroke="#94a3b8"
              strokeWidth="2"
            />
          </g>
        )}

        {type === 'lluvia' && (
          <g>
            {/* Cloud */}
            <path
              d="M24 45a14 14 0 0 1 24-8 17 17 0 0 1 28 8 14 14 0 0 1-4 22H24a11 11 0 0 1 0-22z"
              fill="url(#cloudGrad)"
              stroke="#64748b"
              strokeWidth="2"
            />
            {/* Raindrops */}
            <line x1="32" y1="72" x2="26" y2="86" stroke="url(#rainGrad)" strokeWidth="3" strokeLinecap="round" />
            <line x1="48" y1="72" x2="42" y2="86" stroke="url(#rainGrad)" strokeWidth="3" strokeLinecap="round" />
            <line x1="64" y1="72" x2="58" y2="86" stroke="url(#rainGrad)" strokeWidth="3" strokeLinecap="round" />
          </g>
        )}

        {type === 'nieve' && (
          <g>
            {/* Cloud */}
            <path
              d="M24 44a14 14 0 0 1 24-8 17 17 0 0 1 28 8 14 14 0 0 1-4 22H24a11 11 0 0 1 0-22z"
              fill="url(#cloudGrad)"
              stroke="#94a3b8"
              strokeWidth="2"
            />
            {/* Snowflakes */}
            <g fill="#38bdf8">
              <circle cx="34" cy="74" r="3.5" />
              <circle cx="50" cy="80" r="3.5" />
              <circle cx="66" cy="74" r="3.5" />
              <circle cx="42" cy="88" r="3" />
              <circle cx="58" cy="88" r="3" />
            </g>
          </g>
        )}

        {type === 'viento' && (
          <g stroke="#0284c7" strokeWidth="3.5" strokeLinecap="round" fill="none">
            {/* Wind curves */}
            <path d="M15 36h48a12 12 0 1 0-10-18" />
            <path d="M22 52h54a10 10 0 1 1-8 16" />
            <path d="M18 68h36a8 8 0 1 0-6-12" />
          </g>
        )}

        {type === 'niebla' && (
          <g stroke="#94a3b8" strokeWidth="4" strokeLinecap="round">
            <line x1="20" y1="36" x2="80" y2="36" opacity="0.6" />
            <line x1="14" y1="48" x2="86" y2="48" opacity="0.8" />
            <line x1="22" y1="60" x2="78" y2="60" opacity="0.9" />
            <line x1="16" y1="72" x2="84" y2="72" opacity="0.7" />
          </g>
        )}

        {type === 'tormenta' && (
          <g>
            {/* Dark Cloud */}
            <path
              d="M24 40a14 14 0 0 1 24-8 17 17 0 0 1 28 8 14 14 0 0 1-4 22H24a11 11 0 0 1 0-22z"
              fill="#475569"
              stroke="#334155"
              strokeWidth="2"
            />
            {/* Lightning bolt */}
            <polygon
              points="52,56 42,70 50,70 44,88 62,68 52,68 58,56"
              fill="#facc15"
              stroke="#f59e0b"
              strokeWidth="1.5"
            />
          </g>
        )}
      </svg>
    </div>
  );
};
