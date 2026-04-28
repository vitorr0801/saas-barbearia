"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  inviteBarberByEmail,
  listTeamMembers,
  removeBarberById,
  type TeamMember,
} from "@/lib/team-client";
import { Mail, UserMinus, Users, Percent, Save, Loader2 } from "lucide-react";

const INVITE_EMAIL_REGEX =
  /^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/;

type TeamMemberWithCommission = TeamMember & { commission_rate?: number };

export default function Team() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  
  const [email, setEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<TeamMemberWithCommission | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [editingRates, setEditingRates] = useState<Record<string, string>>({});

  const barbeariaId = currentUser?.barbearia_id;
  const trimmedInviteEmail = email.trim();
  const isInviteEmailValid = useMemo(() => INVITE_EMAIL_REGEX.test(trimmedInviteEmail), [trimmedInviteEmail]);
  const showInviteEmailError = trimmedInviteEmail.length > 0 && !isInviteEmailValid;

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["team-members", barbeariaId],
    queryFn: async (): Promise<TeamMemberWithCommission[]> => {
      const { members, error } = await listTeamMembers();
      if (error) throw new Error(error);
      
      const ids = members.map(m => m.id);
      if (ids.length === 0) return members;

      const { data: rates } = await supabase
        .from('profiles')
        .select('id, commission_rate')
        .in('id', ids);

      return members.map(m => {
        const rateData = rates?.find(r => r.id === m.id);
        return { ...m, commission_rate: rateData?.commission_rate || 0 };
      });
    },
    enabled: !!barbeariaId,
  });

  const updateCommission = useMutation({
    mutationFn: async ({ barberId, newRate }: { barberId: string; newRate: number }) => {
      if (newRate < 0 || newRate > 100) throw new Error("Taxa inválida");

      const { data, error } = await supabase
        .from("profiles")
        .update({ commission_rate: newRate })
        .eq("id", barberId)
        .eq("barbearia_id", barbeariaId)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("Permissão negada pelo banco de dados (RLS).");
      }
    },
    onSuccess: (_, variables) => {
      const newEditingState = { ...editingRates };
      delete newEditingState[variables.barberId];
      setEditingRates(newEditingState);
      queryClient.invalidateQueries({ queryKey: ["team-members", barbeariaId] });
      toast.success("Comissão atualizada com sucesso!");
    },
    onError: (error: any) => {
      console.error(error);
      toast.error(error.message || "Erro ao atualizar a comissão.");
    }
  });

  const handleRateChange = (barberId: string, value: string) => {
    const numValue = parseInt(value);
    if (value !== "" && (isNaN(numValue) || numValue < 0 || numValue > 100)) return;
    setEditingRates(prev => ({ ...prev, [barberId]: value }));
  };

  const handleSaveRate = (barberId: string, currentRate: number) => {
    const rawValue = editingRates[barberId];
    if (!rawValue) return;
    const newRate = parseFloat(rawValue);
    if (newRate !== currentRate) {
      updateCommission.mutate({ barberId, newRate });
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    
    if (!INVITE_EMAIL_REGEX.test(trimmed)) {
      toast.error("Informe um e-mail válido.");
      return;
    }

    if (!barbeariaId) {
      toast.error("Erro: Sua barbearia não está configurada corretamente.");
      return;
    }

    setInviteLoading(true);
    const toastId = toast.loading("Registrando convite seguro...");

    try {
      // 🚀 INJEÇÃO DE SEGURANÇA (Tier-1): 
      // Registramos o convite no cofre do banco ANTES de enviar o e-mail.
      // É aqui que garantimos que o Google Auth vai achar esse usuário depois.
      const { error: dbError } = await supabase
        .from('invites')
        .insert({
          email: trimmed,
          barbearia_id: barbeariaId,
          role: 'barbeiro',
          status: 'pendente'
        });

      // Se o erro for de duplicidade, significa que já convidamos, podemos seguir.
      // Se for outro erro, barramos.
      if (dbError && dbError.code !== '23505') { 
        throw new Error("Erro ao registrar no banco de dados.");
      }

      toast.loading("Enviando e-mail de acesso...", { id: toastId });

      // Dispara a sua função original de envio de e-mail
      const { error: mailError } = await inviteBarberByEmail(trimmed);
      if (mailError) throw new Error(mailError);

      toast.success("Convite enviado com sucesso!", { id: toastId });
      setEmail("");
      await queryClient.invalidateQueries({ queryKey: ["team-members", barbeariaId] });
      
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao convidar.";
      toast.error(msg, { id: toastId });
    } finally {
      setInviteLoading(false);
    }
  };

  const confirmRemove = async () => {
    if (!removeTarget) return;
    setRemoveLoading(true);
    const toastId = toast.loading("Removendo da equipe...");
    try {
      const { error } = await removeBarberById(removeTarget.id);
      if (error) throw new Error(error);
      toast.success("Profissional removido.", { id: toastId });
      setRemoveTarget(null);
      await queryClient.invalidateQueries({ queryKey: ["team-members", barbeariaId] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao remover.";
      toast.error(msg, { id: toastId });
    } finally {
      setRemoveLoading(false);
    }
  };

  const displayName = (m: TeamMember) => (m.name && m.name.trim()) || m.email || "Sem nome";
  const statusLabel = (status: string | null | undefined) => {
    const normalized = (status || "").toLowerCase();
    if (normalized === "pendente") return { text: "Convite Pendente", variant: "pending" as const };
    return { text: "Ativo", variant: "active" as const };
  };

  return (
    <AppLayout>
      <div className="container max-w-4xl py-6 space-y-8">
        <div className="animate-in fade-in slide-in-from-left-4 duration-500">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Users className="h-5 w-5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Gestão</span>
          </div>
          <h1 className="text-xl md:text-3xl font-black uppercase italic tracking-tight text-foreground">
            Minha Equipe
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            Convide barbeiros, gerencie acessos e defina as regras de comissionamento.
          </p>
        </div>

        <section className="dash-card space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          <div className="flex items-center gap-2 text-foreground">
            <Mail className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest">Convidar barbeiro</h2>
          </div>
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="invite-email" className="text-[10px] uppercase font-bold text-muted-foreground">E-mail do profissional</Label>
              <Input id="invite-email" type="email" placeholder="nome@email.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={inviteLoading} className="h-11 rounded-xl bg-secondary/50" autoComplete="off" aria-invalid={showInviteEmailError} />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={inviteLoading || !isInviteEmailValid} className="h-11 w-full sm:w-auto rounded-xl bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-widest shadow-none hover:bg-primary/90 px-6">
                {inviteLoading ? "Processando..." : "Convidar barbeiro"}
              </Button>
            </div>
          </form>
        </section>

        {/* --- O restante da sua lista de membros (inalterada) --- */}
        <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <h2 className="text-sm font-black uppercase tracking-widest text-foreground">
            Equipe ({members.length})
          </h2>

          {isLoading ? (
            <div className="dash-card py-10 text-center flex flex-col items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
              Sincronizando dados...
            </div>
          ) : members.length === 0 ? (
            <div className="dash-card py-10 text-center text-sm text-muted-foreground">Nenhum profissional vinculado ainda.</div>
          ) : (
            <ul className="grid gap-3">
              {members.map((m) => {
                const isOwner = Boolean(m.is_admin);
                const isSelf = m.id === currentUser?.id;
                const canRemove = !isOwner && !isSelf;
                
                const currentCommission = m.commission_rate ?? 0;
                const isEditing = editingRates[m.id] !== undefined;
                const displayRate = isEditing ? editingRates[m.id] : currentCommission.toString();
                const hasChanges = isEditing && parseFloat(editingRates[m.id]) !== currentCommission;

                return (
                  <li key={m.id} className="dash-card flex flex-col xl:flex-row xl:items-center justify-between gap-6 hover:border-primary/20 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-foreground text-lg tracking-tight">{displayName(m)}</p>
                        {isOwner && <Badge variant="outline" className="text-[9px] border-primary/30 text-primary">Dono</Badge>}
                        {isSelf && <Badge variant="secondary" className="text-[9px]">Você</Badge>}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-muted-foreground mt-1">
                        {m.email && <span>{m.email}</span>}
                        {m.phone && <span className="hidden sm:inline">•</span>}
                        {m.phone && <span>{m.phone.replace(/\D/g, "") ? m.phone : "Sem telefone"}</span>}
                      </div>
                      <div className="mt-3">
                        <Badge className={`border text-[9px] font-black uppercase tracking-widest ${statusLabel(m.status).variant === "pending" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"}`}>
                          {statusLabel(m.status).text}
                        </Badge>
                      </div>
                    </div>

                    {!isOwner && (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 border-t xl:border-t-0 xl:border-l border-border/50 pt-4 xl:pt-0 xl:pl-6">
                        <div className="flex items-center gap-2 bg-background/50 p-1.5 rounded-2xl border border-border/50">
                          <div className="flex flex-col px-2">
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Comissão</span>
                            <div className="relative flex items-center">
                              <Percent className="absolute left-2.5 h-3 w-3 text-muted-foreground" />
                              <Input type="number" min="0" max="100" value={displayRate} onChange={(e) => handleRateChange(m.id, e.target.value)} className="h-8 w-24 pl-7 pr-3 rounded-xl font-bold tabular-nums border-primary/20 focus-visible:ring-primary/30 text-xs" placeholder="0" />
                            </div>
                          </div>
                          <Button size="icon" disabled={!hasChanges || updateCommission.isPending} onClick={() => handleSaveRate(m.id, currentCommission)} className={`h-8 w-8 rounded-xl transition-all ${hasChanges ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-muted text-muted-foreground"}`}>
                            {updateCommission.isPending && updateCommission.variables?.barberId === m.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                          </Button>
                        </div>

                        {canRemove && (
                          <Button type="button" variant="outline" size="sm" className="h-12 xl:h-10 rounded-xl border-destructive/20 text-destructive hover:bg-destructive/10 shrink-0 w-full sm:w-auto" onClick={() => setRemoveTarget(m as TeamMemberWithCommission)}>
                            <UserMinus className="h-4 w-4 mr-2" /> Remover
                          </Button>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <AlertDialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <AlertDialogContent className="rounded-2xl border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover da equipe?</AlertDialogTitle>
            <AlertDialogDescription className="text-left leading-relaxed">
              Tem certeza que deseja remover <strong>{removeTarget ? displayName(removeTarget) : ""}</strong> da equipe? Ele perderá o acesso à agenda.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="rounded-xl font-bold uppercase tracking-widest text-[10px]" disabled={removeLoading}>Cancelar</AlertDialogCancel>
            <Button type="button" variant="destructive" className="rounded-xl font-bold uppercase tracking-widest text-[10px]" disabled={removeLoading} onClick={() => void confirmRemove()}>
              {removeLoading ? "Removendo..." : "Remover Profissional"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}