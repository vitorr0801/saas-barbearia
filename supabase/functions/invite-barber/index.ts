// supabase/functions/invite-barber/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. Tratamento de CORS (Obrigatório para o navegador autorizar a chamada)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, origin } = await req.json()
    if (!email) throw new Error("O e-mail é obrigatório.")

    // 2. Validação da Identidade (Quem está disparando o convite?)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) throw new Error('Sessão inválida ou expirada. Refaça o login.')

    // 3. O Modo "Root" (Service Role Key) para bypass de segurança exclusivo do servidor
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 4. Verificação de Nível de Acesso (É o gestor da barbearia?)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('barbearia_id, is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin || !profile?.barbearia_id) {
       throw new Error('Acesso negado: Apenas o gestor pode recrutar novos profissionais.')
    }

    // 5. 🚀 TIER-1: Geração do Ingresso VIP (Token UUID)
    const { data: invite, error: inviteErr } = await supabaseAdmin
      .from('invites')
      .insert({
        email: email.trim().toLowerCase(),
        barbearia_id: profile.barbearia_id,
        status: 'pendente'
      })
      .select('id')
      .single()

    if (inviteErr) throw new Error(`Falha de banco de dados ao gerar token: ${inviteErr.message}`)

    // 6. 🔗 Construção da Rota Blindada e Disparo de E-mail
    const redirectTo = `${origin}/convite-aceito?token=${invite.id}`

    const { error: mailErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(email.trim().toLowerCase(), {
      redirectTo,
      data: { role: 'barbeiro', invite_token: invite.id }
    })

    if (mailErr) {
      // Degradação Elegante: Apaga o rastro fantasma se o carteiro tropeçar
      await supabaseAdmin.from('invites').delete().eq('id', invite.id)
      throw new Error(`Falha no envio do e-mail: ${mailErr.message}`)
    }

    return new Response(JSON.stringify({ success: true, message: "Convite processado com sucesso!" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})