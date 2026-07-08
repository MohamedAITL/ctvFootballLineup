import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { 
  useGetTeam, 
  useListTeamPlayers, 
  useCreatePlayer, 
  useUpdatePlayer,
  useUpdateTeam,
  useDeletePlayer, 
  getGetTeamQueryKey,
  getListTeamsQueryKey,
  getListTeamPlayersQueryKey 
} from "@workspace/api-client-react";
import type { Player } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { Plus, Trash2, Edit, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function TeamDetail() {
  const { id } = useParams();
  const teamId = Number(id);
  const { data: team, isLoading: isLoadingTeam } = useGetTeam(teamId, { query: { enabled: !!teamId, queryKey: getGetTeamQueryKey(teamId) } });
  const { data: players = [], isLoading: isLoadingPlayers } = useListTeamPlayers(teamId, { query: { enabled: !!teamId, queryKey: getListTeamPlayersQueryKey(teamId) } });
  
  const deletePlayer = useDeletePlayer();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  const handleDeletePlayer = (playerId: number) => {
    if (confirm("هل أنت متأكد؟ / Are you sure?")) {
      deletePlayer.mutate({ id: playerId }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTeamPlayersQueryKey(teamId) });
          toast({ title: "Player deleted" });
        }
      });
    }
  };

  if (isLoadingTeam) {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white font-arabic">جاري التحميل...</div>;
  }

  if (!team) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8 font-sans">
      <div className="fixed top-4 right-4 z-50"><Navigation /></div>
      
      <div className="max-w-4xl mx-auto pt-16">
        <Link href="/teams">
          <Button variant="ghost" className="mb-6 text-white/50 hover:text-white hover:bg-white/10 -ml-4 gap-2 font-arabic">
            <ArrowLeft className="w-4 h-4" /> عودة
          </Button>
        </Link>

        <div className="flex items-center gap-8 mb-12 p-8 bg-white/5 rounded-2xl border border-white/10" style={{ borderTopColor: team.primaryColor || undefined, borderTopWidth: '4px' }}>
          <div className="w-32 h-32 rounded-full bg-black/50 flex items-center justify-center p-4 overflow-hidden">
            {team.logoUrl ? (
              <img src={team.logoUrl} alt={team.name} className="w-full h-full object-contain" />
            ) : (
              <span className="font-arabic text-4xl text-white/50">{team.nameAr[0]}</span>
            )}
          </div>
          <div>
            <h1 className="text-5xl font-arabic font-bold mb-2">{team.nameAr}</h1>
            <p className="text-white/50 text-xl tracking-widest uppercase">{team.name}</p>
          </div>
        </div>

        {/* Coach section */}
        <div className="mb-8 p-5 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-full shrink-0 flex items-center justify-center overflow-hidden border-2"
              style={{ borderColor: team.primaryColor || "#fff3", background: `${team.primaryColor || "#fff"}22` }}
            >
              {team.coachImageUrl ? (
                <img src={team.coachImageUrl} alt={team.coachName || "Coach"} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white/40 text-xl font-bold">
                  {team.coachName ? team.coachName.charAt(0) : "؟"}
                </span>
              )}
            </div>
            <div>
              <p className="text-white/40 text-[10px] tracking-widest uppercase font-bold mb-0.5">المدرب / Coach</p>
              <p className="text-white font-arabic font-bold text-lg">
                {team.coachName || <span className="text-white/30 text-sm">لم يُضف بعد</span>}
              </p>
            </div>
          </div>
          <EditCoachDialog team={team} />
        </div>

        <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-2xl font-arabic font-bold">اللاعبون</h2>
            <p className="text-white/50 text-xs tracking-widest uppercase mt-1">Squad</p>
          </div>
          <CreatePlayerDialog teamId={teamId} />
        </div>

        {isLoadingPlayers ? (
          <div className="text-white/50 font-arabic">جاري التحميل...</div>
        ) : players.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-xl border border-white/10">
            <p className="text-2xl font-arabic text-white/50 mb-2">لا يوجد لاعبون</p>
            <p className="text-white/30 text-sm">No players</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {players.map(player => (
              <div key={player.id} className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center group">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center font-bold mr-4 shrink-0 shadow-lg text-white"
                  style={{ backgroundColor: team.primaryColor || '#444' }}
                >
                  {player.number || "-"}
                </div>
                <Avatar className="w-12 h-12 border border-white/10 mr-4">
                  <AvatarImage src={player.imageUrl || undefined} />
                  <AvatarFallback className="bg-black/50 text-white font-arabic">{player.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-arabic font-bold text-lg truncate">{player.name}</div>
                  <div className="text-white/50 text-xs font-bold tracking-widest uppercase">{player.position}</div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 flex items-center transition-all gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setEditingPlayer(player)}
                    className="text-white/30 hover:text-white hover:bg-white/10"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDeletePlayer(player.id)}
                    className="text-white/30 hover:text-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {editingPlayer && (
        <EditPlayerDialog 
          teamId={teamId} 
          player={editingPlayer} 
          onClose={() => setEditingPlayer(null)} 
        />
      )}
    </div>
  );
}

