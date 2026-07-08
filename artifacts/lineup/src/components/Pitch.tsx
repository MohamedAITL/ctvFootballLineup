import React, { forwardRef, useRef, useCallback } from "react";
import type { PlacedPlayer } from "@/pages/LineupView";

interface PitchProps {
  placedPlayers?: PlacedPlayer[];
  onMovePlaced?: (playerId: number, x: number, y: number) => void;
  onRemovePlaced?: (playerId: number) => void;
  ballPos?: { x: number; y: number } | null;
  onMoveBall?: (x: number, y: number) => void;
}

export const Pitch = forwardRef<HTMLDivElement, PitchProps>(function Pitch(
  { placedPlayers = [], onMovePlaced, onRemovePlaced, ballPos, onMoveBall },
  ref
) {
  const tokenDragRef = useRef<{ playerId: number; startX: number; startY: number } | null>(null);

  const startTokenDrag = useCallback((playerId: number, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    tokenDragRef.current = { playerId, startX: e.clientX, startY: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const moveToken = useCallback((e: React.PointerEvent) => {
    const td = tokenDragRef.current;
    if (!td) return;
    const pitchEl = (ref as React.RefObject<HTMLDivElement>)?.current;
    if (!pitchEl) return;
    const rect = pitchEl.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    onMovePlaced?.(td.playerId, x, y);
  }, [onMovePlaced, ref]);

  const endTokenDrag = useCallback((e: React.PointerEvent) => {
    if (!tokenDragRef.current) return;
    const td = tokenDragRef.current;
    tokenDragRef.current = null;
    const dx = e.clientX - td.startX;
    const dy = e.clientY - td.startY;
    if (Math.sqrt(dx * dx + dy * dy) < 5) {
      onRemovePlaced?.(td.playerId);
    }
  }, [onRemovePlaced]);

  // Ball uses native doc listeners — bypasses setPointerCapture confusion entirely
  const startBallDrag = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const pitchEl = (ref as React.RefObject<HTMLDivElement>)?.current;
    if (!pitchEl) return;
    const onMove = (me: PointerEvent) => {
      const rect = pitchEl.getBoundingClientRect();
      onMoveBall?.(
        Math.max(0, Math.min(1, (me.clientX - rect.left) / rect.width)),
        Math.max(0, Math.min(1, (me.clientY - rect.top) / rect.height)),
      );
    };
    const onUp = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  }, [ref, onMoveBall]);

  return (
    <div
      ref={ref}
      className="absolute inset-0 overflow-hidden"
      style={{ background: "#1b5e2a" }}
      onPointerMove={moveToken}
      onPointerUp={endTokenDrag}
    >
      {/* Grass stripes — horizontal */}
      <div className="absolute inset-0 flex flex-row pointer-events-none">
        {Array.from({ length: 18 }).map((_, i) => (
          <div
            key={i}
            className="h-full"
            style={{
              flex: 1,
              background: i % 2 === 0 ? "#1e6630" : "#1b5e2a",
            }}
          />
        ))}
      </div>

      {/* Field lines — horizontal pitch, viewBox 0 0 150 100 */}
      <svg
        viewBox="0 0 150 100"
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
        style={{ opacity: 0.8 }}
      >
        <g stroke="rgba(255,255,255,0.9)" strokeWidth="0.4" fill="none">
          {/* Outer boundary */}
          <rect x="3" y="3" width="144" height="94" />

          {/* Midfield line (vertical) */}
          <line x1="75" y1="3" x2="75" y2="97" />

          {/* Center circle */}
          <circle cx="75" cy="50" r="10" />
          <circle cx="75" cy="50" r="0.6" fill="rgba(255,255,255,0.9)" />

          {/* Left penalty area */}
          <rect x="3" y="22" width="20" height="56" />
          {/* Left goal area */}
          <rect x="3" y="36" width="7" height="28" />
          {/* Left penalty spot */}
          <circle cx="14.5" cy="50" r="0.6" fill="rgba(255,255,255,0.9)" />
          {/* Left penalty arc (curves right toward center field) */}
          <path d="M 23 40.5 A 10 10 0 0 1 23 59.5" />

          {/* Right penalty area */}
          <rect x="127" y="22" width="20" height="56" />
          {/* Right goal area */}
          <rect x="140" y="36" width="7" height="28" />
          {/* Right penalty spot */}
          <circle cx="135.5" cy="50" r="0.6" fill="rgba(255,255,255,0.9)" />
          {/* Right penalty arc (curves left toward center field) */}
          <path d="M 127 40.5 A 10 10 0 0 0 127 59.5" />

          {/* Corner arcs */}
          <path d="M 3 6.5 A 3.5 3.5 0 0 0 6.5 3" />
          <path d="M 147 6.5 A 3.5 3.5 0 0 1 143.5 3" />
          <path d="M 3 93.5 A 3.5 3.5 0 0 1 6.5 97" />
          <path d="M 147 93.5 A 3.5 3.5 0 0 0 143.5 97" />
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

      {/* Ball */}
      {ballPos && (
        <div
          className="absolute cursor-grab active:cursor-grabbing select-none"
          style={{
            left: `${ballPos.x * 100}%`,
            top: `${ballPos.y * 100}%`,
            transform: "translate(-50%, -50%)",
            touchAction: "none",
            zIndex: 25,
            width: 72,
            height: 72,
            filter: "drop-shadow(0 6px 18px rgba(0,0,0,0.7))",
          }}
          onPointerDown={startBallDrag}
        >
          <img
            src="/ball.png"
            alt="ball"
            style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none" }}
            draggable={false}
          />
        </div>
      )}

      {/* Empty pitch hint */}
      {placedPlayers.length === 0 && !ballPos && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span
            className="text-white/25 text-sm font-sans tracking-widest select-none uppercase"
          >
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
      {/* Photo circle */}
      <div
        className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center font-bold text-white"
        style={{
          backgroundColor: teamColor,
          border: "3px solid rgba(255,255,255,0.95)",
          boxShadow: `0 6px 24px rgba(0,0,0,0.75), 0 0 0 2px ${teamColor}66`,
        }}
      >
        {player.imageUrl ? (
          <img src={player.imageUrl} alt={player.name} className="w-full h-full object-cover" />
        ) : (
          <span className="font-arabic text-2xl leading-none">{initials}</span>
        )}
      </div>

      {/* Number badge */}
      <div
        className="absolute -top-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white"
        style={{
          backgroundColor: teamColor,
          border: "2.5px solid white",
          boxShadow: "0 2px 6px rgba(0,0,0,0.6)",
        }}
      >
        {player.number ?? "?"}
      </div>

      {/* Name label */}
      <div
        className="mt-2 text-white text-xs font-bold font-arabic px-2.5 py-1 rounded-full whitespace-nowrap"
        style={{
          background: "rgba(0,0,0,0.88)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.18)",
          textShadow: "0 1px 3px rgba(0,0,0,0.9)",
          fontSize: 13,
        }}
      >
        {player.name}
      </div>
    </div>
  );
}
