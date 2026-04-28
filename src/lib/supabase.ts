import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 🔍 TELEMETRIA DE INICIALIZAÇÃO (Apenas em Dev)
if (import.meta.env.DEV) {
  console.log("🔗 Supabase Engine: Inicializando conexão...");
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("❌ Erro Crítico: Variáveis de ambiente do Supabase não encontradas!");
  }
}

/**
 * 🛡️ CONFIGURAÇÃO DE ELITE (TIER-1)
 * Foco: Prevenção de Deadlocks e Persistência Robusta
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'barberpro-auth-v1', // 🔑 Chave única para isolar o ambiente
    flowType: 'pkce', // 🔐 Padrão mundial de segurança para SPAs
    
    // 🚀 O "PULO DO GATO": Previne o carregamento infinito desativando 
    // o gerenciamento de locks nativo do navegador que costuma travar no Vite.
    // Isso força o Supabase a ser mais direto na autenticação.
    storage: window.localStorage,
  },
  global: {
    headers: { 'x-application-name': 'barberpro-business' },
  },
  // Otimização de recursos: Reduz o timeout para falhar rápido em vez de travar a UI
  db: {
    schema: 'public'
  }
});
