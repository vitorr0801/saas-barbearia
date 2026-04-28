import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const hasProcessed = useRef(false);
  const [status, setStatus] = useState("Sincronizando perfil...");

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processClientLogin = async () => {
      try {
        // 1. Pega a sessão "crua" direto do provedor
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          throw new Error("Sessão inválida.");
        }

        // 2. 🕵️ INTERCEPTAÇÃO PRECOCE: Consultamos o papel direto no banco 
        // ANTES de permitir que o estado global (AuthContext) propague o login.
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();

        // 3. 🛑 BLOQUEIO CIRÚRGICO DE BARBEIRO
        if (profile?.role === 'barbeiro') {
          // Exibe o erro na tela
          toast.error("Acesso negado: Conta profissional.", {
            description: "Você tentou logar como barbeiro na área de clientes."
          });

          // Destruição imediata da sessão
          await supabase.auth.signOut();
          
          // 🚀 TÉCNICA ANTI-ZUMBI: 
          // Como o AuthContext iniciou uma busca automática no login, ela pode 
          // terminar *depois* do nosso signOut. Engatamos um segundo signOut com 
          // delay para garantir que qualquer estado atrasado seja aniquilado.
          setTimeout(() => supabase.auth.signOut(), 800);

          // Limpeza agressiva do cache do navegador (mata resquícios do token)
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('sb-') && key.endsWith('auth-token')) {
              localStorage.removeItem(key);
            }
          }

          // Retorna para a tela de login substituindo o callback no histórico.
          // Assim, o botão "Voltar" apontará naturalmente para /descobrir (deslogado).
          navigate("/login-cliente", { replace: true });
          return; // Aborta a execução para não carregar o contexto
        }

        // ✅ FLUXO CLIENTE APROVADO
        await supabase.rpc('sync_user_role', { target_role: 'cliente' });
        await refreshUser();
        
        setStatus("Bem-vindo de volta!");
        navigate("/descobrir", { replace: true });

      } catch (err: any) {
        console.error("Auth Error:", err);
        toast.error("Erro ao validar acesso.");
        navigate("/login-cliente", { replace: true });
      }
    };

    processClientLogin();
  }, [navigate, refreshUser]);

  return (
    <div className="min-h-screen bg-[#0a0c12] flex flex-col items-center justify-center p-6 text-center">
      <div className="relative w-12 h-12 mb-6">
        <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
        <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
      <h1 className="text-xl font-black uppercase italic tracking-tighter text-foreground">
        BarberPro <span className="text-primary">Member</span>
      </h1>
      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground mt-4 animate-pulse">
        {status}
      </p>
    </div>
  );
}