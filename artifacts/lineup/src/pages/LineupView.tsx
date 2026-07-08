import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useListTeams, useListTeamPlayers } from "@/lib/use-store";
import type { Team, Player } from "@/lib/use-store";
import { Pitch } from "@/components/Pitch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navigation } from "@/components/Navigation";
import { Maximize2, Minimize2 } from "lucide-react";

export type PlacedPlayer = {
  player: Player;
  teamColor: string;
  x: number;
  y: number;
};

export default function LineupView() {
  const { data: teams = [], isLoading: isLoadingTeams } = useListTeams();
  const [team1Id, setTeam1Id] = useState<number | null>(null);
  const [team2Id, setTeam2Id] = useState<number | null>(null);
  const [placedPlayers, setPlacedPlayers] = useState<Record<number, PlacedPlayer>>({});
  const [ballPos, setBallPos] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.5 });
  const [fullscreen, setFullscreen] = useState(false);

  const pitchRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{ player: Player; teamColor: string; startX: number; startY: number } | null>(null);

  useEffect(() => {
    if (teams.length >= 2 && !team1Id && !team2Id) {
      setTeam1Id(teams[1].id); // left panel = second team (France)
      setTeam2Id(teams[0].id); // right panel = first team (Morocco)
    } else if (teams.length === 1 && !team1Id && !team2Id) {
      setTeam1Id(teams[0].id);
      setTeam2Id(teams[0].id);
    }
  }, [teams, team1Id, team2Id]);

  const team1 = teams.find((t) => t.id === team1Id);
  const team2 = teams.find((t) => t.id === team2Id);

  const dropOnPitch = useCallback((clientX: number, clientY: number) => {
    const pitch = pitchRef.current;
    const ds = dragStateRef.current;
    if (!pitch || !ds) return;
    const rect = pitch.getBoundingClientRect();
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return;
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    setPlacedPlayers(prev => ({
      ...prev,
      [ds.player.id]: { player: ds.player, teamColor: ds.teamColor, x, y },
    }));
  }, []);

  const removeGhost = useCallback(() => {
    ghostRef.current?.remove();
    ghostRef.current = null;
    dragStateRef.current = null;
  }, []);

  const createGhost = useCallback((player: Player, teamColor: string, x: number, y: number) => {
    const ghost = document.createElement("div");
    ghost.style.cssText = [
      "position:fixed",
      "pointer-events:none",
      "z-index:9999",
      "width:52px",
      "height:52px",
      "border-radius:50%",
      `background:${teamColor}`,
      "color:white",
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "font-weight:700",
      "font-size:14px",
      "font-family:sans-serif",
      "transform:translate(-50%,-50%)",
      `left:${x}px`,
      `top:${y}px`,
      "box-shadow:0 8px 32px rgba(0,0,0,0.7)",
      "border:3px solid rgba(255,255,255,0.95)",
      "opacity:0.9",
    ].join(";");
    ghost.textContent = player.number?.toString() || player.name[0];
    document.body.appendChild(ghost);
    ghostRef.current = ghost;
  }, []);

  useEffect(() => {
    const DRAG_THRESHOLD = 14;
    const onMove = (e: PointerEvent) => {
      const ds = dragStateRef.current;
      if (!ds) return;
      if (!ghostRef.current) {
        const dx = e.clientX - ds.startX;
        const dy = e.clientY - ds.startY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < DRAG_THRESHOLD) return;
        // Vertical-dominant movement = scroll → cancel drag entirely
        if (Math.abs(dy) > Math.abs(dx)) {
          dragStateRef.current = null;
          return;
        }
        createGhost(ds.player, ds.teamColor, e.clientX, e.clientY);
        return;
      }
      ghostRef.current.style.left = `${e.clientX}px`;
      ghostRef.current.style.top = `${e.clientY}px`;
    };
    const onUp = (e: PointerEvent) => {
      if (!dragStateRef.current) return;
      if (ghostRef.current) {
        dropOnPitch(e.clientX, e.clientY);
        removeGhost();
      } else {
        dragStateRef.current = null;
      }
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };
  }, [dropOnPitch, removeGhost, createGhost]);

  const startDrag = useCallback((player: Player, teamColor: string, e: React.PointerEvent) => {
    // No preventDefault — lets the browser keep scroll control with pan-y
    dragStateRef.current = { player, teamColor, startX: e.clientX, startY: e.clientY };
  }, []);

  const movePlacedPlayer = useCallback((playerId: number, x: number, y: number) => {
    setPlacedPlayers(prev =>
      prev[playerId] ? { ...prev, [playerId]: { ...prev[playerId], x, y } } : prev
    );
  }, []);

  const removePlacedPlayer = useCallback((playerId: number) => {
    setPlacedPlayers(prev => {
      const next = { ...prev };
      delete next[playerId];
      return next;
    });
  }, []);

  const clearTeam = useCallback((teamId: number) => {
    setPlacedPlayers(prev => {
      const next = { ...prev };
      Object.values(next).forEach(pp => {
        if (pp.player.teamId === teamId) delete next[pp.player.id];
      });
      return next;
    });
  }, []);

  if (isLoadingTeams) {
    return (
      <div className="h-screen w-screen flex items-center justify-center" style={{ background: "#1b5e2a" }}>
        <span className="text-white/40 text-xl font-arabic">جاري التحميل...</span>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="h-screen w-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
        <div className="fixed top-4 right-4 z-50"><Navigation /></div>
        <h1 className="text-3xl font-arabic text-white">لا توجد فرق</h1>
        <p className="text-white/40">No teams yet — go to Teams to add some</p>
      </div>
    );
  }

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-[#1b5e2a]">
        <Pitch
          ref={pitchRef}
          placedPlayers={Object.values(placedPlayers)}
          onMovePlaced={movePlacedPlayer}
          onRemovePlaced={removePlacedPlayer}
          ballPos={ballPos}
          onMoveBall={(x, y) => setBallPos({ x, y })}
        />
        {/* Exit fullscreen button */}
        <button
          onClick={() => setFullscreen(false)}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 hover:bg-black/90 text-white text-sm font-medium backdrop-blur-sm border border-white/20 transition-all"
        >
          <Minimize2 className="w-4 h-4" />
          خروج
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#1b5e2a]">
      {/* Team selectors + navigation */}
      <div className="flex items-center shrink-0 h-11 bg-black/90 border-b border-white/10 z-30 px-3 gap-2">
        <div className="w-52">
          <TeamSelector value={team1Id} onChange={setTeam1Id} teams={teams} />
        </div>
        <div className="flex-1 flex justify-center gap-3">
          <Navigation />
          <button
            onClick={() => setFullscreen(true)}
            title="Fullscreen"
            className="flex items-center gap-1.5 px-3 h-7 rounded-md bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors border border-white/15"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            عرض كامل
          </button>
        </div>
        <div className="w-52">
          <TeamSelector value={team2Id} onChange={setTeam2Id} teams={teams} />
        </div>
      </div>

      {/* Main row: left panel | pitch | right panel */}
      <div className="flex flex-1 min-h-0">
        <TeamPanel
          team={team1}
          side="left"
          onDragStart={startDrag}
          placedIds={placedPlayers}
          onClear={clearTeam}
        />

        {/* Pitch — takes remaining space */}
        <div className="flex-1 relative min-w-0">
          <Pitch
            ref={pitchRef}
            placedPlayers={Object.values(placedPlayers)}
            onMovePlaced={movePlacedPlayer}
            onRemovePlaced={removePlacedPlayer}
            ballPos={ballPos}
            onMoveBall={(x, y) => setBallPos({ x, y })}
          />
        </div>

        <TeamPanel
          team={team2}
          side="right"
          onDragStart={startDrag}
          placedIds={placedPlayers}
          onClear={clearTeam}
        />
      </div>
    </div>
  );
}

