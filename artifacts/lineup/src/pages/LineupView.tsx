import { useState, useMemo, useEffect } from "react";
import { useListTeams, useListTeamPlayers } from "@workspace/api-client-react";
import type { Team, Player } from "@workspace/api-client-react/src/generated/api.schemas";
import { Pitch } from "@/components/Pitch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Navigation } from "@/components/Navigation";

export default function LineupView() {
  const { data: teams = [], isLoading: isLoadingTeams } = useListTeams();
  const [team1Id, setTeam1Id] = useState<number | null>(null);
  const [team2Id, setTeam2Id] = useState<number | null>(null);

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

  if (isLoadingTeams) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white/50 text-xl font-arabic">جاري التحميل...</div>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
        <Navigation />
        <h1 className="text-3xl font-arabic text-white">لا توجد فرق</h1>
        <p className="text-white/50 text-xl">No teams yet</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#0a0a0a] overflow-hidden flex flex-col font-sans relative">
      <Navigation />
      
      {/* Top Header Controls */}
      <header className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/80 to-transparent z-10 flex items-start justify-between px-8 pt-4">
        <div className="w-64">
          <TeamSelector value={team1Id} onChange={setTeam1Id} teams={teams} />
        </div>
        <div className="w-64">
          <TeamSelector value={team2Id} onChange={setTeam2Id} teams={teams} />
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 flex w-full h-full relative isolate">
        <TeamPanel team={team1} side="left" />
        <div className="flex-1 h-full flex items-center justify-center p-8 z-0">
          <Pitch />
        </div>
        <TeamPanel team={team2} side="right" />
      </main>
    </div>
  );
}

function TeamSelector({ value, onChange, teams }: { value: number | null, onChange: (id: number) => void, teams: Team[] }) {
  if (!value) return null;
  return (
    <Select value={value.toString()} onValueChange={(val) => onChange(Number(val))}>
      <SelectTrigger className="bg-black/50 border-white/10 text-white font-arabic h-12">
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

function TeamPanel({ team, side }: { team?: Team, side: "left" | "right" }) {
  const { data: players = [] } = useListTeamPlayers(team?.id || 0, {
    query: { enabled: !!team?.id }
  });

  const groupedPlayers = useMemo(() => {
    const grouped = { GK: [], DEF: [], MID: [], FWD: [] } as Record<string, Player[]>;
    players.forEach(p => {
      const pos = POSITIONS.includes(p.position) ? p.position : "MID";
      grouped[pos].push(p);
    });
    return grouped;
  }, [players]);

  if (!team) {
    return <div className={`w-[25%] h-full z-10 flex flex-col bg-black/60 backdrop-blur-md`} />;
  }

  const primaryColor = team.primaryColor || "#1b4d24";
  const bgGradient = side === "left" 
    ? `linear-gradient(to right, ${primaryColor}40, transparent)`
    : `linear-gradient(to left, ${primaryColor}40, transparent)`;

  return (
    <div 
      className={`w-[25%] h-full z-10 flex flex-col bg-black/70 backdrop-blur-md border-${side === 'left' ? 'r' : 'l'} border-white/10`}
      style={{ backgroundImage: bgGradient }}
    >
      {/* Team Header */}
      <div className="p-8 flex flex-col items-center justify-center border-b border-white/10" style={{ borderColor: `${primaryColor}40` }}>
        <div className="w-24 h-24 rounded-full bg-white/5 p-2 mb-4 shadow-2xl flex items-center justify-center overflow-hidden">
          {team.logoUrl ? (
            <img src={team.logoUrl} alt={team.name} className="w-full h-full object-contain" />
          ) : (
            <span className="text-3xl font-arabic text-white/50">{team.nameAr[0]}</span>
          )}
        </div>
        <h2 className="text-3xl font-arabic font-bold text-white text-center leading-tight drop-shadow-lg">{team.nameAr}</h2>
        <h3 className="text-sm font-sans text-white/60 tracking-widest uppercase mt-2">{team.name}</h3>
      </div>

      {/* Players List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        {players.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-white/40">
            <span className="font-arabic text-xl mb-2">لا يوجد لاعبون</span>
            <span className="font-sans">No players</span>
          </div>
        ) : (
          POSITIONS.map(pos => {
            const posPlayers = groupedPlayers[pos];
            if (posPlayers.length === 0) return null;
            return (
              <div key={pos} className="space-y-3">
                <h4 className="text-xs font-sans font-bold text-white/30 tracking-widest uppercase border-b border-white/5 pb-1 mb-2">{pos}</h4>
                {posPlayers.map(p => (
                  <PlayerRow key={p.id} player={p} primaryColor={primaryColor} />
                ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function PlayerRow({ player, primaryColor }: { player: Player, primaryColor: string }) {
  return (
    <div className="flex items-center gap-4 bg-white/5 hover:bg-white/10 p-2 rounded-lg transition-colors border border-white/5">
      <div 
        className="w-8 h-8 rounded flex items-center justify-center font-sans font-bold text-sm text-white shadow-lg shrink-0"
        style={{ backgroundColor: primaryColor }}
      >
        {player.number || "-"}
      </div>
      <Avatar className="w-10 h-10 border border-white/20 shrink-0">
        <AvatarImage src={player.imageUrl || undefined} />
        <AvatarFallback className="bg-white/10 text-white font-arabic text-xs">
          {player.name[0]}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="text-white font-arabic font-bold truncate text-lg leading-none">{player.name}</div>
      </div>
    </div>
  );
}
