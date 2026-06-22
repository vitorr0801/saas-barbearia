"use client";

import { useState, useMemo } from "react";
import { Star, X, Trash2, User, ChevronLeft, MessageSquare } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ReviewModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  shopId: string;
  shopName: string;
  onSuccess?: () => void;
}

export function ReviewModal({ isOpen, onOpenChange, shopId, shopName, onSuccess }: ReviewModalProps) {
  const { currentUser, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
  // Controle de Telas do Modal: 'list' (Mural) ou 'form' (Avaliar)
  const [currentView, setCurrentView] = useState<'list' | 'form'>('list');
  
  // Controle de Paginação (10 em 10)
  const [visibleCount, setVisibleCount] = useState(10);

  // Estados do Formulário
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const labels = ["", "Péssimo", "Ruim", "Razoável", "Muito Bom", "Excelente"];

  // Busca todo o histórico de avaliações da barbearia
  const { data: reviews = [], isLoading: loadingReviews, refetch } = useQuery({
    queryKey: ["shop-reviews", shopId],
    queryFn: async () => {
      const { data: revs, error } = await supabase
        .from("shop_reviews")
        .select("*")
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!revs || revs.length === 0) return [];

      // Puxa o nome e foto dos clientes
      const clientIds = [...new Set(revs.map(r => r.client_id))];
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .in("id", clientIds);

      return revs.map(r => {
        const p = profs?.find(p => p.id === r.client_id);
        return { 
          ...r, 
          client_name: p?.name || "Usuário do BarberPro", 
          client_avatar: p?.avatar_url 
        };
      });
    },
    enabled: isOpen && !!shopId
  });

  // Filtra as avaliações
  const myReview = useMemo(() => reviews.find(r => r.client_id === currentUser?.id), [reviews, currentUser]);
  const otherReviews = useMemo(() => reviews.filter(r => r.client_id !== currentUser?.id), [reviews, currentUser]);
  const displayedOtherReviews = otherReviews.slice(0, visibleCount);

  // Calcula a média em tempo real para exibir no topo
  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, curr) => acc + curr.rating, 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  const handleOpenForm = () => {
    if (!isAuthenticated) {
      toast.error("Você precisa estar logado para avaliar.");
      return;
    }
    if (myReview) {
      toast.info("Você já avaliou este estabelecimento. Exclua sua avaliação atual para refazer.");
      return;
    }
    setCurrentView('form');
  };

  const handleSubmit = async () => {
    if (!isAuthenticated || !currentUser) return;
    if (rating === 0) return toast.error("Selecione uma nota de 1 a 5 estrelas.");

    setIsSubmitting(true);
    const toastId = toast.loading("Enviando avaliação...");

    try {
      const { error } = await supabase
        .from("shop_reviews")
        .insert({
          shop_id: shopId,
          client_id: currentUser.id,
          rating,
          comment: comment.trim() || null,
        });

      if (error) throw error;

      await refetch();
      await queryClient.invalidateQueries({ queryKey: ["featured-shops-real"] });

      toast.success("Avaliação enviada com sucesso!", { id: toastId });
      if (onSuccess) onSuccess();
      
      setRating(0);
      setComment("");
      setCurrentView('list'); // Volta pro mural
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao enviar avaliação.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    const toastId = toast.loading("Excluindo avaliação...");
    try {
      const { error } = await supabase.from("shop_reviews").delete().eq("id", reviewId);
      if (error) throw error;
      
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ["featured-shops-real"] });
      
      toast.success("Avaliação excluída.", { id: toastId });
    } catch {
      toast.error("Falha ao excluir.", { id: toastId });
    }
  };

  // Ao fechar o modal, reseta a view para 'list' e a paginação para 10
  const handleClose = (open: boolean) => {
    if (!open) {
      setTimeout(() => {
        setCurrentView('list');
        setVisibleCount(10);
      }, 300);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col rounded-[2rem] border border-border bg-card p-0 overflow-hidden shadow-2xl">
        
        {/* CABEÇALHO DINÂMICO */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-secondary/10 shrink-0">
          <div className="flex items-center gap-3">
            {currentView === 'form' && (
              <button 
                onClick={() => setCurrentView('list')}
                className="h-8 w-8 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <DialogTitle className="text-lg font-black tracking-tight text-foreground">
              {currentView === 'list' ? "Avaliações" : "Avaliar Barbearia"}
            </DialogTitle>
          </div>
          {/* O DialogContent do shadcn já renderiza um 'X' na raiz dele, por isso o segundo foi removido daqui */}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
          
          {/* ================================================== */}
          {/* VIEW 1: MURAL DE AVALIAÇÕES E HISTÓRICO              */}
          {/* ================================================== */}
          {currentView === 'list' && (
            <div className="space-y-6">
              
              {/* Resumo da Nota e Botão Avaliar */}
              <div className="flex flex-col items-center justify-center p-6 bg-secondary/20 rounded-3xl border border-white/5 space-y-4">
                <div className="text-center space-y-1">
                  <div className="flex items-center justify-center gap-2 text-[#FFB800]">
                    <Star className="w-8 h-8 fill-[#FFB800]" />
                    <span className="text-4xl font-black">{reviews.length > 0 ? averageRating : "—"}</span>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Baseado em {reviews.length} avaliações
                  </p>
                </div>
                
                {(!myReview) && (
                  <Button 
                    onClick={handleOpenForm}
                    className="w-full rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[11px] tracking-widest shadow-lg h-12 mt-2"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" /> Avaliar Estabelecimento
                  </Button>
                )}
              </div>

              {/* Minha Avaliação (Se existir) */}
              {myReview && (
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-3 relative">
                  <div className="absolute top-4 right-4">
                    <button 
                      onClick={() => handleDelete(myReview.id)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-colors"
                      title="Excluir minha avaliação"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Sua Avaliação</h4>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={cn("w-4 h-4", myReview.rating >= s ? "fill-[#FFB800] text-[#FFB800]" : "text-muted-foreground/30")} />
                    ))}
                  </div>
                  {myReview.comment && (
                    <p className="text-sm text-foreground/80 italic">"{myReview.comment}"</p>
                  )}
                  <p className="text-[10px] text-muted-foreground opacity-60 pt-2 border-t border-primary/10">
                    Avaliamos em: {new Date(myReview.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}

              {/* Histórico da Comunidade */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Comunidade</h4>
                
                {loadingReviews ? (
                  <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
                ) : displayedOtherReviews.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic text-center py-4">Nenhuma avaliação encontrada.</p>
                ) : (
                  <div className="space-y-4">
                    {displayedOtherReviews.map((rev) => (
                      <div key={rev.id} className="p-4 rounded-2xl bg-secondary/20 border border-white/5 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={rev.client_avatar} />
                              <AvatarFallback className="bg-secondary text-[10px] font-bold"><User className="w-4 h-4" /></AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-xs font-bold text-foreground">{rev.client_name}</p>
                              <p className="text-[10px] text-muted-foreground">{new Date(rev.created_at).toLocaleDateString('pt-BR')}</p>
                            </div>
                          </div>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className={cn("w-3.5 h-3.5", rev.rating >= s ? "fill-[#FFB800] text-[#FFB800]" : "text-muted-foreground/30")} />
                            ))}
                          </div>
                        </div>
                        {rev.comment && (
                          <p className="text-sm text-foreground/80 pl-11">"{rev.comment}"</p>
                        )}
                      </div>
                    ))}
                    
                    {/* Botão Ver Mais (Paginação) */}
                    {visibleCount < otherReviews.length && (
                      <div className="pt-2 flex justify-center">
                        <Button 
                          variant="ghost" 
                          onClick={() => setVisibleCount(prev => prev + 10)}
                          className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
                        >
                          Carregar mais avaliações
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ================================================== */}
          {/* VIEW 2: FORMULÁRIO DE AVALIAÇÃO                      */}
          {/* ================================================== */}
          {currentView === 'form' && (
            <div className="space-y-8 py-4">
              <div className="flex flex-col items-center justify-center gap-4">
                <p className="text-sm font-bold text-foreground text-center">
                  {rating > 0 ? labels[rating] : hoverRating > 0 ? labels[hoverRating] : "Como foi sua experiência?"}
                </p>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-transform hover:scale-110 active:scale-95 p-1"
                    >
                      <Star
                        className={cn(
                          "w-12 h-12 transition-colors duration-200",
                          (hoverRating || rating) >= star
                            ? "fill-[#FFB800] text-[#FFB800]" 
                            : "fill-secondary text-secondary-foreground/20"
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-2">
                  <span className="w-4 h-4 flex items-center justify-center border border-muted-foreground/30 rounded text-[8px]">💬</span>
                  Comentário (opcional)
                </label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Ex: Atendimento excelente, ambiente limpo..."
                  className="min-h-[120px] resize-none rounded-xl bg-secondary/30 border-white/5 focus-visible:ring-primary/50 text-sm p-4"
                  disabled={isSubmitting}
                />
              </div>

              <div className="pt-4 border-t border-white/5">
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || rating === 0}
                  className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-black uppercase tracking-widest shadow-lg disabled:opacity-50 disabled:grayscale"
                >
                  {isSubmitting ? "Salvando..." : "Confirmar Avaliação"}
                </Button>
              </div>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}