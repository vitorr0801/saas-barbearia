"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
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
import { Users, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Team() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const barbeariaId = currentUser?.barbearia_id;

  // Modais de Controle
  const [servicesModal, setServicesModal] = useState<{ id: string; name: string } | null>(null);
  const [hoursModal, setHoursModal] = useState<{ id: string; name: string } | null>(null);
  
  // Modais de Alerta (Ações Destrutivas ou Críticas)
  const [removeTarget, setRemoveTarget] = useState<TeamMemberExtended | null>(null);
  const [agendaToggleTarget, setAgendaToggleTarget] = useState<{ id: string; name: string; current: boolean } | null>(null);

  // 🚀 TIER-1: Query blindada e com cache inteligente
  const { data: members = [], isLoading } = useQuery({
    queryKey: ["team-members", barbeariaId],
    queryFn: async (): Promise<TeamMemberExtended[]> => {
      if (!barbeariaId) throw new Error("ID da barbearia não encontrado.");

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
    staleTime: 1000 * 60 * 5, // Cache de 5 minutos para evitar requisições repetidas ao trocar de abas
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

  if (!barbeariaId) {
    return (
      <div className="container max-w-7xl mx-auto py-12 flex flex-col items-center justify-center text-center">
        <ShieldAlert className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-black uppercase tracking-widest text-foreground">Acesso Restrito</h2>
        <p className="text-muted-foreground mt-2 text-sm">Você precisa estar vinculado a uma barbearia para gerenciar a equipe.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto space-y-8 overflow-x-hidden">
      
      {/* 🏁 EXECUTIVE HEADER */}
      <header className="flex flex-col gap-6 animate-in fade-in duration-500">
        <div>
          <div className="flex items-center gap-2 text-primary mb-2">
            <Users className="h-5 w-5" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Gestão Avançada</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-foreground">
            Minha <span className="text-primary">Equipe</span>
          </h1>
          <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">
            Gerencie cargos, agendas e permissões da sua barbearia.
          </p>
        </div>
      </header>

      <div className="max-w-5xl space-y-8">
        <InviteForm 
          onInvite={(email, job, provides) => inviteMutation.mutateAsync({ email, job, providesServices: provides })}
          isLoading={inviteMutation.isPending}
        />

        <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Colaboradores ({members.length})</h2>
          {isLoading ? (
            <div className="py-20 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-primary/50" /></div>
          ) : members.length === 0 ? (
            <div className="dash-card py-10 text-center text-sm font-medium text-muted-foreground border border-dashed border-border/50 rounded-3xl bg-secondary/20">
              Nenhum colaborador vinculado ainda. Use o formulário acima para convidar o seu primeiro profissional.
            </div>
          ) : (
            <ul className="grid gap-3">
              {members.map(m => (
                <MemberCard 
                  key={m.id} 
                  member={m} 
                  isSelf={m.id === currentUser?.id}
                  onToggleAgenda={(id, current) => setAgendaToggleTarget({ id, name: m.name || m.email, current })}
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

      {/* MODAIS DE GESTÃO DO BARBEIRO */}
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
        barbeariaId={barbeariaId || undefined}
/>

      {/* MODAL DE REMOÇÃO DE MEMBRO */}
      <AlertDialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <AlertDialogContent className="rounded-2xl border-border bg-[#0a0c12] shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black italic uppercase tracking-tight text-xl text-foreground">Remover da equipe?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Tem certeza que deseja remover <strong className="text-foreground">{removeTarget?.name || removeTarget?.email}</strong>? O acesso ao sistema será revogado imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeMutation.isPending} className="rounded-xl font-bold uppercase tracking-widest text-[10px] border-border/50">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive hover:bg-destructive/90 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-destructive/20" 
              disabled={removeMutation.isPending}
              onClick={() => removeTarget && removeMutation.mutate(removeTarget.id)}
            >
              {removeMutation.isPending ? "Removendo..." : "Sim, Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* MODAL DE ALTERAÇÃO DA AGENDA */}
      <AlertDialog open={!!agendaToggleTarget} onOpenChange={(open) => !open && setAgendaToggleTarget(null)}>
        <AlertDialogContent className="rounded-2xl border-border bg-[#0a0c12] shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black italic uppercase tracking-tight text-xl text-foreground">
              {agendaToggleTarget?.current ? "Pausar" : "Reativar"} agenda de {agendaToggleTarget?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {agendaToggleTarget?.current 
                ? "Ao desativar, este profissional ficará oculto no aplicativo e os clientes não poderão agendar novos horários com ele. Tem certeza que deseja continuar?"
                : "Ao reativar, este profissional voltará a ficar visível no aplicativo e os clientes poderão agendar novos horários normalmente. Tem certeza que deseja continuar?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={toggleAgendaMutation.isPending} className="rounded-xl font-bold uppercase tracking-widest text-[10px] border-border/50">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              className={cn(
                "rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-lg text-white", 
                agendaToggleTarget?.current ? "bg-amber-600 hover:bg-amber-500 shadow-amber-900/20" : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20"
              )} 
              disabled={toggleAgendaMutation.isPending}
              onClick={() => {
                if (agendaToggleTarget) {
                  toggleAgendaMutation.mutate({ id: agendaToggleTarget.id, current: agendaToggleTarget.current });
                  setAgendaToggleTarget(null);
                }
              }}
            >
              {agendaToggleTarget?.current ? "Sim, pausar agenda" : "Sim, reativar agenda"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}