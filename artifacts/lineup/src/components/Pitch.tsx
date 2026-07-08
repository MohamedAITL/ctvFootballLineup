import React, { forwardRef, useRef, useCallback } from "react";
import type { PlacedPlayer } from "@/pages/LineupView";

interface PitchProps {
  placedPlayers?: PlacedPlayer[];
  onMovePlaced?: (playerId: number, x: number, y: number) => void;
  onRemovePlaced?: (playerId: number) => void;
}

export const Pitch = forwardRef<HTMLDivElement, PitchProps>(function Pitch(
  { placedPlayers = [], onMovePlaced, onRemovePlaced },
  ref
) {
  const tokenDragRef = useRef<{ playerId: number; startX: number; startY: number } | null>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const resolvedRef = (ref as React.RefObject<HTMLDivElement>) || innerRef;

  const startTokenDrag = useCallback(
    (playerId: number, e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      tokenDragRef.current = { playerId, startX: e.clientX, startY: e.clientY };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    []
  );

  const moveToken = useCallback(
    (e: React.PointerEvent) => {
      const td = tokenDragRef.current;
      if (!td) return;
      const pitchEl = (resolvedRef as React.RefObject<HTMLDivElement>).current;
      if (!pitchEl) return;
      const rect = pitchEl.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      onMovePlaced?.(td.playerId, x, y);
    },
    [onMovePlaced, resolvedRef]
  );

  const endTokenDrag = useCallback(
    (e: React.PointerEvent) => {
      if (!tokenDragRef.current) return;
      const td = tokenDragRef.current;
      tokenDragRef.current = null;
      const dx = e.clientX - td.startX;
      const dy = e.clientY - td.startY;
      if (Math.sqrt(dx * dx + dy * dy) < 5) {
        onRemovePlaced?.(td.playerId);
      }
    },
    [onRemovePlaced]
  );

  return (
    <div
      ref={resolvedRef}
      className="absolute inset-0 bg-[#1b4d24] overflow-hidden"
      onPointerMove={moveToken}
      onPointerUp={endTokenDrag}
    >
      {/* Grass stripes */}
      <div className="absolute inset-0 flex flex-col pointer-events-none">
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className={`flex-1 ${i % 2 === 0 ? "bg-[#1f5a28]" : "bg-[#1b4d24]"}`} />
        ))}
      </div>

      {/* Field lines */}
      <svg
        viewBox="0 0 100 150"
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
        style={{ opacity: 0.75 }}
      >
        <g stroke="rgba(255,255,255,0.85)" strokeWidth="0.45" fill="none">
          {/* Outer boundary */}
          <rect x="3" y="3" width="94" height="144" />
          {/* Midfield line */}
          <line x1="3" y1="75" x2="97" y2="75" />
          {/* Center circle */}
          <circle cx="50" cy="75" r="11" />
          <circle cx="50" cy="75" r="0.6" fill="rgba(255,255,255,0.85)" />
          {/* Top penalty area */}
          <rect x="22" y="3" width="56" height="22" />
          {/* Top goal area */}
          <rect x="36" y="3" width="28" height="7" />
          <circle cx="50" cy="16" r="0.6" fill="rgba(255,255,255,0.85)" />
          <path d="M 40 25 A 11 11 0 0 0 60 25" />
          {/* Bottom penalty area */}
          <rect x="22" y="125" width="56" height="22" />
          {/* Bottom goal area */}
          <rect x="36" y="140" width="28" height="7" />
          <circle cx="50" cy="134" r="0.6" fill="rgba(255,255,255,0.85)" />
          <path d="M 40 125 A 11 11 0 0 1 60 125" />
          {/* Corner arcs */}
          <path d="M 3 6.5 A 3.5 3.5 0 0 0 6.5 3" />
          <path d="M 97 6.5 A 3.5 3.5 0 0 1 93.5 3" />
          <path d="M 3 143.5 A 3.5 3.5 0 0 1 6.5 147" />
          <path d="M 97 143.5 A 3.5 3.5 0 0 0 93.5 147" />
        </g>
      </svg>

      {/* Placed player tokens */}
      {placedPlayers.map(({ player, teamColor, x, y }) => (
        <PlayerToken
          key={player.id}
          player={player}
          teamColor={teamColor}
          x={x}
          y={y}
          onPointerDown={startTokenDrag}
        />
      ))}

      {/* Empty pitch hint */}
      {placedPlayers.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-white/20 text-base font-sans tracking-wide select-none">
            Drag players onto the pitch
          </span>
        </div>
      )}
    </div>
  );
});

function PlayerToken({
  player,
  teamColor,
  x,
  y,
  onPointerDown,
}: {
  player: PlacedPlayer["player"];
  teamColor: string;
  x: number;
  y: number;
  onPointerDown: (playerId: number, e: React.PointerEvent) => void;
}) {
  const initials = player.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  return (
    <div
      className="absolute flex flex-col items-center cursor-grab active:cursor-grabbing select-none"
      style={{
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        transform: "translate(-50%, -50%)",
        touchAction: "none",
        zIndex: 20,
      }}
      onPointerDown={(e) => onPointerDown(player.id, e)}
      title={player.name}
    >
      {/* Big photo / initials circle */}
      <div
        className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center font-bold text-white shadow-2xl"
        style={{
          backgroundColor: teamColor,
          border: "3px solid rgba(255,255,255,0.9)",
          boxShadow: `0 4px 20px rgba(0,0,0,0.6), 0 0 0 1px ${teamColor}`,
        }}
      >
        {player.imageUrl ? (
          <img src={player.imageUrl} alt={player.name} className="w-full h-full object-cover" />
        ) : (
          <span className="font-arabic text-base">{initials}</span>
        )}
      </div>

      {/* Number badge */}
      <div
        className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-md"
        style={{ backgroundColor: teamColor, border: "1.5px solid white" }}
      >
        {player.number ?? "?"}
      </div>

      {/* Name label */}
      <div
        className="mt-1 text-white text-[11px] font-bold font-arabic px-2 py-0.5 rounded-full leading-none whitespace-nowrap max-w-[80px] overflow-hidden text-ellipsis text-center"
        style={{
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(4px)",
          textShadow: "0 1px 3px rgba(0,0,0,1)",
          border: "1px solid rgba(255,255,255,0.15)",
        }}
      >
        {player.name.split(" ").slice(0, 2).join(" ")}
      </div>
    </div>
  );
}
