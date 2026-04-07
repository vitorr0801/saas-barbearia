"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Mail, UserMinus, Users } from "lucide-react";

export default function Team() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  const barbeariaId = currentUser?.barbearia_id;

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["team-members", barbeariaId],
    queryFn: async () => {
      const { members, error } = await listTeamMembers();
      if (error) throw new Error(error);
      return members;
    },
    enabled: !!barbeariaId,
  });

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Informe um e-mail válido.");
      return;
    }
    setInviteLoading(true);
    const toastId = toast.loading("Enviando convite...");
    try {
      const { error } = await inviteBarberByEmail(trimmed);
      if (error) throw new Error(error);
      toast.success("Convite enviado! O profissional receberá um e-mail para definir a senha.", {
        id: toastId,
      });
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
      toast.success("Profissional removido da equipe.", { id: toastId });
      setRemoveTarget(null);
      await queryClient.invalidateQueries({ queryKey: ["team-members", barbeariaId] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao remover.";
      toast.error(msg, { id: toastId });
    } finally {
      setRemoveLoading(false);
    }
  };

  const displayName = (m: TeamMember) =>
    (m.name && m.name.trim()) || m.email || "Sem nome";

  const statusLabel = (status: string | null | undefined) => {
    const normalized = (status || "").toLowerCase();
    if (normalized === "pendente") return { text: "Aguardando...", variant: "pending" as const };
    return { text: "Ativo", variant: "active" as const };
  };

  return (
    <AppLayout>
      <div className="container max-w-3xl py-6 space-y-8">
        <div>
          <div className="flex items-center gap-2 text-primary mb-2">
            <Users className="h-5 w-5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Gestão</span>
          </div>
          <h1 className="text-xl font-black uppercase italic tracking-tight text-foreground">
            Minha Equipe
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            Convide barbeiros por e-mail e gerencie o acesso à agenda da sua barbearia.
          </p>
        </div>

        <section className="dash-card space-y-4">
          <div className="flex items-center gap-2 text-foreground">
            <Mail className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest">Convidar barbeiro</h2>
          </div>
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="invite-email" className="text-[10px] uppercase font-bold text-muted-foreground">
                E-mail do profissional
              </Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="nome@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={inviteLoading}
                className="h-11 rounded-xl bg-secondary/50"
                autoComplete="off"
              />
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                disabled={inviteLoading || !email.trim()}
                className="h-11 w-full sm:w-auto rounded-xl bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-widest shadow-none hover:bg-primary/90 px-6"
              >
                {inviteLoading ? "Enviando..." : "Convidar barbeiro"}
              </Button>
            </div>
          </form>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            O convidado receberá um link para criar a senha. Após aceitar, já aparecerá nesta lista com
            acesso à agenda da sua unidade.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-black uppercase tracking-widest text-foreground">
            Equipe ({members.length})
          </h2>

          {isLoading ? (
            <div className="dash-card py-10 text-center text-sm text-muted-foreground">
              Carregando equipe...
            </div>
          ) : members.length === 0 ? (
            <div className="dash-card py-10 text-center text-sm text-muted-foreground">
              Nenhum profissional vinculado ainda.
            </div>
          ) : (
            <ul className="space-y-3">
              {members.map((m) => {
                const isOwner = Boolean(m.is_admin);
                const isSelf = m.id === currentUser?.id;
                const canRemove = !isOwner && !isSelf;

                return (
                  <li key={m.id} className="dash-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{displayName(m)}</p>
                      {m.email && (
                        <p className="text-xs text-muted-foreground mt-0.5">{m.email}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {m.phone?.replace(/\D/g, "") ? m.phone : "Telefone não informado"}
                      </p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary mt-2">
                        {isOwner ? "Dono" : "Profissional"}
                      </p>
                      {!isOwner && (
                        <div className="mt-2">
                          {(() => {
                            const s = statusLabel(m.status);
                            if (s.variant === "pending") {
                              return (
                                <Badge className="bg-amber-500/15 text-amber-600 border border-amber-500/25">
                                  {s.text}
                                </Badge>
                              );
                            }
                            // Ativo (ou legado nulo)
                            return (
                              <Badge className="bg-emerald-500/15 text-emerald-600 border border-emerald-500/25">
                                {s.text}
                              </Badge>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                    {canRemove && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10 shrink-0"
                        onClick={() => setRemoveTarget(m)}
                      >
                        <UserMinus className="h-4 w-4 mr-2" />
                        Remover
                      </Button>
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
              Tem certeza que deseja remover <strong>{removeTarget ? displayName(removeTarget) : ""}</strong> da
              equipe? Ele perderá o acesso à agenda, mas o histórico de cortes será mantido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="rounded-xl" disabled={removeLoading}>
              Cancelar
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              className="rounded-xl"
              disabled={removeLoading}
              onClick={() => void confirmRemove()}
            >
              {removeLoading ? "Removendo..." : "Remover"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