const POSITIONS = ["GK", "DEF", "MID", "FWD"];

function TeamSelector({
  value,
  onChange,
  teams,
}: {
  value: number | null;
  onChange: (id: number) => void;
  teams: Team[];
}) {
  if (!value) return null;
  return (
    <Select value={value.toString()} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger className="h-8 text-xs bg-black/40 border-white/15 text-white font-arabic w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-[#111] border-white/10 text-white font-arabic z-50">
        {teams.map((t) => (
          <SelectItem key={t.id} value={t.id.toString()} className="focus:bg-white/10 text-sm">
            {t.nameAr}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function TeamPanel({
  team,
  side,
  onDragStart,
  placedIds,
  onClear,
}: {
  team?: Team;
  side: "left" | "right";
  onDragStart: (player: Player, teamColor: string, e: React.PointerEvent) => void;
  placedIds: Record<number, PlacedPlayer>;
  onClear: (teamId: number) => void;
}) {
  const { data: players = [] } = useListTeamPlayers(team?.id || 0);

  const groupedPlayers = useMemo(() => {
    const grouped = { GK: [] as Player[], DEF: [] as Player[], MID: [] as Player[], FWD: [] as Player[] };
    players.forEach((p) => {
      const key = POSITIONS.includes(p.position) ? (p.position as keyof typeof grouped) : "MID";
      grouped[key].push(p);
    });
    return grouped;
  }, [players]);

  const primaryColor = team?.primaryColor || "#1a6b35";
  const isLeft = side === "left";

  return (
    <div
      className="h-full flex flex-col shrink-0 z-20"
      style={{
        width: 260,
        background: "linear-gradient(180deg, #0d0d0d 0%, #111 100%)",
        borderRight: isLeft ? "1px solid rgba(255,255,255,0.07)" : undefined,
        borderLeft: !isLeft ? "1px solid rgba(255,255,255,0.07)" : undefined,
      }}
    >
      {/* Team header + coach */}
      {team && (
        <div
          className="shrink-0 px-4 pt-3 pb-3"
          style={{ borderBottom: `1px solid ${primaryColor}30` }}
        >
          {/* Team identity */}
          <div
            className="flex items-center gap-3 mb-3"
            style={{ flexDirection: isLeft ? "row" : "row-reverse" }}
          >
            <div
              className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center overflow-hidden"
              style={{
                background: `${primaryColor}20`,
                border: `2px solid ${primaryColor}60`,
                boxShadow: `0 0 14px ${primaryColor}30`,
              }}
            >
              {team.logoUrl ? (
                <img src={team.logoUrl} alt={team.name} className="w-7 h-7 object-contain" />
              ) : (
                <span className="text-white font-arabic text-sm font-bold leading-none">{team.nameAr.charAt(0)}</span>
              )}
            </div>
            <div className="flex-1 min-w-0" style={{ textAlign: isLeft ? "left" : "right" }}>
              <div className="text-white font-arabic font-bold text-base leading-tight truncate">{team.nameAr}</div>
              <div className="text-white/35 text-[10px] tracking-widest uppercase mt-0.5">{team.name}</div>
            </div>
            <button
              onClick={() => onClear(team.id)}
              title="مسح اللاعبين / Clear players"
              className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-white/40 hover:text-white hover:bg-white/10 transition-colors border border-white/10 hover:border-white/25"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
              مسح
            </button>
          </div>

          {/* Coach */}
          <div
            className="flex items-center gap-3 rounded-xl px-3 py-2"
            style={{
              flexDirection: isLeft ? "row" : "row-reverse",
              background: `${primaryColor}12`,
              border: `1px solid ${primaryColor}25`,
            }}
          >
            <div
              className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center overflow-hidden"
              style={{
                border: `2px solid ${primaryColor}55`,
                background: `${primaryColor}20`,
              }}
            >
              {team.coachImageUrl ? (
                <img src={team.coachImageUrl} alt={team.coachName || "Coach"} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white/40 text-base font-bold">
                  {team.coachName ? team.coachName.charAt(0) : "؟"}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0" style={{ textAlign: isLeft ? "left" : "right" }}>
              <div
                className="text-[9px] font-black tracking-[0.18em] uppercase mb-0.5"
                style={{ color: `${primaryColor}70` }}
              >
                المدرب · Coach
              </div>
              {team.coachName ? (
                <div className="text-white font-arabic font-bold text-sm leading-snug truncate">{team.coachName}</div>
              ) : (
                <div className="text-white/25 text-sm font-arabic">لم يُضف بعد</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Player list */}
      <div className="flex-1 overflow-y-auto min-h-0 py-2 px-2" style={{ scrollbarWidth: "none" }}>
        {!team ? null : players.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <span className="text-white/20 text-sm font-arabic">لا يوجد لاعبون</span>
          </div>
        ) : (
          POSITIONS.map((pos) => {
            const posPlayers = groupedPlayers[pos as keyof typeof groupedPlayers];
            if (posPlayers.length === 0) return null;
            return (
              <div key={pos} className="mb-3">
                <div className="px-1 pb-1" style={{ textAlign: isLeft ? "left" : "right" }}>
                  <span
                    className="text-[10px] font-black tracking-[0.2em] uppercase px-2 py-0.5 rounded"
                    style={{ color: primaryColor, background: `${primaryColor}18` }}
                  >
                    {pos}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {posPlayers.map((p) => (
                    <PlayerCard
                      key={p.id}
                      player={p}
                      primaryColor={primaryColor}
                      side={side}
                      onDragStart={onDragStart}
                      isPlaced={!!placedIds[p.id]}
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function PlayerCard({
  player,
  primaryColor,
  side,
  onDragStart,
  isPlaced,
}: {
  player: Player;
  primaryColor: string;
  side: "left" | "right";
  onDragStart: (player: Player, teamColor: string, e: React.PointerEvent) => void;
  isPlaced: boolean;
}) {
  const isLeft = side === "left";
  const num = player.number ?? "–";

  return (
    <div
      onPointerDown={(e) => onDragStart(player, primaryColor, e)}
      className="relative select-none cursor-grab active:cursor-grabbing group rounded-2xl overflow-hidden"
      style={{
        touchAction: "pan-y",
        opacity: isPlaced ? 0.28 : 1,
        transition: "opacity 0.2s, transform 0.15s",
        background: `linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.35) 100%)`,
        border: `1px solid ${primaryColor}22`,
        boxShadow: isPlaced ? "none" : `0 3px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)`,
      }}
    >
      {/* Colored left/right edge */}
      <div
        className="absolute top-0 bottom-0 w-1"
        style={{
          [isLeft ? "left" : "right"]: 0,
          background: `linear-gradient(to bottom, ${primaryColor}, ${primaryColor}55)`,
        }}
      />

      {/* Hover tint */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl"
        style={{ background: `${primaryColor}12` }}
      />

      {/* Inner layout */}
      <div
        className="relative flex items-center gap-3 px-3 py-2.5"
        style={{ flexDirection: isLeft ? "row" : "row-reverse" }}
      >
        {/* Photo */}
        <div
          className="w-12 h-12 rounded-xl shrink-0 overflow-hidden flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}bb, ${primaryColor}44)`,
            boxShadow: `0 0 0 2px ${primaryColor}35`,
          }}
        >
          {player.imageUrl ? (
            <img src={player.imageUrl} alt={player.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-white font-arabic font-extrabold text-base leading-none">
              {player.name.charAt(0)}
            </span>
          )}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0" style={{ textAlign: isLeft ? "left" : "right" }}>
          <div className="text-white font-arabic font-bold text-sm leading-snug truncate">
            {player.name}
          </div>
          <div
            className="flex items-center gap-1.5 mt-0.5"
            style={{ justifyContent: isLeft ? "flex-start" : "flex-end" }}
          >
            {isPlaced && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_#34d399]" />
            )}
          </div>
        </div>

        {/* Number badge */}
        <div
          className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-black text-lg"
          style={{
            background: `${primaryColor}18`,
            color: primaryColor,
            border: `1px solid ${primaryColor}30`,
            textShadow: `0 0 10px ${primaryColor}80`,
          }}
        >
          {num}
        </div>
      </div>
    </div>
  );
}
