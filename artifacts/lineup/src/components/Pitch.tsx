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
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 5) {
        onRemovePlaced?.(td.playerId);
      }
    },
    [onRemovePlaced]
  );

  return (
    <div
      ref={resolvedRef}
      className="relative w-full h-full bg-[#1b4d24] overflow-hidden border-2 border-white/20 rounded-lg shadow-2xl isolate"
      onPointerMove={moveToken}
      onPointerUp={endTokenDrag}
    >
      {/* Grass stripes */}
      <div className="absolute inset-0 flex flex-col pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className={`flex-1 ${i % 2 === 0 ? "bg-[#1f592a]" : "bg-[#1b4d24]"}`} />
        ))}
      </div>

      <svg
        viewBox="0 0 100 150"
        className="absolute inset-0 w-full h-full opacity-80 pointer-events-none"
        preserveAspectRatio="none"
      >
        <g stroke="white" strokeWidth="0.5" fill="none">
          <rect x="2" y="2" width="96" height="146" />
          <line x1="2" y1="75" x2="98" y2="75" />
          <circle cx="50" cy="75" r="10" />
          <circle cx="50" cy="75" r="0.5" fill="white" />
          <rect x="25" y="2" width="50" height="20" />
          <rect x="38" y="2" width="24" height="6" />
          <circle cx="50" cy="14" r="0.5" fill="white" />
          <path d="M 41.5 22 A 10 10 0 0 0 58.5 22" />
          <rect x="25" y="128" width="50" height="20" />
          <rect x="38" y="142" width="24" height="6" />
          <circle cx="50" cy="136" r="0.5" fill="white" />
          <path d="M 41.5 128 A 10 10 0 0 1 58.5 128" />
          <path d="M 2 5 A 3 3 0 0 0 5 2" />
          <path d="M 98 5 A 3 3 0 0 1 95 2" />
          <path d="M 2 145 A 3 3 0 0 1 5 148" />
          <path d="M 98 145 A 3 3 0 0 0 95 148" />
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

      {/* Hint text when empty */}
      {placedPlayers.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-white/20 text-sm font-sans select-none">Drag players onto the pitch</span>
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
  player: { id: number; name: string; number?: number | null; imageUrl?: string | null };
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
      title={`${player.name} — tap to remove`}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-xl border-2 border-white/80 overflow-hidden"
        style={{ backgroundColor: teamColor }}
      >
        {player.imageUrl ? (
          <img src={player.imageUrl} alt={player.name} className="w-full h-full object-cover" />
        ) : (
          <span className="font-sans text-xs">{player.number ?? initials}</span>
        )}
      </div>
      <span
        className="mt-1 text-white text-[10px] font-bold font-sans px-1 py-0.5 rounded leading-none whitespace-nowrap max-w-[64px] overflow-hidden text-ellipsis"
        style={{
          background: "rgba(0,0,0,0.65)",
          textShadow: "0 1px 2px rgba(0,0,0,0.8)",
        }}
      >
        {player.name.split(" ")[0]}
      </span>
    </div>
  );
}
