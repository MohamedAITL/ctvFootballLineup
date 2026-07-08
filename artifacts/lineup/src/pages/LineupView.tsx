import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useListTeams, useListTeamPlayers, getListTeamPlayersQueryKey } from "@workspace/api-client-react";
import type { Team, Player } from "@workspace/api-client-react";
import { Pitch } from "@/components/Pitch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navigation } from "@/components/Navigation";

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

  const pitchRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{ player: Player; teamColor: string } | null>(null);

  useEffect(() => {
    if (teams.length >= 2 && !team1Id && !team2Id) {
      setTeam1Id(teams[0].id);
      setTeam2Id(teams[1].id);
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
    if (!pitch || !ds) return false;
    const rect = pitch.getBoundingClientRect();
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return false;
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    setPlacedPlayers(prev => ({
      ...prev,
      [ds.player.id]: { player: ds.player, teamColor: ds.teamColor, x, y }
    }));
    return true;
  }, []);

  const removeGhost = useCallback(() => {
    if (ghostRef.current) {
      ghostRef.current.remove();
      ghostRef.current = null;
    }
    dragStateRef.current = null;
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!ghostRef.current) return;
      ghostRef.current.style.left = `${e.clientX}px`;
      ghostRef.current.style.top = `${e.clientY}px`;
    };
    const onUp = (e: PointerEvent) => {
      if (!ghostRef.current) return;
      dropOnPitch(e.clientX, e.clientY);
      removeGhost();
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };
  }, [dropOnPitch, removeGhost]);

  const startDrag = useCallback((player: Player, teamColor: string, e: React.PointerEvent) => {
    e.preventDefault();
    dragStateRef.current = { player, teamColor };
    const ghost = document.createElement("div");
    ghost.style.cssText = [
      "position:fixed",
      "pointer-events:none",
      "z-index:9999",
      "width:56px",
      "height:56px",
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
      `left:${e.clientX}px`,
      `top:${e.clientY}px`,
      "box-shadow:0 6px 32px rgba(0,0,0,0.7)",
      "border:3px solid rgba(255,255,255,0.9)",
      "opacity:0.95",
    ].join(";");
    ghost.textContent = player.number?.toString() || player.name[0];
    document.body.appendChild(ghost);
    ghostRef.current = ghost;
  }, []);

  const movePlacedPlayer = useCallback((playerId: number, x: number, y: number) => {
    setPlacedPlayers(prev => {
      if (!prev[playerId]) return prev;
      return { ...prev, [playerId]: { ...prev[playerId], x, y } };
    });
  }, []);

  const removePlacedPlayer = useCallback((playerId: number) => {
    setPlacedPlayers(prev => {
      const next = { ...prev };
      delete next[playerId];
      return next;
    });
  }, []);

  if (isLoadingTeams) {
    return (
      <div className="h-screen w-screen bg-[#1b4d24] flex items-center justify-center">
        <div className="text-white/50 text-xl font-arabic">جاري التحميل...</div>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="h-screen w-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
        <Navigation />
        <h1 className="text-3xl font-arabic text-white">لا توجد فرق</h1>
        <p className="text-white/50 text-xl">No teams yet</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      {/* Pitch fills the entire screen */}
      <Pitch
        ref={pitchRef}
        placedPlayers={Object.values(placedPlayers)}
        onMovePlaced={movePlacedPlayer}
        onRemovePlaced={removePlacedPlayer}
      />

      {/* Navigation */}
      <div className="absolute top-3 right-4 z-30">
        <Navigation />
      </div>

      {/* Team selectors */}
      <div className="absolute top-3 left-[22%] right-[22%] z-30 flex justify-center gap-8 px-8">
        <div className="w-52">
          <TeamSelector value={team1Id} onChange={setTeam1Id} teams={teams} />
        </div>
        <div className="w-52">
          <TeamSelector value={team2Id} onChange={setTeam2Id} teams={teams} />
        </div>
      </div>

      {/* Left panel — Team 1 */}
      <TeamPanel
        team={team1}
        side="left"
        onDragStart={startDrag}
        placedIds={placedPlayers}
      />

      {/* Right panel — Team 2 */}
      <TeamPanel
        team={team2}
        side="right"
        onDragStart={startDrag}
        placedIds={placedPlayers}
      />
    </div>
  );
}

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
    <Select value={value.toString()} onValueChange={(val) => onChange(Number(val))}>
      <SelectTrigger className="bg-black/60 backdrop-blur border-white/20 text-white font-arabic h-10 text-sm">
        <SelectValue placeholder="اختر الفريق" />
      </SelectTrigger>
      <SelectContent className="bg-[#111] border-white/10 text-white font-arabic">
        {teams.map((t) => (
          <SelectItem key={t.id} value={t.id.toString()} className="focus:bg-white/10 focus:text-white">
            {t.nameAr}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const POSITIONS = ["GK", "DEF", "MID", "FWD"];

function TeamPanel({
  team,
  side,
  onDragStart,
  placedIds,
}: {
  team?: Team;
  side: "left" | "right";
  onDragStart: (player: Player, teamColor: string, e: React.PointerEvent) => void;
  placedIds: Record<number, PlacedPlayer>;
}) {
  const { data: players = [] } = useListTeamPlayers(team?.id || 0, {
    query: { enabled: !!team?.id, queryKey: getListTeamPlayersQueryKey(team?.id || 0) },
  });

  const groupedPlayers = useMemo(() => {
    const grouped = { GK: [] as Player[], DEF: [] as Player[], MID: [] as Player[], FWD: [] as Player[] };
    players.forEach((p) => {
      const pos = POSITIONS.includes(p.position) ? (p.position as keyof typeof grouped) : "MID";
      grouped[pos].push(p);
    });
    return grouped;
  }, [players]);

  const primaryColor = team?.primaryColor || "#1b4d24";

  const panelStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    [side]: 0,
    width: "21%",
    height: "100%",
    zIndex: 20,
    display: "flex",
    flexDirection: "column",
    background: side === "left"
      ? `linear-gradient(to right, rgba(0,0,0,0.82) 70%, transparent)`
      : `linear-gradient(to left, rgba(0,0,0,0.82) 70%, transparent)`,
  };

  return (
    <div style={panelStyle}>
      {/* Team header */}
      {team && (
        <div className="flex flex-col items-center pt-14 pb-3 px-3 border-b border-white/10">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center overflow-hidden mb-2 shadow-xl"
            style={{ background: `${primaryColor}33`, border: `2px solid ${primaryColor}66` }}
          >
            {team.logoUrl ? (
              <img src={team.logoUrl} alt={team.name} className="w-10 h-10 object-contain" />
            ) : (
              <span className="text-2xl font-arabic text-white">{team.nameAr[0]}</span>
            )}
          </div>
          <h2 className="text-lg font-arabic font-bold text-white text-center leading-tight">{team.nameAr}</h2>
          <p className="text-[10px] text-white/40 tracking-widest uppercase">{team.name}</p>
        </div>
      )}

      {/* Players */}
      <div className="flex-1 overflow-y-auto py-2 scrollbar-hide">
        {!team ? null : players.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/30 text-sm font-arabic">
            لا يوجد لاعبون
          </div>
        ) : (
          POSITIONS.map((pos) => {
            const posPlayers = groupedPlayers[pos as keyof typeof groupedPlayers];
            if (posPlayers.length === 0) return null;
            return (
              <div key={pos} className="mb-1">
                <div className="px-3 py-1">
                  <span className="text-[9px] font-bold text-white/30 tracking-widest uppercase">{pos}</span>
                </div>
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
  const initials = player.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  return (
    <div
      onPointerDown={(e) => onDragStart(player, primaryColor, e)}
      className={[
        "flex items-center gap-2 mx-2 mb-1 px-2 py-2 rounded-lg select-none cursor-grab active:cursor-grabbing transition-all",
        isPlaced
          ? "opacity-40 bg-white/5"
          : "bg-black/40 hover:bg-black/60 border border-white/10 hover:border-white/20",
      ].join(" ")}
      style={{ touchAction: "none", flexDirection: side === "right" ? "row-reverse" : "row" }}
    >
      {/* Big photo */}
      <div
        className="w-12 h-12 rounded-lg overflow-hidden shrink-0 flex items-center justify-center font-bold text-white text-sm shadow-md"
        style={{ backgroundColor: primaryColor, border: `1.5px solid ${primaryColor}88` }}
      >
        {player.imageUrl ? (
          <img src={player.imageUrl} alt={player.name} className="w-full h-full object-cover" />
        ) : (
          <span className="font-arabic text-base">{initials}</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0" style={{ textAlign: side === "right" ? "right" : "left" }}>
        <div className="text-white font-bold text-sm leading-tight truncate font-arabic">{player.name}</div>
        <div className="flex items-center gap-1 mt-0.5" style={{ justifyContent: side === "right" ? "flex-end" : "flex-start" }}>
          <span
            className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded"
            style={{ backgroundColor: primaryColor }}
          >
            {player.number ?? "—"}
          </span>
          {isPlaced && <span className="w-1.5 h-1.5 rounded-full bg-green-400" />}
        </div>
      </div>
    </div>
  );
}
