"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { InviteForm } from "@/components/team/InviteForm";
import { MemberCard, type TeamMemberExtended } from "@/components/team/MemberCard";
import { BarberServicesModal } from "@/components/team/BarberServicesModal";
import { BarberWorkHoursModal } from "@/components/team/BarberWorkHoursModal";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { listTeamMembers, inviteBarberByEmail, removeBarberById } from "@/lib/team-client";
import { Users, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Team() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const barbeariaId = currentUser?.barbearia_id;

  const [servicesModal, setServicesModal] = useState<{ id: string; name: string } | null>(null);
  const [hoursModal, setHoursModal] = useState<{ id: string; name: string } | null>(null);
  const [removeTarget, setRemoveTarget] = useState<TeamMemberExtended | null>(null);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["team-members", barbeariaId],
    queryFn: async (): Promise<TeamMemberExtended[]> => {
      const { members: baseMembers, error } = await listTeamMembers();
      if (error) throw new Error(error);
      
      const safeMembers = baseMembers || []; 
      if (safeMembers.length === 0) return [];

      const ids = safeMembers.map(m => m.id).filter(Boolean);

      let profilesData: any[] = [];
      if (ids.length > 0) {
        const { data: pData } = await supabase
          .from('profiles')
          .select('id, commission_rate, job_title, provides_services')
          .in('id', ids);
        profilesData = pData || [];
      }

      const { data: invitesData } = await supabase
        .from('invites')
        .select('email, job_title, provides_services')
        .eq('barbearia_id', barbeariaId)
        .eq('status', 'pendente');
        
      const invitesList = invitesData || [];

      return safeMembers.map((m): TeamMemberExtended => {
        const p = profilesData.find((row) => row.id === m.id);
        const inv = invitesList.find((row) => row.email === m.email);
        const isPending = m.status === 'pendente';

        return {
          ...m,
          id: m.id || m.email, 
          commission_rate: Number(p?.commission_rate || 0),
          job_title: String(isPending ? (inv?.job_title || 'Barbeiro') : (p?.job_title || 'Barbeiro')),
          provides_services: Boolean(isPending ? (inv?.provides_services ?? true) : (p?.provides_services ?? true))
        } as TeamMemberExtended;
      });
    },
    enabled: !!barbeariaId,
  });

  const inviteMutation = useMutation({
    mutationFn: async ({ email, job, providesServices }: any) => {
      const { error: mailError } = await inviteBarberByEmail(email, job, providesServices);
      if (mailError) throw new Error(mailError);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast.success("Convite enviado com sucesso!");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao enviar convite")
  });

  const toggleAgendaMutation = useMutation({
    mutationFn: async ({ id, current }: { id: string, current: boolean }) => {
      const { error } = await supabase.from('profiles').update({ provides_services: !current }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast.success("Status da agenda atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar agenda.")
  });

  const updateCommissionMutation = useMutation({
    mutationFn: async ({ id, rate }: { id: string, rate: number }) => {
      if (rate < 0 || rate > 100) throw new Error("Taxa inválida");
      const { error } = await supabase.from('profiles').update({ commission_rate: rate }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast.success("Comissão atualizada!");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao atualizar a comissão.")
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await removeBarberById(id);
      if (error) throw new Error(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast.success("Colaborador removido.");
      setRemoveTarget(null);
    },
    onError: (err: any) => toast.error(err.message || "Falha ao remover.")
  });

  return (
    <AppLayout>
      <div className="container max-w-5xl py-6 space-y-8">
        <header className="space-y-1 animate-in fade-in slide-in-from-left-4 duration-500">
          <div className="flex items-center gap-2 text-primary">
            <Users className="h-5 w-5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Gestão Avançada</span>
          </div>
          <h1 className="text-3xl font-black uppercase italic tracking-tight text-foreground">Minha Equipe</h1>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            Gerencie cargos, agendas e permissões da sua barbearia.
          </p>
        </header>

        <InviteForm 
          onInvite={(email, job, provides) => inviteMutation.mutateAsync({ email, job, providesServices: provides })}
          isLoading={inviteMutation.isPending}
        />

        <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Colaboradores ({members.length})</h2>
          {isLoading ? (
            <div className="py-20 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-primary/50" /></div>
          ) : members.length === 0 ? (
            <div className="dash-card py-10 text-center text-sm text-muted-foreground">Nenhum colaborador vinculado ainda.</div>
          ) : (
            <ul className="grid gap-3">
              {members.map(m => (
                <MemberCard 
                  key={m.id} 
                  member={m} 
                  isSelf={m.id === currentUser?.id}
                  onToggleAgenda={(id, current) => toggleAgendaMutation.mutate({ id, current })}
                  onUpdateCommission={(id, rate) => updateCommissionMutation.mutate({ id, rate })}
                  onRemove={setRemoveTarget}
                  onOpenHours={(id, name) => setHoursModal({ id, name })}
                  onOpenServices={(id, name) => setServicesModal({ id, name })}
                />
              ))}
            </ul>
          )}
        </section>
      </div>

      <BarberServicesModal 
        open={!!servicesModal} 
        onOpenChange={() => setServicesModal(null)}
        barberId={servicesModal?.id || null}
        barberName={servicesModal?.name || ""}
        barbeariaId={barbeariaId || undefined}
      />

      <BarberWorkHoursModal 
        open={!!hoursModal} 
        onOpenChange={() => setHoursModal(null)}
        barberId={hoursModal?.id || null}
        barberName={hoursModal?.name || ""}
      />

      <AlertDialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <AlertDialogContent className="rounded-2xl border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover da equipe?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{removeTarget?.name || removeTarget?.email}</strong>? O acesso ao sistema será revogado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive hover:bg-destructive/90" 
              disabled={removeMutation.isPending}
              onClick={() => removeTarget && removeMutation.mutate(removeTarget.id)}
            >
              {removeMutation.isPending ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}