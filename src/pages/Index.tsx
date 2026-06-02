"use client"

import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { generateSlotsFromShift } from "@/lib/bookingSlots";
import {
  ArrowLeft, ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  CheckCircle2, MapPin, Store, Clock, Instagram, Phone,
  Star, Scissors, Users, Info, User, Trash2, MessageCircle, CreditCard, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ServiceCard } from "@/components/booking/ServiceCard";
import { ProfessionalCard } from "@/components/booking/ProfessionalCard";
import { TimeSlotGrid } from "@/components/booking/TimeSlotGrid";
import { Header } from "@/components/Header";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/formatDuration";
import { BookingAuthRequiredDialog } from "@/components/booking/BookingAuthRequiredDialog";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import type { BookingCheckoutState } from "@/types/booking";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function getPromoText(percentage: number | null, days: number[] | null) {
  if (!percentage || !days || days.length === 0) return null;
  return `${percentage}% OFF (${days.map(d => DIAS_SEMANA[d]).join(", ")})`;
}

function extractInstagramHandle(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const urlMatch = raw.match(/instagram\.com\/([^/?#]+)/i);
  if (urlMatch) return urlMatch[1].replace(/\/$/, "");
  return raw.replace(/^@/, "").trim() || null;
}

// ─── CalendarPicker ──────────────────────────────────────────────────────────

function CalendarPicker({ selectedDate, onSelect }: { selectedDate: string; onSelect: (date: string) => void }) {
  const [viewDate, setViewDate] = useState(new Date());
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const months = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

  const renderDays = () => {
    const year  = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay    = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(<div key={`e-${i}`} />);
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const dateStr = dateObj.toLocaleDateString("pt-BR");
      const isSelected = selectedDate === dateStr;
      const isPast     = dateObj < today;
      days.push(
        <button key={day} disabled={isPast} onClick={() => onSelect(dateStr)}
          className={cn(
            "h-10 w-full rounded-xl text-xs font-bold transition-all flex items-center justify-center",
            isSelected ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-110" : "hover:bg-secondary",
            isPast ? "opacity-10 cursor-not-allowed italic" : "text-foreground"
          )}
        >{day}</button>
      );
    }
    return days;
  };

  return (
    <div className="bg-card border border-border p-5 rounded-[2rem] animate-in zoom-in-95 duration-300 mt-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-black uppercase italic tracking-widest text-primary">
          {months[viewDate.getMonth()]} <span className="text-muted-foreground">{viewDate.getFullYear()}</span>
        </h3>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth()-1)))} className="h-8 w-8 rounded-lg"><ChevronLeft className="w-4 h-4"/></Button>
          <Button variant="ghost" size="icon" onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth()+1)))} className="h-8 w-8 rounded-lg"><ChevronRight className="w-4 h-4"/></Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DIAS_SEMANA.map(d => <div key={d} className="text-[9px] font-black uppercase text-center text-muted-foreground opacity-40">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">{renderDays()}</div>
    </div>
  );
}

// ─── Tipos ───────────────────────────────────────────────────────────────────

type TabId = "servicos" | "profissionais" | "avaliacoes" | "detalhes";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "servicos",      label: "Serviços",      icon: <Scissors  className="w-3.5 h-3.5" /> },
  { id: "profissionais", label: "Profissionais", icon: <Users     className="w-3.5 h-3.5" /> },
  { id: "avaliacoes",    label: "Avaliações",    icon: <Star      className="w-3.5 h-3.5" /> },
  { id: "detalhes",      label: "Detalhes",      icon: <Info      className="w-3.5 h-3.5" /> },
];

// ─── Aba: Profissionais ──────────────────────────────────────────────────────

