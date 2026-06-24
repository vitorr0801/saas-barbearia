# Documentação Negocial - BarberPro

## 1. Problema e Oportunidade
O setor de barbearias enfrenta desafios críticos de organização devido ao uso de métodos analógicos (agendas de papel) ou informais (WhatsApp). Isso resulta em:
* **Conflitos de agenda:** Marcações duplicadas ou esquecidas.
* **No-show:** Alta taxa de desistência sem aviso prévio.
* **Falta de métricas:** Dificuldade em visualizar o faturamento real e o desempenho da equipe.

O BarberPro surge como uma oportunidade de digitalizar esse ecossistema, transformando a gestão manual em um fluxo automatizado e profissional.

## 2. Público-Alvo e Controle de Acesso Baseado em Funções (RBAC)
O sistema opera com visões distintas para maximizar a utilidade de cada perfil de usuário:
* **Visão do Gestor:** Profissionais que necessitam de acesso total à gestão de estoque e suprimentos, configuração de taxas/comissões e acompanhamento global da equipe e agendamentos.
* **Visão do Operador (Barbeiros):** Foco na gestão de agendamentos pessoais, visualização de performance individual, extrato de comissões próprias e uma interface simplificada de atendimento.
* **Clientes:** Desejam autonomia para agendar serviços 24/7, sem a necessidade de ligações ou espera por respostas em chats.

## 3. Benefícios da Solução e Proposta de Valor
A eficácia no modelo SaaS do BarberPro foca na eficiência operacional como motor de crescimento para o parceiro. Os principais benefícios incluem:
* **Setup Simplificado:** Redução do tempo de configuração inicial através de um fluxo de onboarding guiado, que permite ao gestor cadastrar a barbearia, os serviços e a equipe em poucos passos.
* **Maximização da Taxa de Ocupação:** A conexão em tempo real reduz janelas ociosas na agenda dos profissionais, permitindo que clientes visualizem e ocupem horários disponíveis de forma autônoma.
* **Escalabilidade do Usuário:** Interface intuitiva que permite a adesão imediata de profissionais, reduzindo a curva de aprendizado e o turnover causado pela dificuldade de uso de ferramentas complexas.
* **Fidelização Sistêmica:** Funcionalidade de favoritos que conecta o cliente ao seu profissional preferido, incentivando o retorno orgânico.

## 4. Contexto de Uso
O sistema foi projetado para se adaptar à realidade ágil e movimentada de uma barbearia:
* **Na Cadeira (O Barbeiro):** Acessa a agenda majoritariamente pelo smartphone. No intervalo de 2 minutos entre um corte e outro, ele puxa o celular para ver o nome do próximo cliente e o serviço que deverá realizar.
* **No Balcão (A Recepção ou o Dono):** Utiliza um computador para registrar clientes que chegam de surpresa (walk-ins), atualizar o status dos serviços para "concluído", realizar o checkout e gerenciar o caixa do dia.
* **Reserva Antecipada (O Cliente):** Acessa o sistema de casa, do trabalho ou pelo celular, tendo autonomia para visualizar os horários livres e realizar seu próprio agendamento, sem precisar esperar o barbeiro responder no WhatsApp.

## 5. Roadmap de Evolução Futura

As funcionalidades abaixo representam a visão de longo prazo do produto — o próximo passo natural após a consolidação do MVP. Elas não fazem parte da entrega atual, mas orientam as decisões arquiteturais tomadas hoje para que a evolução seja incremental e não exija reescrita.

* **Geolocalização Hiperlocal:** Integração de um motor de busca geoespacial (via PostGIS ou serviço externo) para priorizar a exibição de barbearias dentro da zona de conveniência do cliente, aumentando a probabilidade de agendamento imediato.
* **Dashboards de BI para o Gestor:** Painéis analíticos com métricas de ticket médio (AOV), taxa de retenção de clientes, desempenho por profissional e custo de aquisição de cliente (CAC), dando ao gestor visibilidade estratégica sobre o negócio.
