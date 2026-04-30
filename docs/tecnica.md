# Documentação Técnica - BarberPro

## 1. Arquitetura da Solução e Stack Tecnológica

A arquitetura do MVP foi desenhada com foco em escalabilidade e desempenho computacional.

- **Frontend:** Utiliza React como interface reativa, estruturada como uma Single Page Application (SPA) para alta performance, baseada em um Design System Modular.
- **Backend:** Arquitetura BaaS (Backend as a Service) utilizando Supabase, que provê autenticação integrada e storage para ativos.
- **Banco de Dados:** Utilização de PostgreSQL relacional, focado em integridade referencial e capacidade de processar consultas complexas.

## 2. Tecnologias Utilizadas

- **Frontend:** React, TypeScript, Vite.
- **Estilização:** Tailwind CSS, shadcn/ui.
- **BaaS (Backend as a Service):** Supabase (PostgreSQL).

## 3. Arquitetura e Segurança de Dados

O ecossistema de dados do BarberPro foi projetado para garantir integridade referencial e proteção rigorosa das informações sensíveis, utilizando as capacidades avançadas do PostgreSQL e do Supabase.

**Instruções básicas de instalação e execução**

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
Crie um arquivo `.env` na raiz do projeto e adicione as credenciais do Supabase. 

> **Nota de Segurança:** Por boas práticas, as credenciais do banco de dados oficial não são versionadas no repositório. Para testar a aplicação, solicite as chaves de acesso aos mantenedores do projeto ou crie o seu próprio projeto no Supabase e insira as suas credenciais abaixo.

```env
VITE_SUPABASE_PROJECT_ID=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
VITE_LOCATIONIQ_TOKEN=
```

**Passo 4: Inicie o servidor local**

```sh
npm run dev
```

### Estrutura do Banco de Dados

O esquema relacional em PostgreSQL foi modelado para garantir integridade referencial, suportar consultas complexas e habilitar a escalabilidade do modelo SaaS. A arquitetura é composta pelas seguintes estruturas principais:

**Núcleo de Usuários e Multi-Tenant (SaaS)**

- `**profiles`:** Centraliza a gestão de identidades e permissões, suportando os perfis de administradores, profissionais e clientes finais.
- `**barbearias`:** Tabela âncora do modelo multi-tenant, armazenando os dados institucionais de cada estabelecimento parceiro.
- `**invites`:** Gerencia o fluxo de onboarding e convites seguros para novos membros da equipe ingressarem no sistema.

**Gestão de Serviços e Agendamentos**

- `**services`:** Armazena o catálogo base de serviços oferecidos pelo estabelecimento, incluindo precificação e durações padrão.
- `**barber_services`:** Tabela associativa que relaciona quais profissionais estão habilitados a realizar serviços específicos.
- `**barber_work_hours`:** Controla a grade de horários, turnos e disponibilidade individual de cada profissional, evitando conflitos na agenda.
- `**appointments`:** Tabela de alta transacionalidade que consolida as relações entre clientes, profissionais e serviços, registrando metadados críticos como data, hora, `total_price` e o status do atendimento.

**Fidelização e Motor Geográfico**

- `**user_favorites`:** Permite que clientes finais salvem seus profissionais e estabelecimentos preferidos, fomentando a fidelização sistêmica.
- **Módulo Espacial (PostGIS):** Composto pelas estruturas `geography_columns`, `geometry_columns` e `spatial_ref_sys`, este módulo suporta o motor de geolocalização da plataforma. Isso permite que o sistema priorize a exibição de barbearias na zona de conveniência do cliente (raio estratégico de conversão), otimizando a atração local.

### Mecanismos de Proteção e Governança

A segurança não é uma camada adicional, mas parte integrante da infraestrutura de dados:

- **Row Level Security (RLS) & RBAC:** O sistema implementa políticas de segurança a nível de linha (RLS) para reforçar o Controle de Acesso Baseado em Funções (RBAC). Isso garante que um usuário só tenha visibilidade e poder de edição sobre dados que pertencem ao seu escopo de permissão.
- **Privacidade por Design:** A arquitetura adota princípios de privacidade desde a sua concepção, assegurando que a integridade dos dados seja mantida e protegida contra acessos indevidos entre diferentes perfis e filiais.
- **Consistência Sistêmica:** O uso de funções de agregação diretamente no banco de dados assegura que métricas de Business Intelligence, como o Ticket Médio (AOV), reflitam sempre o estado real das transações.

## 4. Decisões Técnicas e Segurança

- **Row Level Security (RLS):** Implementação de políticas de segurança a nível de linha no Supabase. Isso garante que dados sensíveis de clientes e faturamento sejam acessíveis apenas por usuários autorizados.
- **Validação de Formulários:** Uso de bibliotecas de validação para garantir que dados inconsistentes (como emails inválidos ou senhas fracas) não sejam processados.
- **Consistência de Dados:** Uso de UUIDs e chaves estrangeiras para evitar o armazenamento de dados duplicados ou órfãos na tabela de agendamentos.

## 5. Evidências de Desenvolvimento e Testes

O ciclo de desenvolvimento e a validação do sistema foram documentados de forma contínua para garantir a rastreabilidade, a qualidade do software e a transparência do trabalho em equipe. A aplicação passou por testes manuais de fluxo ponta a ponta, cobrindo desde a criação de conta do cliente até a finalização do checkout pelo administrador.

As evidências concretas da evolução do projeto, testes de funcionalidades e da participação individual dos membros podem ser verificadas diretamente no repositório através das ferramentas de versionamento e gestão:

- **Histórico de Commits:** Registros atômicos e descritivos no GitHub que demonstram a evolução incremental do código, correções de bugs identificados durante os testes e implementação de novas features.
- **Project Dashboard (Issues):** Utilizado para o rastreamento de tarefas, divisão de responsabilidades, relato de erros e acompanhamento do progresso do desenvolvimento.
- **Pull Requests (PRs):** Documentação das integrações de código, evidenciando as revisões e validações feitas antes de incorporar novas funcionalidades à branch principal.

