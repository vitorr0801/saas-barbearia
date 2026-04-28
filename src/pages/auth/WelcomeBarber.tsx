"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Briefcase, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

export default function WelcomeBarber() {
  const navigate = useNavigate();
  
  const [barbeariaName, setBarbeariaName] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isFatalError, setIsFatalError] = useState(false);
  const [cleanToken, setCleanToken] = useState<string | null>(null);

  useEffect(() => {
    async function validateSecureToken() {
      try {
        /**
         * 🚀 EXTRAÇÃO DE ELITE (Vanilla JS)
         * O useSearchParams às vezes "trava" quando encontra um '#' na URL.
         * Usamos a API nativa de URL para garantir que pegamos o UUID puro, 
         * mesmo que o Supabase injete o access_token logo depois.
         */
        const fullUrl = window.location.href;
        const urlObj = new URL(fullUrl);
        
        // 1. Tenta pegar pelo parâmetro normal
        let tokenValue = urlObj.searchParams.get("token");

        // 2. Fallback: Se o '#' estiver colado no token, extraímos na mão
        if (!tokenValue && fullUrl.includes("token=")) {
          const parts = fullUrl.split("token=");
          if (parts[1]) {
            tokenValue = parts[1].split(/[#&]/)[0]; // Corta no primeiro '#' ou '&'
          }
        }

        console.log("💎 Token Higienizado via Vanilla JS:", tokenValue);

        if (!tokenValue) {
          console.error("🛑 Erro: Nenhum token encontrado na URL.");
          setIsFatalError(true);
          setIsLoading(false);
          return;
        }

        setCleanToken(tokenValue);

        /**
         * 🛡️ VALIDAÇÃO VIA RPC (PADRÃO MUNDIAL)
         */
        const { data, error } = await supabase
          .rpc('validar_convite_seguro', { token_convite: tokenValue });

        if (error || !data || data.length === 0) {
          console.error("🛑 Erro na validação ou convite inexistente:", error);
          setIsFatalError(true);
          return;
        }

        const convite = data[0];

        if (convite.status !== "pendente") {
          console.warn("⚠️ Convite já utilizado ou expirado.");
          setIsFatalError(true);
          return;
        }

        if (convite.expires_at && new Date() > new Date(convite.expires_at)) {
          console.error("⏱️ Convite expirado pelo tempo.");
          setIsFatalError(true);
          return;
        }

        // Sucesso: Popula a tela com os dados reais do banco
        setInviteEmail(convite.email);
        setBarbeariaName(convite.nome_da_empresa || "Sua Nova Equipe");

      } catch (err) {
        console.error("🚨 Falha crítica no fluxo de boas-vindas:", err);
        setIsFatalError(true);
      } finally {
        setIsLoading(false);
      }
    }

    validateSecureToken();
  }, []);

  const handleProceed = () => {
    if (!cleanToken) return;
    // Encaminha para o login com os dados sanitizados
    navigate(`/login-barbeiro?type=invite&token=${cleanToken}&email=${encodeURIComponent(inviteEmail)}`);
  };

  // --- INTERFACE (UI) ---

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0c12] flex flex-col items-center justify-center p-6">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Validando acesso seguro...</p>
      </div>
    );
  }

  if (isFatalError) {
    return (
      <div className="min-h-screen bg-[#0a0c12] flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="h-16 w-16 text-destructive mb-6" />
        <h1 className="text-xl font-black text-white uppercase italic">Link Inválido</h1>
        <p className="text-xs text-muted-foreground mt-2 max-w-xs">Este convite expirou ou já foi utilizado. Solicite um novo link ao gestor.</p>
        <Button onClick={() => navigate("/")} variant="outline" className="mt-8 rounded-xl border-white/10">Voltar</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0c12] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in-95 duration-700">
        
        <div className="space-y-3">
          <div className="w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center mx-auto border border-primary/20">
            <Briefcase className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-black italic uppercase text-white">
            Ingresso <span className="text-primary">VIP</span>
          </h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Equipe: {barbeariaName}
          </p>
        </div>

        <div className="bg-[#11141d] border border-white/5 rounded-[2.5rem] p-10 shadow-2xl space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-left">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-[11px] font-black text-white uppercase">E-mail Confirmado</p>
                <p className="text-[10px] text-muted-foreground italic">{inviteEmail}</p>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleProceed} 
            className="w-full h-14 rounded-2xl font-black uppercase italic tracking-widest text-xs"
          >
            Aceitar Convite e Entrar
          </Button>
        </div>
      </div>
    </div>
  );
}