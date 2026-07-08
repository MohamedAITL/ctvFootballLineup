export type Team = {
  id: number;
  name: string;
  nameAr: string;
  slug: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  coachName?: string | null;
  coachImageUrl?: string | null;
};

export type Player = {
  id: number;
  teamId: number;
  name: string;
  position: string;
  number?: number | null;
  imageUrl?: string | null;
};

export type TeamInput = Omit<Team, "id">;
export type PlayerInput = Omit<Player, "id">;

const TEAMS_KEY = "lineup_teams";
const PLAYERS_KEY = "lineup_players";
const STORE_EVENT = "lineup_store_change";
const SEED_VERSION_KEY = "lineup_seed_v";
const SEED_VERSION = "2";

const SEED_TEAMS: Team[] = [
  {
    id: 3,
    name: "Morocco",
    nameAr: "المغرب",
    slug: "morocco",
    logoUrl:
      "https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Competitors:default1.png/v3/Competitors/5093",
    primaryColor: "#e10909",
    secondaryColor: "#c7c7c7",
    coachName: "محمد وهبي",
    coachImageUrl:
      "https://imagecache.365scores.com/image/upload/f_png,w_80,h_80,c_limit,q_auto:eco,dpr_2,d_Athletes:203213.png,r_max,c_thumb,g_face,z_0.65/Athletes/NationalTeam/203213",
  },
  {
    id: 6,
    name: "France",
    nameAr: "فرنسا",
    slug: "france",
    logoUrl:
      "https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Competitors:default1.png/v3/Competitors/5061",
    primaryColor: "#0b239d",
    secondaryColor: "#000000",
    coachName: null,
    coachImageUrl: null,
  },
];

const SEED_PLAYERS: Player[] = [
  {
    id: 45,
    teamId: 3,
    name: "ياسين بونو",
    position: "GK",
    number: 1,
    imageUrl:
      "https://imagecache.365scores.com/image/upload/f_png,w_80,h_80,c_limit,q_auto:eco,dpr_2,d_Athletes:5755.png,r_max,c_thumb,g_face,z_0.65/Athletes/NationalTeam/5755",
  },
  {
    id: 48,
    teamId: 3,
    name: "أشرف حكيمي",
    position: "DEF",
    number: 2,
    imageUrl:
      "https://imagecache.365scores.com/image/upload/f_png,w_80,h_80,c_limit,q_auto:eco,dpr_2,d_Athletes:47349.png,r_max,c_thumb,g_face,z_0.65/Athletes/NationalTeam/47349",
  },
  {
    id: 49,
    teamId: 3,
    name: "نصير مزراوي",
    position: "DEF",
    number: 3,
    imageUrl:
      "https://imagecache.365scores.com/image/upload/f_png,w_80,h_80,c_limit,q_auto:eco,dpr_2,d_Athletes:55208.png,r_max,c_thumb,g_face,z_0.65/Athletes/NationalTeam/55208",
  },
  {
    id: 50,
    teamId: 3,
    name: "مروان سعدان",
    position: "DEF",
    number: 5,
    imageUrl:
      "https://imagecache.365scores.com/image/upload/f_png,w_80,h_80,c_limit,q_auto:eco,dpr_2,d_Athletes:39716.png,r_max,c_thumb,g_face,z_0.65/Athletes/NationalTeam/39716",
  },
  {
    id: 46,
    teamId: 3,
    name: "منير المحمدي",
    position: "GK",
    number: 12,
    imageUrl:
      "https://imagecache.365scores.com/image/upload/f_png,w_80,h_80,c_limit,q_auto:eco,dpr_2,d_Athletes:39714.png,r_max,c_thumb,g_face,z_0.65/Athletes/NationalTeam/39714",
  },
  {
    id: 51,
    teamId: 3,
    name: "زكرياء الوحدي",
    position: "DEF",
    number: 13,
    imageUrl:
      "https://imagecache.365scores.com/image/upload/f_png,w_80,h_80,c_limit,q_auto:eco,dpr_2,d_Athletes:110885.png,r_max,c_thumb,g_face,z_0.65/Athletes/NationalTeam/110885",
  },
  {
    id: 47,
    teamId: 3,
    name: "أحمد رضا التكناوتي",
    position: "GK",
    number: 22,
    imageUrl:
      "https://imagecache.365scores.com/image/upload/f_png,w_80,h_80,c_limit,q_auto:eco,dpr_2,d_Athletes:52814.png,r_max,c_thumb,g_face,z_0.65/Athletes/NationalTeam/52814",
  },
];

