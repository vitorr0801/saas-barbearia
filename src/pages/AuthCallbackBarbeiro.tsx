import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

/**
 * 🛡️ AuthCallbackBarbeiro (Tier-1)
 * Resolve o Sequestro de Convites (Invite Hijack) e garante a criação de Donos.
 */
export default function AuthCallbackBarbeiro() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const hasProcessed = useRef(false);
  const [status, setStatus] = useState("Autenticando credenciais...");

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processBarberLogin = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) throw new Error("Sessão não encontrada.");

        const user = session.user;
        const userEmail = user.email;
        if (!userEmail) throw new Error("E-mail não identificado.");

        // 🚀 Lendo a Intenção Exata do Usuário
        const intentStr = localStorage.getItem("barberpro_oauth_intent");
        const intent = intentStr ? JSON.parse(intentStr) : null;
        
        // A CHAVE MESTRA: Ele veio por um link de convite?
        const isInviteFlow = intent?.isInvite === true;

        let validInvite = null;

        // 1. SÓ BUSCA CONVITE SE A INTENÇÃO ERA ENTRAR COMO COLABORADOR
        if (isInviteFlow) {
          const inviteToken = user.user_metadata?.invite_token || intent?.inviteToken;
          
          const { data: inviteData } = await supabase
            .from('invites')
            .select('id, barbearia_id')
            .or(`id.eq.${inviteToken || '00000000-0000-0000-0000-000000000000'},email.eq.${userEmail.trim().toLowerCase()}`)
            .eq('status', 'pendente')
            .maybeSingle();
              
          validInvite = inviteData;
        }

        // ==========================================
        // CENÁRIO A: COLABORADOR CONVIDADO
        // ==========================================
        if (validInvite) {
          setStatus("Vinculando você à equipe...");
          
          await supabase
            .from('profiles')
            .update({ barbearia_id: validInvite.barbearia_id, role: 'barbeiro', is_admin: false })
            .eq('id', user.id);

          await supabase.from('invites').update({ status: 'aceito' }).eq('id', validInvite.id);
          toast.success("Bem-vindo à equipe!");
          
          await refreshUser();
          localStorage.removeItem("barberpro_oauth_intent");
          navigate("/dashboard", { replace: true });
          return;
        }

        // ==========================================
        // CENÁRIO B: CRIAÇÃO DO DONO DA BARBEARIA (TIER-1)
        // ==========================================
        setStatus("Sincronizando perfil seguro...");

        // Aguardamos o banco criar o perfil básico
        let profile = null;
        for (let i = 0; i < 10; i++) { 
          const { data: pData } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
          if (pData) {
            profile = pData;
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 400));
        }

        // Se ele não tem barbearia, forçamos a patente de DONO
        if (!profile?.barbearia_id) {
          setStatus("Preparando ambiente de gestor...");
          
          const { error: rpcError } = await supabase.rpc('setup_barber_owner', { user_id: user.id });
          
          if (rpcError) {
            await supabase
              .from('profiles')
              .update({ role: 'barbeiro', is_admin: true })
              .eq('id', user.id);
          }
        }

        await refreshUser();
        localStorage.removeItem("barberpro_oauth_intent");

        const { data: finalProfile } = await supabase.from('profiles').select('barbearia_id').eq('id', user.id).single();

        if (finalProfile?.barbearia_id) {
          navigate("/dashboard", { replace: true });
        } else {
          // Agora sim: Um Dono recém-criado sem barbearia cai obrigatoriamente aqui!
          navigate("/onboarding", { replace: true });
        }
        
      } catch (err: any) {
        console.error("Auth Error:", err);
        toast.error("Erro na autenticação. Tente novamente.");
        localStorage.removeItem("barberpro_oauth_intent");
        navigate("/login-barbeiro", { replace: true });
      }
    };

    processBarberLogin();
  }, [navigate, refreshUser]);

  return (
    <div className="min-h-screen bg-[#0a0c12] flex flex-col items-center justify-center p-6 text-center">
      <div className="relative w-12 h-12 mb-6">
        <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
        <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
      <h1 className="text-xl font-black uppercase italic tracking-tighter text-white">
        Barber<span className="text-primary">Pro</span> Business
      </h1>
      <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground mt-4 animate-pulse">
        {status}
      </p>
    </div>
  );
}