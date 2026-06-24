# BarberPro - Sistema de Gestão para Barbearias

## 👥 Integrantes do Grupo
* João Pedro Venturoso Mazza
* Vitor Reis Rodrigues de Souza

## 📝 Descrição Geral da Solução
O BarberPro é um Software as a Service (SaaS) desenvolvido para modernizar e automatizar a gestão de barbearias. A plataforma oferece uma interface intuitiva para agendamentos online, gestão da equipe de barbeiros, acompanhamento financeiro, controle de status de serviços e muito mais, substituindo agendas de papel e processos manuais confusos por um fluxo digital altamente eficiente.

## 🛠️ Tecnologias Utilizadas
Este projeto foi construído utilizando as seguintes tecnologias modernas de mercado:
* **Frontend:** React, TypeScript, Vite
* **Estilização e Componentes:** Tailwind CSS, shadcn-ui
* **Backend e Banco de Dados:** Supabase (PostgreSQL, Autenticação, Row Level Security)

## 📚 Documentação
* [Resumo Executivo (PDF)](./docs/Resumo_Executivo_BarberPro.pdf)
* [Documentação Negocial](./docs/negocial.md)
* [Documentação Técnica](./docs/tecnica.md)

## 🔄 Evolução e Ajustes a partir dos Feedbacks

Após a primeira entrega, o projeto passou por uma rodada de refatoração técnica focada em qualidade de código e segurança:

- **Eliminação de débito técnico de tipagem:** Refatoração completa eliminando 100% dos erros de linting `@typescript-eslint/no-explicit-any`. Todos os usos de `any` foram substituídos por interfaces TypeScript concretas que espelham os tipos retornados pelas queries do Supabase, tornando o contrato de dados explícito em toda a aplicação.
- **Correção de dependências de hooks:** Resolução da violação de `react-hooks/exhaustive-deps` em componentes com `useEffect`, garantindo que os arrays de dependências reflitam com precisão os valores utilizados dentro de cada efeito e eliminando riscos de comportamento stale.
- **Padronização de arquitetura cliente-servidor:** Unificação do padrão de tipagem nos clientes Supabase (`services-client.ts`, `shop-client.ts`, `team-client.ts`), eliminando usos de `parseJson<{}>` e substituindo por `Record<string, unknown>` com narrowing explícito nos pontos de consumo.
- **Segurança de variáveis de ambiente:** Rotação das chaves vazadas acidentalmente versionadas e remoção do arquivo `.env` do cache do Git, impedindo que credenciais sensíveis persistam no histórico do repositório.

## 🚀 Instruções Básicas de Execução

Siga os passos abaixo para executar a aplicação localmente no seu ambiente de desenvolvimento.

**Pré-requisitos:** É necessário ter o [Node.js e npm](https://nodejs.org/) instalados na sua máquina.

**Passo 1: Clone o repositório**
```sh
git clone https://github.com/vitorr0801/saas-barbearia.git
```

**Passo 2: Acesse a pasta do projeto e instale as dependências**
```sh
cd saas-barbearia
npm install
```

**Passo 3: Configure as variáveis de ambiente**
Crie um arquivo `.env.local` na raiz do projeto e adicione as credenciais do Supabase.

> **Nota de Segurança:** Por boas práticas, as credenciais do banco de dados oficial não são versionadas no repositório. Para testar a aplicação, solicite as chaves de acesso aos mantenedores do projeto ou crie o seu próprio projeto no Supabase e insira as suas credenciais abaixo.

```env
VITE_SUPABASE_PROJECT_ID=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_LOCATIONIQ_TOKEN=
```

**Passo 4: Inicie o servidor local**
```sh
npm run dev
```