function seed() {
  if (localStorage.getItem(SEED_VERSION_KEY) !== SEED_VERSION) {
    const existing = parse<Team>(TEAMS_KEY);
    const existingPlayers = parse<Player>(PLAYERS_KEY);
    const userTeams = existing.filter((t) => !SEED_TEAMS.find((s) => s.id === t.id));
    const userPlayers = existingPlayers.filter((p) => !SEED_PLAYERS.find((s) => s.id === p.id));
    localStorage.setItem(TEAMS_KEY, JSON.stringify([...SEED_TEAMS, ...userTeams]));
    localStorage.setItem(PLAYERS_KEY, JSON.stringify([...SEED_PLAYERS, ...userPlayers]));
    localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
  }
}

function notify() {
  window.dispatchEvent(new Event(STORE_EVENT));
}

export function onStoreChange(cb: () => void): () => void {
  window.addEventListener(STORE_EVENT, cb);
  return () => window.removeEventListener(STORE_EVENT, cb);
}

function parse<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "[]") as T[];
  } catch {
    return [];
  }
}

function nextId(items: { id: number }[]): number {
  return (items.length ? Math.max(...items.map((x) => x.id)) : 0) + 1;
}

export function getTeams(): Team[] {
  seed();
  return parse<Team>(TEAMS_KEY);
}

export function getTeam(id: number): Team | undefined {
  return getTeams().find((t) => t.id === id);
}

export function createTeam(data: TeamInput): Team {
  const teams = getTeams();
  const team: Team = { id: nextId(teams), ...data };
  localStorage.setItem(TEAMS_KEY, JSON.stringify([...teams, team]));
  notify();
  return team;
}

export function updateTeamById(id: number, data: TeamInput): Team {
  const team: Team = { id, ...data };
  localStorage.setItem(
    TEAMS_KEY,
    JSON.stringify(getTeams().map((t) => (t.id === id ? team : t))),
  );
  notify();
  return team;
}

export function deleteTeamById(id: number): void {
  localStorage.setItem(
    TEAMS_KEY,
    JSON.stringify(getTeams().filter((t) => t.id !== id)),
  );
  localStorage.setItem(
    PLAYERS_KEY,
    JSON.stringify(getPlayers().filter((p) => p.teamId !== id)),
  );
  notify();
}

export function getPlayers(teamId?: number): Player[] {
  seed();
  const all = parse<Player>(PLAYERS_KEY);
  return teamId != null ? all.filter((p) => p.teamId === teamId) : all;
}

export function createPlayer(data: PlayerInput): Player {
  const all = getPlayers();
  const player: Player = { id: nextId(all), ...data };
  localStorage.setItem(PLAYERS_KEY, JSON.stringify([...all, player]));
  notify();
  return player;
}

export function updatePlayerById(id: number, data: PlayerInput): Player {
  const player: Player = { id, ...data };
  localStorage.setItem(
    PLAYERS_KEY,
    JSON.stringify(getPlayers().map((p) => (p.id === id ? player : p))),
  );
  notify();
  return player;
}

export function deletePlayerById(id: number): void {
  localStorage.setItem(
    PLAYERS_KEY,
    JSON.stringify(getPlayers().filter((p) => p.id !== id)),
  );
  notify();
}