function EditPlayerDialog({ teamId, player, onClose }: { teamId: number, player: Player, onClose: () => void }) {
  const updatePlayer = useUpdatePlayer();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: player.name,
    position: player.position,
    number: player.number?.toString() || "",
    imageUrl: player.imageUrl || ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePlayer.mutate({ 
      id: player.id,
      data: {
        name: formData.name,
        teamId,
        position: formData.position,
        number: formData.number ? Number(formData.number) : null,
        imageUrl: formData.imageUrl || null
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTeamPlayersQueryKey(teamId) });
        onClose();
        toast({ title: "Player updated" });
      }
    });
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[#111] border-white/10 text-white font-arabic">
        <DialogHeader>
          <DialogTitle className="text-2xl">تعديل اللاعب</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4 font-sans">
          <div className="space-y-2">
            <Label className="font-arabic text-white/70">اسم اللاعب (عربي)</Label>
            <Input 
              required 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              className="bg-black/50 border-white/10 text-right font-arabic"
              dir="rtl"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-arabic text-white/70">المركز</Label>
              <Select value={formData.position} onValueChange={v => setFormData({...formData, position: v})}>
                <SelectTrigger className="bg-black/50 border-white/10 font-sans">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#111] border-white/10 text-white font-sans">
                  <SelectItem value="GK">GK (حارس)</SelectItem>
                  <SelectItem value="DEF">DEF (دفاع)</SelectItem>
                  <SelectItem value="MID">MID (وسط)</SelectItem>
                  <SelectItem value="FWD">FWD (هجوم)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-arabic text-white/70">رقم القميص</Label>
              <Input 
                type="number"
                value={formData.number} 
                onChange={e => setFormData({...formData, number: e.target.value})} 
                className="bg-black/50 border-white/10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-arabic text-white/70">رابط الصورة (اختياري)</Label>
            <Input 
              value={formData.imageUrl} 
              onChange={e => setFormData({...formData, imageUrl: e.target.value})} 
              className="bg-black/50 border-white/10 text-left"
              dir="ltr"
            />
          </div>
          
          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={updatePlayer.isPending} className="bg-primary hover:bg-primary/90 font-arabic">
              {updatePlayer.isPending ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditCoachDialog({ team }: { team: { id: number; name: string; nameAr: string; slug: string; logoUrl?: string | null; primaryColor?: string | null; secondaryColor?: string | null; coachName?: string | null; coachImageUrl?: string | null } }) {
  const [open, setOpen] = useState(false);
  const updateTeam = useUpdateTeam();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    coachName: team.coachName || "",
    coachImageUrl: team.coachImageUrl || "",
  });

  // Sync form data from latest team prop whenever dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        coachName: team.coachName || "",
        coachImageUrl: team.coachImageUrl || "",
      });
    }
  }, [open, team.coachName, team.coachImageUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateTeam.mutate({
      id: team.id,
      data: {
        name: team.name,
        nameAr: team.nameAr,
        slug: team.slug,
        logoUrl: team.logoUrl ?? null,
        primaryColor: team.primaryColor ?? null,
        secondaryColor: team.secondaryColor ?? null,
        coachName: formData.coachName || null,
        coachImageUrl: formData.coachImageUrl || null,
      },
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetTeamQueryKey(team.id) });
        queryClient.invalidateQueries({ queryKey: getListTeamsQueryKey() });
        setOpen(false);
        toast({ title: "تم حفظ المدرب" });
      },
      onError: () => {
        toast({ title: "فشل الحفظ", description: "حدث خطأ، يرجى المحاولة مجدداً", variant: "destructive" });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-white/15 text-white hover:bg-white/10 font-arabic gap-2">
          <Edit className="w-4 h-4" /> تعديل المدرب
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#111] border-white/10 text-white font-arabic">
        <DialogHeader>
          <DialogTitle className="text-2xl">بيانات المدرب</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4 font-sans">
          <div className="space-y-2">
            <Label className="font-arabic text-white/70">اسم المدرب</Label>
            <Input
              value={formData.coachName}
              onChange={e => setFormData({ ...formData, coachName: e.target.value })}
              className="bg-black/50 border-white/10 text-right font-arabic"
              dir="rtl"
              placeholder="مثال: وليد الركراكي"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-arabic text-white/70">رابط صورة المدرب</Label>
            <Input
              value={formData.coachImageUrl}
              onChange={e => setFormData({ ...formData, coachImageUrl: e.target.value })}
              className="bg-black/50 border-white/10 text-left"
              dir="ltr"
              placeholder="https://..."
            />
            {formData.coachImageUrl && (
              <div className="flex justify-center pt-1">
                <img src={formData.coachImageUrl} alt="preview" className="w-16 h-16 rounded-full object-cover border-2 border-white/10" />
              </div>
            )}
          </div>
          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={updateTeam.isPending} className="bg-primary hover:bg-primary/90 font-arabic">
              {updateTeam.isPending ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CreatePlayerDialog({ teamId }: { teamId: number }) {
  const [open, setOpen] = useState(false);
  const createPlayer = useCreatePlayer();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    position: "MID",
    number: "",
    imageUrl: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPlayer.mutate({ 
      data: {
        name: formData.name,
        teamId,
        position: formData.position,
        number: formData.number ? Number(formData.number) : null,
        imageUrl: formData.imageUrl || null
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTeamPlayersQueryKey(teamId) });
        setOpen(false);
        setFormData({ name: "", position: "MID", number: "", imageUrl: "" });
        toast({ title: "Player added" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-arabic gap-2">
          <Plus className="w-4 h-4" /> إضافة لاعب
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#111] border-white/10 text-white font-arabic">
        <DialogHeader>
          <DialogTitle className="text-2xl">إضافة لاعب جديد</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4 font-sans">
          <div className="space-y-2">
            <Label className="font-arabic text-white/70">اسم اللاعب (عربي)</Label>
            <Input 
              required 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              className="bg-black/50 border-white/10 text-right font-arabic"
              dir="rtl"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-arabic text-white/70">المركز</Label>
              <Select value={formData.position} onValueChange={v => setFormData({...formData, position: v})}>
                <SelectTrigger className="bg-black/50 border-white/10 font-sans">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#111] border-white/10 text-white font-sans">
                  <SelectItem value="GK">GK (حارس)</SelectItem>
                  <SelectItem value="DEF">DEF (دفاع)</SelectItem>
                  <SelectItem value="MID">MID (وسط)</SelectItem>
                  <SelectItem value="FWD">FWD (هجوم)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-arabic text-white/70">رقم القميص</Label>
              <Input 
                type="number"
                value={formData.number} 
                onChange={e => setFormData({...formData, number: e.target.value})} 
                className="bg-black/50 border-white/10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-arabic text-white/70">رابط الصورة (اختياري)</Label>
            <Input 
              value={formData.imageUrl} 
              onChange={e => setFormData({...formData, imageUrl: e.target.value})} 
              className="bg-black/50 border-white/10 text-left"
              dir="ltr"
            />
          </div>
          
          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={createPlayer.isPending} className="bg-primary hover:bg-primary/90 font-arabic">
              {createPlayer.isPending ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
