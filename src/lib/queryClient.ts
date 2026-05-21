// src/lib/queryClient.ts
// QueryClient centralizado com configurações enterprise
// Importar em main.tsx e substituir o QueryClient inline

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 5 min: serviços, profissionais e dados da barbearia mudam pouco
      staleTime: 1000 * 60 * 5,
      // 10 min no cache após o componente desmontar
      gcTime: 1000 * 60 * 10,
      // 1 retry em vez de 3 — falha rápida, não trava o usuário
      retry: 1,
      // Não refetch ao focar a janela — evita spike de queries quando
      // o usuário alterna abas (comportamento padrão é true)
      refetchOnWindowFocus: false,
    },
    mutations: {
      // Mutations não fazem retry automático — lógica de negócio
      // (agendamento, avaliação) não pode ser repetida silenciosamente
      retry: 0,
    },
  },
});