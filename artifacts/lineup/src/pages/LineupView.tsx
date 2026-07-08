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
      `left:${e.clientX}px`,
      `top:${e.clientY}px`,
      "box-shadow:0 8px 32px rgba(0,0,0,0.7)",
      "border:3px solid rgba(255,255,255,0.95)",
      "opacity:0.9",
    ].join(";");
    ghost.textContent = player.number?.toString() || player.name[0];
    document.body.appendChild(ghost);
    ghostRef.current = ghost;
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

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#1b5e2a]">
      {/* Brand bar */}
      <div className="flex items-center justify-center shrink-0 h-10 bg-black z-30 border-b border-white/5">
        <img
          src="/logo.png"
          alt="Logo"
          className="h-7 object-contain"
          style={{ filter: "brightness(0) invert(1)", maxWidth: 200 }}
        />
      </div>

      {/* Team selectors + navigation */}
      <div className="flex items-center shrink-0 h-11 bg-black/80 border-b border-white/10 z-30 px-3 gap-2">
        <div className="w-52">
          <TeamSelector value={team1Id} onChange={setTeam1Id} teams={teams} />
        </div>
        <div className="flex-1 flex justify-center">
          <Navigation />
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
        />

        {/* Pitch — takes remaining space */}
        <div className="flex-1 relative min-w-0">
          <Pitch
            ref={pitchRef}
            placedPlayers={Object.values(placedPlayers)}
            onMovePlaced={movePlacedPlayer}
            onRemovePlaced={removePlacedPlayer}
          />
        </div>

        <TeamPanel
          team={team2}
          side="right"
          onDragStart={startDrag}
          placedIds={placedPlayers}
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
      const key = POSITIONS.includes(p.position) ? (p.position as keyof typeof grouped) : "MID";
      grouped[key].push(p);
    });
    return grouped;
  }, [players]);

  const primaryColor = team?.primaryColor || "#1a6b35";
  const isLeft = side === "left";

  return (
    <div
      className="h-full flex flex-col shrink-0 bg-black/80 border-white/10 z-20"
      style={{
        width: 220,
        borderRight: isLeft ? "1px solid rgba(255,255,255,0.08)" : undefined,
        borderLeft: !isLeft ? "1px solid rgba(255,255,255,0.08)" : undefined,
      }}
    >
      {/* Team identity */}
      {team && (
        <div
          className="flex items-center gap-2 px-3 py-2 shrink-0 border-b border-white/8"
          style={{ flexDirection: isLeft ? "row" : "row-reverse" }}
        >
          <div
            className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center overflow-hidden"
            style={{ background: `${primaryColor}22`, border: `2px solid ${primaryColor}55` }}
          >
            {team.logoUrl ? (
              <img src={team.logoUrl} alt={team.name} className="w-6 h-6 object-contain" />
            ) : (
              <span className="text-white font-arabic text-sm font-bold leading-none">
                {team.nameAr.charAt(0)}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0" style={{ textAlign: isLeft ? "left" : "right" }}>
            <div className="text-white font-arabic font-bold text-sm leading-tight truncate">{team.nameAr}</div>
            <div className="text-white/35 text-[9px] tracking-wider uppercase truncate">{team.name}</div>
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="mx-3 mb-1 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }} />

      {/* Player list */}
      <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0 py-1">
        {!team ? null : players.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <span className="text-white/25 text-xs font-arabic">لا يوجد لاعبون</span>
          </div>
        ) : (
          POSITIONS.map((pos) => {
            const posPlayers = groupedPlayers[pos as keyof typeof groupedPlayers];
            if (posPlayers.length === 0) return null;
            return (
              <div key={pos} className="mb-1">
                <div className="px-3 py-0.5" style={{ textAlign: isLeft ? "left" : "right" }}>
                  <span className="text-[9px] font-bold text-white/30 tracking-widest uppercase">{pos}</span>
                </div>
                {posPlayers.map((p) => (
                  <PlayerRow
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

      {/* Coach footer */}
      {team && (
        <div
          className="shrink-0 border-t border-white/8 px-3 py-2"
          style={{ borderTopColor: `${primaryColor}30` }}
        >
          <div className="text-[9px] font-bold text-white/25 tracking-widest uppercase mb-1.5"
            style={{ textAlign: isLeft ? "left" : "right" }}>
            المدرب
          </div>
          <div className="flex items-center gap-2" style={{ flexDirection: isLeft ? "row" : "row-reverse" }}>
            <div
              className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center overflow-hidden border-2"
              style={{ borderColor: `${primaryColor}60`, background: `${primaryColor}20` }}
            >
              {team.coachImageUrl ? (
                <img src={team.coachImageUrl} alt={team.coachName || "Coach"} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white/40 text-xs font-bold">
                  {team.coachName ? team.coachName.charAt(0) : "؟"}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0" style={{ textAlign: isLeft ? "left" : "right" }}>
              {team.coachName ? (
                <div className="text-white font-arabic font-bold text-xs truncate">{team.coachName}</div>
              ) : (
                <div className="text-white/25 text-xs font-arabic italic">لم يُضف بعد</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PlayerRow({
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
  const isLeft = side === "left";
  const num = player.number ?? "–";

  return (
    <div
      onPointerDown={(e) => onDragStart(player, primaryColor, e)}
      className="flex items-center mx-1.5 mb-1 select-none cursor-grab active:cursor-grabbing group"
      style={{
        touchAction: "none",
        opacity: isPlaced ? 0.3 : 1,
        transition: "opacity 0.2s",
        flexDirection: isLeft ? "row" : "row-reverse",
      }}
    >
      {/* Jersey number — prominent, outside the card */}
      <div
        className="shrink-0 w-9 flex items-center font-black text-lg leading-none"
        style={{
          justifyContent: isLeft ? "flex-end" : "flex-start",
          paddingRight: isLeft ? 6 : 0,
          paddingLeft: isLeft ? 0 : 6,
          color: primaryColor,
          textShadow: `0 0 12px ${primaryColor}88`,
          minWidth: 36,
        }}
      >
        {num}
      </div>

      {/* Card */}
      <div
        className="flex-1 relative overflow-hidden rounded-xl group-hover:brightness-110 transition-all"
        style={{
          background: `linear-gradient(135deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.5) 100%)`,
          border: `1px solid ${primaryColor}28`,
          boxShadow: isPlaced ? "none" : `0 2px 8px rgba(0,0,0,0.35)`,
        }}
      >
        {/* Accent stripe */}
        <div
          className="absolute top-0 bottom-0 w-[3px]"
          style={{
            [isLeft ? "left" : "right"]: 0,
            background: `linear-gradient(to bottom, ${primaryColor}, ${primaryColor}44)`,
          }}
        />

        {/* Hover glow */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{ background: `linear-gradient(135deg, ${primaryColor}14 0%, transparent 60%)` }}
        />

        {/* Content */}
        <div
          className="relative flex items-center gap-2 px-2.5 py-1.5"
          style={{ flexDirection: isLeft ? "row" : "row-reverse" }}
        >
          {/* Avatar */}
          <div
            className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}cc, ${primaryColor}66)`,
              boxShadow: `0 0 0 1.5px ${primaryColor}44`,
            }}
          >
            {player.imageUrl ? (
              <img src={player.imageUrl} alt={player.name} className="w-full h-full object-cover" />
            ) : (
              <span className="font-arabic text-white font-extrabold text-xs">{initials}</span>
            )}
          </div>

          {/* Name + position */}
          <div className="flex-1 min-w-0" style={{ textAlign: isLeft ? "left" : "right" }}>
            <div className="text-white font-bold text-xs font-arabic truncate leading-tight">
              {player.name}
            </div>
            <div
              className="flex items-center gap-1 mt-0.5"
              style={{ justifyContent: isLeft ? "flex-start" : "flex-end" }}
            >
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: `${primaryColor}aa` }}>
                {player.position}
              </span>
              {isPlaced && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_4px_#34d399]" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
