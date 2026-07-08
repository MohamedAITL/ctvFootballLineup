import React from "react";

export function Pitch() {
  return (
    <div className="relative w-full h-full bg-[#1b4d24] overflow-hidden border-2 border-white/20 rounded-lg shadow-2xl isolate">
      {/* Grass pattern / stripes */}
      <div className="absolute inset-0 flex flex-col">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 ${i % 2 === 0 ? "bg-[#1f592a]" : "bg-[#1b4d24]"}`}
          />
        ))}
      </div>

      <svg
        viewBox="0 0 100 150"
        className="absolute inset-0 w-full h-full opacity-80"
        preserveAspectRatio="none"
      >
        <g stroke="white" strokeWidth="0.5" fill="none">
          {/* Outer Boundary */}
          <rect x="2" y="2" width="96" height="146" />

          {/* Center Line */}
          <line x1="2" y1="75" x2="98" y2="75" />

          {/* Center Circle */}
          <circle cx="50" cy="75" r="10" />

          {/* Center Spot */}
          <circle cx="50" cy="75" r="0.5" fill="white" />

          {/* Top Penalty Area */}
          <rect x="25" y="2" width="50" height="20" />
          {/* Top Goal Area */}
          <rect x="38" y="2" width="24" height="6" />
          {/* Top Penalty Spot */}
          <circle cx="50" cy="14" r="0.5" fill="white" />
          {/* Top Penalty Arc */}
          <path d="M 41.5 22 A 10 10 0 0 0 58.5 22" />

          {/* Bottom Penalty Area */}
          <rect x="25" y="128" width="50" height="20" />
          {/* Bottom Goal Area */}
          <rect x="38" y="142" width="24" height="6" />
          {/* Bottom Penalty Spot */}
          <circle cx="50" cy="136" r="0.5" fill="white" />
          {/* Bottom Penalty Arc */}
          <path d="M 41.5 128 A 10 10 0 0 1 58.5 128" />

          {/* Corner Arcs */}
          <path d="M 2 5 A 3 3 0 0 0 5 2" />
          <path d="M 98 5 A 3 3 0 0 1 95 2" />
          <path d="M 2 145 A 3 3 0 0 1 5 148" />
          <path d="M 98 145 A 3 3 0 0 0 95 148" />
        </g>
      </svg>
    </div>
  );
}