function ProfessionaisTab({
  professionals,
  onSelectProfessional,
}: {
  professionals: any[];
  onSelectProfessional: (prof: any) => void;
}) {
  if (professionals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <Users className="w-10 h-10 text-muted-foreground/30" />
        <p className="text-sm font-bold text-muted-foreground">Nenhum profissional cadastrado.</p>
      </div>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {professionals.map(prof => {
        const handle = extractInstagramHandle(prof.instagram);
        const initials = prof.name.trim().split(/\s+/).map((t: string) => t[0]).slice(0,2).join("").toUpperCase();
        return (
          <div key={prof.id} className="flex items-center gap-4 p-4 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all">
            <Avatar className="h-16 w-16 shrink-0 ring-2 ring-border">
              <AvatarImage src={prof.avatar_url ?? undefined} alt={prof.name} className="object-cover object-center" />
              <AvatarFallback className="bg-secondary text-foreground font-black text-base">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm uppercase tracking-tight text-foreground truncate">{prof.name}</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">{prof.job_title || "Barbeiro"}</p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {handle && (
                  <a href={`https://instagram.com/${handle}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 text-purple-400 hover:text-purple-300 hover:border-purple-500/40 transition-all">
                    <Instagram className="w-3 h-3" /> @{handle}
                  </a>
                )}
                <button
                  onClick={() => onSelectProfessional(prof)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 hover:border-primary/40 transition-all"
                >
                  <Scissors className="w-3 h-3" /> Ver serviços
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Aba: Avaliações ─────────────────────────────────────────────────────────

function AvaliacoesTab({ shopId }: { shopId: string }) {
  const { currentUser, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [view, setView]               = useState<"list"|"form">("list");
  const [rating, setRating]           = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment]         = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);

  const labels = ["","Péssimo","Ruim","Razoável","Muito Bom","Excelente"];

  const { data: reviews = [], isLoading, refetch } = useQuery({
    queryKey: ["shop-reviews", shopId],
    queryFn: async () => {
      const { data: revs, error } = await supabase
        .from("shop_reviews").select("*").eq("shop_id", shopId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!revs?.length) return [];
      const clientIds = [...new Set(revs.map((r: any) => r.client_id))];
      const { data: profs } = await supabase
        .from("profiles").select("id, name, avatar_url").in("id", clientIds);
      return revs.map((r: any) => {
        const p = profs?.find((p: any) => p.id === r.client_id);
        return { ...r, client_name: p?.name || "Usuário BarberPro", client_avatar: p?.avatar_url };
      });
    },
    // Avaliações podem ser lidas por qualquer pessoa — cache de 5 min
    staleTime: 1000 * 60 * 5,
    enabled: !!shopId,
  });

  const myReview     = useMemo(() => reviews.find((r: any) => r.client_id === currentUser?.id), [reviews, currentUser]);
  const otherReviews = useMemo(() => reviews.filter((r: any) => r.client_id !== currentUser?.id), [reviews, currentUser]);
  const averageRating = useMemo(() => {
    if (!reviews.length) return 0;
    return (reviews.reduce((a: number, r: any) => a + r.rating, 0) / reviews.length).toFixed(1);
  }, [reviews]);

  const handleSubmit = async () => {
    if (!isAuthenticated || !currentUser) return toast.error("Você precisa estar logado.");
    if (rating === 0) return toast.error("Selecione uma nota de 1 a 5 estrelas.");
    setIsSubmitting(true);
    const toastId = toast.loading("Enviando avaliação...");
    try {
      const { error } = await supabase.from("shop_reviews").insert({
        shop_id: shopId, client_id: currentUser.id, rating, comment: comment.trim() || null,
      });
      if (error) throw error;
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ["featured-shops-real"] });
      toast.success("Avaliação enviada!", { id: toastId });
      setRating(0); setComment(""); setView("list");
    } catch (e: any) {
      toast.error(e.message || "Erro ao enviar.", { id: toastId });
    } finally { setIsSubmitting(false); }
  };

  const handleDelete = async (reviewId: string) => {
    const toastId = toast.loading("Excluindo...");
    try {
      const { error } = await supabase.from("shop_reviews").delete().eq("id", reviewId);
      if (error) throw error;
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ["featured-shops-real"] });
      toast.success("Avaliação excluída.", { id: toastId });
    } catch (e: any) { toast.error("Falha ao excluir.", { id: toastId }); }
  };

  if (view === "form") return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <button onClick={() => setView("list")} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="w-4 h-4" /> Voltar
      </button>
      <div className="flex flex-col items-center gap-4 py-4">
        <p className="text-sm font-bold text-foreground">
          {rating > 0 ? labels[rating] : hoverRating > 0 ? labels[hoverRating] : "Como foi sua experiência?"}
        </p>
        <div className="flex items-center gap-2">
          {[1,2,3,4,5].map(star => (
            <button key={star} onClick={() => setRating(star)} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)}
              className="transition-transform hover:scale-110 active:scale-95 p-1">
              <Star className={cn("w-12 h-12 transition-colors duration-200",
                (hoverRating || rating) >= star ? "fill-primary text-primary" : "fill-secondary text-secondary-foreground/20"
              )}/>
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Comentário (opcional)</label>
        <Textarea value={comment} onChange={e => setComment(e.target.value)}
          placeholder="Ex: Atendimento excelente, ambiente limpo..."
          className="min-h-[120px] resize-none rounded-xl bg-secondary/30 border-white/5 focus-visible:ring-primary/50 text-sm"
          disabled={isSubmitting} />
      </div>
      <Button onClick={handleSubmit} disabled={isSubmitting || rating === 0}
        className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg shadow-primary/20">
        {isSubmitting ? "Salvando..." : "Confirmar Avaliação"}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col items-center p-6 rounded-3xl bg-secondary/20 border border-border/30 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Star className="w-8 h-8 fill-primary" />
            <span className="text-4xl font-black">{reviews.length > 0 ? averageRating : "—"}</span>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
            {reviews.length} avaliação{reviews.length !== 1 ? "ões" : ""}
          </p>
        </div>
        {!myReview && (
          <Button onClick={() => { if (!isAuthenticated) return toast.error("Você precisa estar logado."); setView("form"); }}
            className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-[11px] shadow-lg">
            <MessageCircle className="w-4 h-4 mr-2" /> Avaliar Estabelecimento
          </Button>
        )}
      </div>

      {myReview && (
        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-3 relative">
          <div className="absolute top-4 right-4">
            <button onClick={() => handleDelete(myReview.id)}
              className="h-8 w-8 flex items-center justify-center rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Sua Avaliação</p>
          <div className="flex gap-1">
            {[1,2,3,4,5].map(s => <Star key={s} className={cn("w-4 h-4", myReview.rating >= s ? "fill-primary text-primary" : "text-muted-foreground/30")}/>)}
          </div>
          {myReview.comment && <p className="text-sm text-foreground/80 italic">"{myReview.comment}"</p>}
          <p className="text-[10px] text-muted-foreground opacity-60 pt-2 border-t border-primary/10">
            {new Date(myReview.created_at).toLocaleDateString("pt-BR")}
          </p>
        </div>
      )}

      <div className="space-y-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Comunidade</p>
        {isLoading ? (
          <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"/></div>
        ) : otherReviews.length === 0 ? (
          <p className="text-xs text-muted-foreground italic text-center py-6">Nenhuma avaliação ainda.</p>
        ) : (
          <>
            {otherReviews.slice(0, visibleCount).map((rev: any) => (
              <div key={rev.id} className="p-4 rounded-2xl bg-secondary/20 border border-white/5 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={rev.client_avatar}/>
                      <AvatarFallback className="bg-secondary text-[10px] font-bold"><User className="w-4 h-4"/></AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs font-bold text-foreground">{rev.client_name}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(rev.created_at).toLocaleDateString("pt-BR")}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(s => <Star key={s} className={cn("w-3.5 h-3.5", rev.rating >= s ? "fill-primary text-primary" : "text-muted-foreground/30")}/>)}
                  </div>
                </div>
                {rev.comment && <p className="text-sm text-foreground/80 pl-11">"{rev.comment}"</p>}
              </div>
            ))}
            {visibleCount < otherReviews.length && (
              <div className="pt-2 flex justify-center">
                <Button variant="ghost" onClick={() => setVisibleCount(p => p+10)}
                  className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Carregar mais
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Aba: Detalhes ────────────────────────────────────────────────────────────

// Labels de pagamento para exibição
const PAYMENT_LABELS: Record<string, { label: string; icon: string }> = {
  dinheiro: { label: "Dinheiro",          icon: "💵" },
  pix:      { label: "Pix",               icon: "🔑" },
  debito:   { label: "Cartão de Débito",  icon: "💳" },
  credito:  { label: "Cartão de Crédito", icon: "💳" },
};

const DAYS_LABEL: Record<string, string> = {
  "1": "Seg", "2": "Ter", "3": "Qua", "4": "Qui",
  "5": "Sex", "6": "Sáb", "0": "Dom",
};

function DetalhesTab({ shop }: { shop: any }) {
  const address     = [shop.street, shop.address_number, shop.complement].filter(Boolean).join(", ");
  const cityState   = [shop.neighborhood, shop.city, shop.state].filter(Boolean).join(" — ");
  const fullAddress = [address, cityState, shop.zip_code].filter(Boolean).join(", ");
  const handle      = extractInstagramHandle(shop.instagram_url);
  const whatsapp    = shop.whatsapp?.replace(/\D/g, "");

  // Horários: ordena Seg→Dom
  const workingHours = (shop.working_hours ?? {}) as Record<string, { open: string; close: string; closed: boolean }>;
  const orderedDays  = ["1","2","3","4","5","6","0"];
  const hasHours     = orderedDays.some(k => workingHours[k] && !workingHours[k].closed);

  // Pagamentos
  const payments = Array.isArray(shop.payment_methods) ? shop.payment_methods as string[] : [];

  const hasAnyDetail = shop.about || fullAddress || whatsapp || handle || hasHours || payments.length > 0;

  if (!hasAnyDetail) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center animate-in fade-in duration-300">
        <Info className="w-10 h-10 text-muted-foreground/30"/>
        <p className="text-sm font-bold text-muted-foreground">Nenhuma informação adicional cadastrada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">

      {/* Sobre */}
      {shop.about && (
        <div className="flex items-start gap-4 p-4 rounded-2xl border border-border/50 bg-card/50">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <Info className="w-5 h-5 text-primary"/>
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Sobre</p>
            <p className="text-sm text-foreground/80 leading-relaxed">{shop.about}</p>
          </div>
        </div>
      )}

      {/* Horário de atendimento */}
      {hasHours && (
        <div className="flex items-start gap-4 p-4 rounded-2xl border border-border/50 bg-card/50">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <Clock className="w-5 h-5 text-primary"/>
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Horário de Atendimento</p>
            <div className="space-y-1.5">
              {orderedDays.map(key => {
                const day = workingHours[key];
                if (!day) return null;
                return (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <span className={cn("font-bold w-8", day.closed ? "text-muted-foreground/50" : "text-foreground")}>
                      {DAYS_LABEL[key]}
                    </span>
                    {day.closed
                      ? <span className="text-muted-foreground/50 italic text-[10px]">Fechado</span>
                      : <span className="font-bold text-foreground tabular-nums">{day.open} – {day.close}</span>
                    }
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Endereço */}
      {fullAddress && (
        <div className="flex items-start gap-4 p-4 rounded-2xl border border-border/50 bg-card/50">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <MapPin className="w-5 h-5 text-primary"/>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Endereço</p>
            <p className="text-sm font-medium text-foreground leading-relaxed">{fullAddress}</p>
          </div>
        </div>
      )}

      {/* Formas de pagamento */}
      {payments.length > 0 && (
        <div className="flex items-start gap-4 p-4 rounded-2xl border border-border/50 bg-card/50">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <CreditCard className="w-5 h-5 text-primary"/>
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Formas de Pagamento</p>
            <div className="flex flex-wrap gap-2">
              {payments.map(p => {
                const opt = PAYMENT_LABELS[p];
                if (!opt) return null;
                return (
                  <span key={p} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/50 border border-border/50 text-[11px] font-bold text-foreground">
                    <span>{opt.icon}</span> {opt.label}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Redes sociais */}
      {(handle || whatsapp) && (
        <div className="flex items-start gap-4 p-4 rounded-2xl border border-border/50 bg-card/50">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <Instagram className="w-5 h-5 text-primary"/>
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Redes Sociais</p>
            <div className="flex flex-col gap-2">
              {handle && (
                <a href={`https://instagram.com/${handle}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-bold text-purple-400 hover:text-purple-300 transition-colors">
                  <Instagram className="w-4 h-4"/> @{handle}
                </a>
              )}
              {whatsapp && (
                <a href={`https://wa.me/55${whatsapp}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-bold text-emerald-500 hover:text-emerald-400 transition-colors">
                  <Phone className="w-4 h-4"/> {shop.whatsapp}
                </a>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────

export default function Index() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const shopId = searchParams.get("shop")?.trim() || null;

  const [activeTab, setActiveTab]               = useState<TabId>("servicos");
  const [selectedService, setSelectedService]   = useState<string | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null);
  const [dateMode, setDateMode]                 = useState<"hoje"|"amanha"|"calendario">("hoje");
  const [calendarDate, setCalendarDate]         = useState<string>(new Date().toLocaleDateString("pt-BR"));
  const [selectedTime, setSelectedTime]         = useState<string | null>(null);
  const [authDialogOpen, setAuthDialogOpen]     = useState(false);
  const [detailsModalService, setDetailsModalService] = useState<any | null>(null);

  const todayStr = useMemo(() => new Date().toLocaleDateString("pt-BR"), []);
  const tomorrowStr = useMemo(() => {
    const t = new Date(); t.setDate(t.getDate()+1);
    return t.toLocaleDateString("pt-BR");
  }, []);
  const selectedDate = dateMode==="hoje" ? todayStr : dateMode==="amanha" ? tomorrowStr : calendarDate;

  // ─────────────────────────────────────────────────────────────────────────
  // 🚀 BOOKING ENGINE — 1 query via View em vez de 4 queries separadas
  // ─────────────────────────────────────────────────────────────────────────
  const { data: bookingData, isLoading: isDataLoading } = useQuery({
    queryKey: ["booking-engine-data", shopId],
    queryFn: async () => {
      if (!shopId) return { services: [], professionals: [], shop: null };

      // Query 1: dados da barbearia (shop info para as 4 abas)
      // Query 2: view desnormalizada (substitui profiles + services + barber_services)
      const [{ data: shopData, error: shopError }, { data: viewRows, error: viewError }] = await Promise.all([
        supabase.from("barbearias")
          .select("name, neighborhood, city, state, cover_image, rating, review_count, street, address_number, complement, zip_code, instagram_url, whatsapp, about, payment_methods, working_hours")
          .eq("id", shopId)
          .single(),
        supabase.from("booking_engine_view")
          .select("*")
          .eq("barbearia_id", shopId),
      ]);

      if (shopError)  console.warn("[BookingEngine] shop error:", shopError);
      if (viewError)  console.warn("[BookingEngine] view error:", viewError);

      const rows = viewRows || [];

      // Profissionais únicos (para a aba Profissionais)
      const profMap = new Map<string, any>();
      for (const r of rows) {
        if (!profMap.has(r.professional_id)) {
          profMap.set(r.professional_id, {
            id:        r.professional_id,
            name:      r.professional_name,
            instagram: r.instagram,
            avatar_url:r.avatar_url,
            job_title: r.job_title,
          });
        }
      }
      const professionals = Array.from(profMap.values());

      // Serviços únicos com profissionais disponíveis
      const serviceMap = new Map<string, any>();
      for (const r of rows) {
        if (!serviceMap.has(r.service_id)) {
          serviceMap.set(r.service_id, {
            id:              r.service_id,
            name:            r.service_name,
            description:     r.service_description,
            basePrice:       r.base_price,
            promoPercentage: r.promo_percentage || 0,
            promoDays:       r.promo_days || [],
            promoText:       getPromoText(r.promo_percentage, r.promo_days),
            durationDisplay: formatDuration(r.base_duration_min),
            availableProfs:  [],
          });
        }
        // Adiciona o profissional ao serviço
        serviceMap.get(r.service_id).availableProfs.push({
          id:        r.professional_id,
          name:      r.professional_name,
          instagram: r.instagram,
          avatar_url:r.avatar_url,
          job_title: r.job_title,
          price:     r.resolved_price,
          duration:  r.resolved_duration,
        });
      }

      // Calcula preços mín/máx e priceDisplay por serviço
      const services = Array.from(serviceMap.values())
        .filter(s => s.availableProfs.length > 0)
        .map(s => {
          const prices   = s.availableProfs.map((p: any) => p.price);
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          return {
            ...s,
            minPrice,
            isStartingPrice: minPrice < maxPrice,
            priceDisplay: minPrice < maxPrice
              ? `A partir de ${formatBRL(minPrice)}`
              : formatBRL(minPrice),
          };
        });

      return { services, professionals, shop: shopData };
    },
    // Dados de catálogo mudam pouco — 5 min de cache
    staleTime: 1000 * 60 * 5,
    enabled: !!shopId,
  });

  const services      = bookingData?.services      || [];
  const professionals = bookingData?.professionals || [];
  const shopInfo      = bookingData?.shop;

  const selectedServiceObj = useMemo(
    () => services.find((s: any) => s.id === selectedService),
    [services, selectedService]
  );

  const availableProfessionalsForService = useMemo(() => {
    if (!selectedServiceObj) return [];
    return selectedServiceObj.availableProfs.map((p: any) => ({
      id:           p.id,
      name:         p.name,
      avatar:       p.avatar_url ?? undefined,
      instagram:    p.instagram,
      rawPrice:     p.price,
      rawDuration:  p.duration,
      priceDisplay: formatBRL(p.price),
    }));
  }, [selectedServiceObj]);

  const selectedProfessionalObj = useMemo(
    () => availableProfessionalsForService.find((p: any) => p.id === selectedProfessional),
    [availableProfessionalsForService, selectedProfessional]
  );

  useEffect(() => {
    const state = location.state as { preSelectServiceId?: string; preSelectProfessionalId?: string } | null;
    if (state?.preSelectServiceId && services.length > 0) {
      setSelectedService(state.preSelectServiceId);
      if (state.preSelectProfessionalId) setSelectedProfessional(state.preSelectProfessionalId);
    }
  }, [location.state, services]);

  // filteredServices: quando um profissional já foi pré-selecionado (fluxo invertido),
  // exibe apenas os serviços que ele realiza. No fluxo normal, exibe tudo.
  const filteredServices = useMemo(() => {
    if (!selectedProfessional || selectedService) return services;
    return services.filter((s: any) =>
      s.availableProfs.some((p: any) => p.id === selectedProfessional)
    );
  }, [services, selectedProfessional, selectedService]);

  // Nome do profissional que está sendo usado como filtro (fluxo invertido)
  const filterProfName = useMemo(() => {
    if (!selectedProfessional || selectedService) return null;
    return professionals.find((p: any) => p.id === selectedProfessional)?.name ?? null;
  }, [professionals, selectedProfessional, selectedService]);

  const handleSelectService = (id: string) => {
    setSelectedTime(null);
    if (!id) {
      // "Alterar" — reinicia o fluxo completamente
      setSelectedService(null);
      setSelectedProfessional(null);
      return;
    }
    // Fluxo invertido: profissional pré-selecionado e serviço ainda não escolhido
    const fromProfFilter = !!selectedProfessional && !selectedService;
    setSelectedService(id);
    if (!fromProfFilter) {
      setSelectedProfessional(null);
    } else {
      // Profissional já definido — rola suavemente para o Passo 3
      setTimeout(() => {
        document.getElementById("step-3")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    }
  };

  const handleSelectProfessional = (id: string) => { setSelectedProfessional(id); setSelectedTime(null); };

  const handleSelectFromProfTab = (prof: any) => {
    setSelectedProfessional(prof.id);
    setSelectedService(null);
    setSelectedTime(null);
    setActiveTab("servicos");
  };

  const dayOfWeekInt = useMemo(() => {
    if (!selectedDate) return null;
    const [day, month, year] = selectedDate.split("/").map(Number);
    return new Date(year, month-1, day).getDay();
  }, [selectedDate]);

  // Horários de trabalho — staleTime 5 min (muda raramente)
  const { data: workHourRow, isLoading: isLoadingWorkHours } = useQuery({
    queryKey: ["barber-work-hours", selectedProfessional, dayOfWeekInt],
    queryFn: async () => {
      if (!selectedProfessional || dayOfWeekInt === null) return null;
      const { data } = await supabase.from("barber_work_hours")
        .select("start_time, end_time")
        .eq("professional_id", selectedProfessional)
        .eq("day_of_week", dayOfWeekInt)
        .maybeSingle();
      return data;
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!selectedProfessional && dayOfWeekInt !== null,
  });

  // Slots ocupados — staleTime 0 (muda em tempo real), polling a cada 30s
  const { data: occupiedSlots = [], isLoading: isLoadingOccupied } = useQuery({
    queryKey: ["booked-slots", selectedProfessional, selectedDate],
    queryFn: async () => {
      if (!selectedProfessional || !selectedDate) return [];
      const [day, month, year] = selectedDate.split("/").map(Number);
      const dayStart = new Date(year, month-1, day, 0, 0, 0, 0);
      const dayEnd   = new Date(year, month-1, day, 23, 59, 59, 999);
      const { data } = await supabase.from("appointments").select("appointment_date")
        .eq("professional_id", selectedProfessional)
        .gte("appointment_date", dayStart.toISOString())
        .lte("appointment_date", dayEnd.toISOString())
        .not("status", "in", '("cancelado","canceled","cancelled")');
      return (data ?? []).map((a: any) => {
        const d = new Date(a.appointment_date);
        return `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`;
      });
    },
    staleTime: 0,               // sempre fresco — slots mudam quando alguém agenda
    refetchInterval: 30_000,    // polling a cada 30s enquanto o usuário está na tela
    enabled: !!selectedProfessional && !!selectedDate,
  });

  const slotsLoading = !!(selectedService && selectedProfessional) && (isLoadingWorkHours || isLoadingOccupied);

  const dynamicTimeSlots = useMemo(() => {
    if (!selectedServiceObj || !selectedProfessionalObj || !workHourRow || dayOfWeekInt === null) return [];
    const rawSlots = generateSlotsFromShift(workHourRow.start_time, workHourRow.end_time, selectedProfessionalObj.rawDuration);
    const now = new Date();
    const isToday = selectedDate === todayStr;
    const [d, m, y] = selectedDate.split("/").map(Number);
    return rawSlots.map(time => {
      const [h, min] = time.split(":").map(Number);
      const slotDate = new Date(y, m-1, d, h, min);
      return { id: time, time, available: !(isToday && slotDate < now) && !occupiedSlots.includes(time) };
    });
  }, [selectedDate, selectedProfessionalObj, selectedServiceObj, workHourRow, occupiedSlots, todayStr, dayOfWeekInt]);

  const isPromoDay = useMemo(() => {
    if (!selectedServiceObj || dayOfWeekInt === null) return false;
    return selectedServiceObj.promoDays.includes(dayOfWeekInt);
  }, [selectedServiceObj, dayOfWeekInt]);

  const finalPrice = useMemo(() => {
    if (!selectedProfessionalObj || !selectedServiceObj) return 0;
    const base = selectedProfessionalObj.rawPrice;
    return isPromoDay ? base - base * (selectedServiceObj.promoPercentage/100) : base;
  }, [selectedProfessionalObj, selectedServiceObj, isPromoDay]);

  const isBookingReady = selectedService && selectedProfessional && selectedDate && selectedTime;

  const checkoutButtonLabel = useMemo(() => {
    if (!selectedService)       return "Selecione o Serviço desejado";
    if (!selectedProfessional)  return "Escolha o Profissional na lista";
    if (!selectedTime)          return "Escolha o Horário de atendimento";
    return `Confirmar Agendamento (${formatBRL(finalPrice)})`;
  }, [selectedService, selectedProfessional, selectedTime, finalPrice]);

  const handleProceedToCheckout = async () => {
    if (!shopId || !selectedServiceObj || !selectedProfessionalObj || !selectedTime) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return setAuthDialogOpen(true);
    const [day, month, year] = selectedDate.split("/").map(Number);
    const [hours, minutes]   = selectedTime.split(":").map(Number);
    const payload: BookingCheckoutState = {
      shopId,
      serviceId:         selectedServiceObj.id,
      serviceName:       selectedServiceObj.name,
      servicePrice:      finalPrice,
      totalPriceDisplay: formatBRL(finalPrice),
      professionalId:    selectedProfessionalObj.id,
      professionalName:  selectedProfessionalObj.name,
      appointmentDate:   new Date(year, month-1, day, hours, minutes).toISOString(),
      dateLabel:         selectedDate===todayStr ? "Hoje" : selectedDate===tomorrowStr ? "Amanhã" : selectedDate,
      time:              selectedTime,
    };
    navigate("/checkout", { state: payload });
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background pb-32 overflow-x-hidden">
      <BookingAuthRequiredDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
      <Header />

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 pt-24">

        {/* Voltar */}
        <div className="flex items-center justify-between mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full bg-secondary/30 hover:bg-secondary">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>

        {/* Hero */}
        {isDataLoading ? (
          <div className="h-24 rounded-[2rem] bg-secondary/50 animate-pulse mb-6" />
        ) : shopInfo && (
          <div className="flex items-center gap-5 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[2rem] bg-secondary/50 flex items-center justify-center shrink-0 border-2 border-border/50 shadow-xl overflow-hidden">
              {shopInfo.cover_image
                ? <img src={shopInfo.cover_image} alt={shopInfo.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                : <Store className="w-10 h-10 text-primary/60" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tighter leading-none text-foreground mb-1.5 truncate">
                {shopInfo.name || "Barbearia"}
              </h1>
              <div className="flex items-center gap-1.5 text-muted-foreground bg-secondary/30 w-fit px-3 py-1.5 rounded-full">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-xs font-bold tracking-wide truncate max-w-[200px] md:max-w-xs">
                  {shopInfo.neighborhood || "—"}{shopInfo.city ? `, ${shopInfo.city}` : ""}
                </span>
              </div>
              {shopInfo.review_count > 0 && (
                <div className="flex items-center gap-1.5 mt-2">
                  <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                  <span className="text-xs font-black text-foreground">{Number(shopInfo.rating).toFixed(1)}</span>
                  <span className="text-[10px] text-muted-foreground">({shopInfo.review_count} avaliações)</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Abas sticky */}
        <div className="sticky top-[4.5rem] z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2 bg-background/80 backdrop-blur-xl border-b border-border/30 mb-6">
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all shrink-0",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >{tab.icon}{tab.label}</button>
            ))}
          </div>
        </div>

        {/* ── ABA: SERVIÇOS ── */}
        {activeTab === "servicos" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Passo 1 */}
            <section className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedService
                    ? <CheckCircle2 className="w-7 h-7 text-emerald-500 shrink-0"/>
                    : <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground shrink-0 shadow-lg shadow-primary/30 animate-pulse">1</span>
                  }
                  <h2 className="text-lg md:text-xl font-black uppercase italic tracking-tight">O que vamos fazer hoje?</h2>
                </div>
                {selectedService && (
                  <button onClick={() => handleSelectService("")} className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline bg-primary/10 px-3 py-1.5 rounded-full">Alterar</button>
                )}
              </div>
              {/* Badge de filtro ativo — aparece quando profissional foi pré-selecionado */}
              {filterProfName && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-primary/10 border border-primary/20 animate-in fade-in slide-in-from-top-2 duration-300">
                  <Scissors className="w-4 h-4 text-primary shrink-0" />
                  <p className="text-[11px] font-bold text-primary flex-1">
                    Mostrando serviços de <span className="font-black">{filterProfName}</span>
                  </p>
                  <button
                    onClick={() => setSelectedProfessional(null)}
                    className="w-6 h-6 flex items-center justify-center rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors shrink-0"
                    aria-label="Limpar filtro"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 items-start">
                {isDataLoading
                  ? [1,2,3].map(i => <div key={i} className="h-32 w-full bg-secondary/50 animate-pulse rounded-3xl border border-border/50"/>)
                  : filteredServices.map((s: any) => (
                    <ServiceCard key={s.id}
                      service={{...s, duration: s.durationDisplay, promoText: null}}
                      isSelected={selectedService === s.id}
                      onSelect={handleSelectService}
                      onShowDetails={svc => setDetailsModalService(svc)}
                    />
                  ))
                }
              </div>
            </section>

            {/* Passo 2 */}
            <section className={cn("space-y-5 transition-all duration-500",
              !selectedService && "opacity-30 pointer-events-none blur-[1px] grayscale-[50%]"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedProfessional
                    ? <CheckCircle2 className="w-7 h-7 text-emerald-500 shrink-0"/>
                    : <span className={cn("w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                        selectedService ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 animate-pulse" : "bg-muted text-muted-foreground"
                      )}>2</span>
                  }
                  <h2 className="text-lg md:text-xl font-black uppercase italic tracking-tight">Com quem deseja cortar?</h2>
                </div>
                {selectedProfessional && (
                  <button onClick={() => handleSelectProfessional("")} className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline bg-primary/10 px-3 py-1.5 rounded-full">Alterar</button>
                )}
              </div>
              {selectedService && (
                <div className="flex gap-3 sm:gap-4 overflow-x-auto sm:flex-wrap py-4 -my-4 -mx-4 px-4 sm:mx-0 sm:px-1 no-scrollbar animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {availableProfessionalsForService.map((p: any) => (
                    <div key={p.id} className="shrink-0 w-[150px] sm:w-[170px]">
                      <ProfessionalCard professional={p} isSelected={selectedProfessional === p.id} onSelect={handleSelectProfessional}/>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Passo 3 */}
            <section id="step-3" className={cn("space-y-6 transition-all duration-500",
              (!selectedService || !selectedProfessional) && "opacity-30 pointer-events-none blur-[1px] grayscale-[50%]"
            )}>
              <div className="flex items-center gap-3">
                {selectedTime
                  ? <CheckCircle2 className="w-7 h-7 text-emerald-500 shrink-0"/>
                  : <span className={cn("w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                      selectedService && selectedProfessional ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 animate-pulse" : "bg-muted text-muted-foreground"
                    )}>3</span>
                }
                <h2 className="text-lg md:text-xl font-black uppercase italic tracking-tight">Data e Horário</h2>
              </div>
              {selectedService && selectedProfessional && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-secondary/10 p-5 sm:p-6 rounded-3xl border border-border/50">
                  <div className="flex gap-2">
                    <Button onClick={() => setDateMode("hoje")} variant={dateMode==="hoje"?"default":"outline"} className={cn("rounded-xl font-black uppercase tracking-widest text-[10px] h-10 flex-1 sm:flex-none", dateMode==="hoje"&&"shadow-lg shadow-primary/20")}>Hoje</Button>
                    <Button onClick={() => setDateMode("amanha")} variant={dateMode==="amanha"?"default":"outline"} className={cn("rounded-xl font-black uppercase tracking-widest text-[10px] h-10 flex-1 sm:flex-none", dateMode==="amanha"&&"shadow-lg shadow-primary/20")}>Amanhã</Button>
                    <Button onClick={() => setDateMode("calendario")} variant={dateMode==="calendario"?"default":"outline"} className={cn("rounded-xl font-black uppercase tracking-widest text-[10px] h-10 border-dashed flex-1 sm:flex-none", dateMode==="calendario"&&"shadow-lg shadow-primary/20")}>
                      <CalendarIcon className="w-3.5 h-3.5 sm:mr-2"/><span className="hidden sm:inline">Escolher Dia</span>
                    </Button>
                  </div>
                  {dateMode==="calendario" && (
                    <CalendarPicker selectedDate={calendarDate} onSelect={date => { setCalendarDate(date); setSelectedTime(null); }}/>
                  )}
                  <TimeSlotGrid slots={dynamicTimeSlots} selectedSlot={selectedTime} onSelect={setSelectedTime}
                    isLoading={slotsLoading} promoPercentage={isPromoDay ? selectedServiceObj?.promoPercentage : null}/>
                </div>
              )}
            </section>
          </div>
        )}

        {/* ── ABA: PROFISSIONAIS ── */}
        {activeTab === "profissionais" && (
          <div className="animate-in fade-in duration-300">
            {isDataLoading
              ? <div className="grid gap-4 sm:grid-cols-2">{[1,2,3,4].map(i => <div key={i} className="h-24 rounded-2xl bg-secondary/50 animate-pulse"/>)}</div>
              : <ProfessionaisTab professionals={professionals} onSelectProfessional={handleSelectFromProfTab}/>
            }
          </div>
        )}

        {/* ── ABA: AVALIAÇÕES ── */}
        {activeTab === "avaliacoes" && shopId && (
          <AvaliacoesTab shopId={shopId}/>
        )}

        {/* ── ABA: DETALHES ── */}
        {activeTab === "detalhes" && (
          <div className="animate-in fade-in duration-300">
            {isDataLoading
              ? <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 rounded-2xl bg-secondary/50 animate-pulse"/>)}</div>
              : shopInfo ? <DetalhesTab shop={shopInfo}/> : <p className="text-sm text-muted-foreground text-center py-16">Sem dados disponíveis.</p>
            }
          </div>
        )}
      </div>

      {/* Checkout — só na aba Serviços */}
      {activeTab === "servicos" && (
        <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-background via-background/95 to-transparent z-50 pointer-events-none">
          <div className="max-w-4xl mx-auto">
            <Button onClick={handleProceedToCheckout} disabled={!isBookingReady}
              className={cn(
                "w-full h-14 sm:h-16 text-sm sm:text-base font-black uppercase italic tracking-tight rounded-2xl pointer-events-auto transition-all duration-300",
                isBookingReady
                  ? "btn-primary-glow bg-primary text-primary-foreground shadow-2xl shadow-primary/40 hover:scale-[1.02]"
                  : "bg-secondary text-muted-foreground border border-border/50 cursor-not-allowed shadow-none"
              )}
            >{checkoutButtonLabel}</Button>
          </div>
        </div>
      )}

      {/* Modal detalhes do serviço */}
      <Dialog open={!!detailsModalService} onOpenChange={open => !open && setDetailsModalService(null)}>
        <DialogContent className="w-[90vw] max-w-sm sm:max-w-md bg-[#0a0c12] border-border shadow-2xl rounded-3xl overflow-hidden">
          <DialogHeader className="px-4 pt-4 text-left">
            <DialogTitle className="text-xl font-black uppercase italic tracking-tighter text-foreground pr-6 break-words">
              {detailsModalService?.name}
            </DialogTitle>
            <DialogDescription className="sr-only">Detalhes do serviço</DialogDescription>
            <div className="flex items-center gap-3 mt-3 border-b border-border/50 pb-5">
              <span className="text-sm font-black text-primary tabular-nums">{detailsModalService?.priceDisplay}</span>
              <span className="w-1 h-1 rounded-full bg-border"/>
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                <Clock className="h-3.5 w-3.5"/> {detailsModalService?.duration}
              </span>
            </div>
          </DialogHeader>
          <div className="px-4 py-5">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Sobre o Serviço</h4>
            <div className="text-sm font-medium text-foreground/80 leading-relaxed whitespace-pre-wrap break-all max-h-[40vh] overflow-y-auto scrollbar-thin pr-2">
              {detailsModalService?.description}
            </div>
          </div>
          <div className="p-4 bg-background/50 border-t border-border/30 flex gap-3">
            <Button variant="outline" onClick={() => setDetailsModalService(null)} className="flex-1 h-12 rounded-xl font-bold uppercase tracking-widest text-[10px]">Fechar</Button>
            <Button onClick={() => { handleSelectService(detailsModalService?.id); setDetailsModalService(null); setActiveTab("servicos"); }}
              className="flex-1 h-12 rounded-xl font-black uppercase tracking-widest text-[10px] bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              Selecionar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}