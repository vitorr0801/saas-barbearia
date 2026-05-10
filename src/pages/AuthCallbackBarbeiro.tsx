import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function AuthCallbackBarbeiro() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const hasProcessed = useRef(false);
  const [status, setStatus] = useState("Sincronizando sua conta...");

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const finalizeLogin = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) throw new Error("Sessão não encontrada.");

        const user = session.user;
        const userEmail = user.email?.toLowerCase().trim();

        // 1. Pegamos os dados que ela digitou na tela de cadastro (Metadata)
        const typedName = user.user_metadata?.name || "";
        const typedPhone = user.user_metadata?.phone || "";

        const intentStr = localStorage.getItem("barberpro_oauth_intent");
        const intent = intentStr ? JSON.parse(intentStr) : null;
        const isInviteFlow = intent?.isInvite === true;

        if (isInviteFlow) {
          // 2. Buscamos o convite correspondente
          const { data: validInvite } = await supabase
            .from('invites')
            .select('*')
            .eq('email', userEmail)
            .eq('status', 'pendente')
            .maybeSingle();

          if (validInvite) {
            setStatus("Vinculando você à barbearia...");

            // 3. ATUALIZAÇÃO CRÍTICA: Mesclamos dados do convite + dados digitados
            const { error: profileError } = await supabase
              .from('profiles')
              .update({ 
                name: typedName,          // Nome que ela digitou
                phone: typedPhone,        // WhatsApp que ela digitou
                barbearia_id: validInvite.barbearia_id,
                job_title: validInvite.job_title,
                provides_services: validInvite.provides_services,
                role: 'barbeiro',
                is_admin: false,
                status: 'ativo'
              })
              .eq('id', user.id);

            if (profileError) throw profileError;

            // 4. Mudamos o status do convite para 'aceito'
            await supabase
              .from('invites')
              .update({ status: 'aceito' })
              .eq('id', validInvite.id);

            toast.success("Perfil configurado com sucesso!");
          }
        } else {
          // Fluxo de Dono (Cenário B)
          const { data: profile } = await supabase
            .from('profiles')
            .select('barbearia_id')
            .eq('id', user.id)
            .single();

          if (!profile?.barbearia_id) {
            await supabase.rpc('setup_barber_owner', { user_id: user.id });
          }
        }

        localStorage.removeItem("barberpro_oauth_intent");
        await refreshUser();
        
        // Pequeno delay para garantir que o banco processou tudo
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 500);

      } catch (err: any) {
        console.error("Erro no Callback:", err);
        toast.error("Erro ao finalizar configuração.");
        navigate("/login-barbeiro");
      }
    };

    finalizeLogin();
  }, [navigate, refreshUser]);

  return (
    <div className="min-h-screen bg-[#0a0c12] flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
      <h1 className="text-white font-bold uppercase italic">BarberPro Business</h1>
      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-2">{status}</p>
    </div>
  );
}