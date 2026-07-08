import { useState } from "react";
import { Link } from "wouter";
import { useListTeams, useCreateTeam, useUpdateTeam, useDeleteTeam, getListTeamsQueryKey } from "@workspace/api-client-react";
import type { Team } from "@workspace/api-client-react/src/generated/api.schemas";
import { useQueryClient } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { Plus, Trash2, Edit, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function TeamList() {
  const { data: teams = [], isLoading } = useListTeams();
  const deleteTeam = useDeleteTeam();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("هل أنت متأكد؟ / Are you sure?")) {
      deleteTeam.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTeamsQueryKey() });
          toast({ title: "Team deleted" });
        }
      });
    }
  };

  const handleEdit = (team: Team, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingTeam(team);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8 font-sans">
      <Navigation />
      
      <div className="max-w-4xl mx-auto pt-16">
        <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
          <div>
            <h1 className="text-4xl font-arabic font-bold mb-2">الفرق</h1>
            <p className="text-white/50 text-sm tracking-widest uppercase">Teams</p>
          </div>
          <CreateTeamDialog />
        </div>

        {isLoading ? (
          <div className="text-white/50 font-arabic">جاري التحميل...</div>
        ) : teams.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-xl border border-white/10">
            <p className="text-2xl font-arabic text-white/50 mb-2">لا توجد فرق</p>
            <p className="text-white/30 text-sm">No teams yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teams.map(team => (
              <Link key={team.id} href={`/teams/${team.id}`}>
                <div className="bg-white/5 border border-white/10 p-6 rounded-xl hover:bg-white/10 transition-colors flex items-center group cursor-pointer relative overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 w-2 opacity-50" 
                    style={{ backgroundColor: team.primaryColor || '#444' }} 
                  />
                  <div className="w-16 h-16 rounded-full bg-black/50 mr-6 flex items-center justify-center p-2 shrink-0 overflow-hidden">
                    {team.logoUrl ? (
                      <img src={team.logoUrl} alt={team.name} className="w-full h-full object-contain" />
                    ) : (
                      <span className="font-arabic text-xl text-white/50">{team.nameAr[0]}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-arabic font-bold truncate">{team.nameAr}</h2>
                    <p className="text-white/50 text-sm truncate">{team.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={(e) => handleEdit(team, e)}
                      className="text-white/30 hover:text-white hover:bg-white/10"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={(e) => handleDelete(team.id, e)}
                      className="text-white/30 hover:text-red-500 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white transition-colors ml-2" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {editingTeam && (
        <EditTeamDialog 
          team={editingTeam} 
          onClose={() => setEditingTeam(null)} 
        />
      )}
    </div>
  );
}

function EditTeamDialog({ team, onClose }: { team: Team, onClose: () => void }) {
  const updateTeam = useUpdateTeam();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: team.name,
    nameAr: team.nameAr,
    slug: team.slug,
    logoUrl: team.logoUrl || "",
    primaryColor: team.primaryColor || "#ffffff",
    secondaryColor: team.secondaryColor || "#000000"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateTeam.mutate({ id: team.id, data: formData }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTeamsQueryKey() });
        onClose();
        toast({ title: "Team updated" });
      }
    });
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[#111] border-white/10 text-white font-arabic">
        <DialogHeader>
          <DialogTitle className="text-2xl">تعديل الفريق</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4 font-sans">
          <div className="space-y-2">
            <Label className="font-arabic text-white/70">الاسم (عربي)</Label>
            <Input 
              required 
              value={formData.nameAr} 
              onChange={e => setFormData({...formData, nameAr: e.target.value})} 
              className="bg-black/50 border-white/10 text-right font-arabic"
              dir="rtl"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/70">Name (English)</Label>
            <Input 
              required 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              className="bg-black/50 border-white/10"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/70">Slug</Label>
            <Input 
              required 
              value={formData.slug} 
              onChange={e => setFormData({...formData, slug: e.target.value})} 
              className="bg-black/50 border-white/10"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-arabic text-white/70">رابط الشعار</Label>
            <Input 
              value={formData.logoUrl} 
              onChange={e => setFormData({...formData, logoUrl: e.target.value})} 
              className="bg-black/50 border-white/10 text-left"
              dir="ltr"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-arabic text-white/70">اللون الأساسي</Label>
              <Input 
                type="color" 
                value={formData.primaryColor} 
                onChange={e => setFormData({...formData, primaryColor: e.target.value})} 
                className="bg-black/50 border-white/10 h-10 w-full"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-arabic text-white/70">اللون الثانوي</Label>
              <Input 
                type="color" 
                value={formData.secondaryColor} 
                onChange={e => setFormData({...formData, secondaryColor: e.target.value})} 
                className="bg-black/50 border-white/10 h-10 w-full"
              />
            </div>
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

function CreateTeamDialog() {
  const [open, setOpen] = useState(false);
  const createTeam = useCreateTeam();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    nameAr: "",
    slug: "",
    primaryColor: "#ffffff",
    secondaryColor: "#000000"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTeam.mutate({ data: formData }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTeamsQueryKey() });
        setOpen(false);
        setFormData({ name: "", nameAr: "", slug: "", primaryColor: "#ffffff", secondaryColor: "#000000" });
        toast({ title: "Team created" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-arabic gap-2">
          <Plus className="w-4 h-4" /> إضافة فريق
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#111] border-white/10 text-white font-arabic">
        <DialogHeader>
          <DialogTitle className="text-2xl">إضافة فريق جديد</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4 font-sans">
          <div className="space-y-2">
            <Label className="font-arabic text-white/70">الاسم (عربي)</Label>
            <Input 
              required 
              value={formData.nameAr} 
              onChange={e => setFormData({...formData, nameAr: e.target.value})} 
              className="bg-black/50 border-white/10 text-right font-arabic"
              dir="rtl"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/70">Name (English)</Label>
            <Input 
              required 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              className="bg-black/50 border-white/10"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/70">Slug</Label>
            <Input 
              required 
              value={formData.slug} 
              onChange={e => setFormData({...formData, slug: e.target.value})} 
              className="bg-black/50 border-white/10"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-arabic text-white/70">اللون الأساسي</Label>
              <Input 
                type="color" 
                value={formData.primaryColor} 
                onChange={e => setFormData({...formData, primaryColor: e.target.value})} 
                className="bg-black/50 border-white/10 h-10 w-full"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-arabic text-white/70">اللون الثانوي</Label>
              <Input 
                type="color" 
                value={formData.secondaryColor} 
                onChange={e => setFormData({...formData, secondaryColor: e.target.value})} 
                className="bg-black/50 border-white/10 h-10 w-full"
              />
            </div>
          </div>
          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={createTeam.isPending} className="bg-primary hover:bg-primary/90 font-arabic">
              {createTeam.isPending ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
