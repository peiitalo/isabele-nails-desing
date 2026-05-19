# Sugestões de Melhorias — Isa Nails Design

> Relatório gerado em 2026-04-06 após revisão completa do backend e frontend.

---

## 1. Agendamento e Calendário

### 1.1 Visualização de disponibilidade no admin
- **Problema:** O calendário admin (Calendar.tsx) mostra apenas agendamentos `CONFIRMED`, ocultando pendentes, concluídos e cancelados.
- **Sugestão:** Permitir filtrar por status no calendário com cores diferentes para cada um.

### 1.2 Verificação de conflitos ao criar pelo admin
- **Problema:** Quando a admin cria um agendamento pelo modal em Bookings.tsx, não há verificação de disponibilidade ou conflito de horário.
- **Sugestão:** Reutilizar a lógica de `availability/:date` antes de confirmar um agendamento admin.

### 1.3 Lista de espera para dias lotados
- **Problema:** Clientes não sabem quando um dia/horário vai abrir.
- **Sugestão:** Criar um sistema de waitlist onde o cliente pode solicitar um horário desejado e ser notificado se liberar.

### 1.4 Agendamentos recorrentes
- **Problema:** Cliente que quer reservar o mesmo horário toda semana precisa agendar manualmente a cada vez.
- **Sugestão:** Permitir agendamento recorrente (semanal, quinzenal, mensal) com opção de definir data de término.

---

## 2. Gestão Financeira

### 2.1 Pagamento parcial / sinal
- **Problema:** Não há suporte para depósito antecipado ou sinal.
- **Sugestão:** Adicionar campo `depositAmount` no Booking com status de pagamento parcial (UNPAID → PARTIAL → PAID).

### 2.2 Relatórios financeiros
- **Problema:** Não há relatórios de receita mensal, serviço mais lucrativo, ticket médio, etc.
- **Sugestão:** Criar endpoint `/api/bookings/stats/reports` com:
  - Receita por mês/gráfico
  - Top serviços por faturamento
  - Ticket médio por serviço
  - Comparativo mês a mês

### 2.3 Query de receita otimizada no banco
- **Problema:** O cálculo de receita nos endpoints de stats (services.js, bookings.js, users.js) busca TODOS os agendamentos `COMPLETED` e calcula em memória com `.reduce()`. O mesmo cálculo está duplicado em 3 lugares.
- **Sugestão:** Usar `prisma.booking.aggregate()` no banco e centralizar em uma função utilitária.

---

## 3. Perfil e Histórico do Cliente

### 3.1 Histórico de serviços por agendamento
- **Problema:** Não há registro do que foi feito em cada visita (design, cor, preferência).
- **Sugestão:** Criar um campo `workNotes` ou modelo `ServiceRecord` vinculado ao Booking com: foto do resultado, cor usada, design, observações.

### 3.2 Preferências do cliente
- **Problema:** Não há como registrar preferências (cor favorita, formato de unha, alergias).
- **Sugestão:** Adicionar tabela `ClientPreferences` com campos: `favoriteColors`, `nailShape`, `allergies`, `notes`.

### 3.3 Correção: troca de senha no perfil do cliente
- **Problema:** Em `Profile.tsx:96`, `changePassword` é chamado com string vazia como `currentPassword`. O backend valida e rejeita sempre.
- **Sugestão:** Adicionar campo "senha atual" no formulário de troca de senha.

### 3.4 Edição de cliente pelo admin (hoje é stub)
- **Problema:** Em `Clients.tsx:74-78`, `handleEdit` apenas mostra um toast — não abre formulário nem chama a API.
- **Sugestão:** Implementar modal de edição de cliente com nome, telefone, e-mail e preferências.

---

## 4. Comunicação e Notificações

### 4.1 Lembretes automáticos
- **Problema:** Não há lembretes de agendamento (e-mail, SMS ou WhatsApp).
- **Sugestão:** Implementar job agendado (cron) que envia lembrete 24h e 1h antes. Integração com WhatsApp Business API ou Twilio.

### 4.2 Número do WhatsApp hardcoded
- **Problema:** Em `Home.tsx`, o número `5588994158452` está hardcoded.
- **Sugestão:** Mover para variável de ambiente ou tabela de configurações editável pelo admin.

### 4.3 Notificações push no cliente
- **Problema:** Apenas o admin recebe notificações. O cliente não é avisado quando um agendamento é confirmado/cancelado.
- **Sugestão:** Adicionar notificação browser/WhatsApp para o cliente quando o status mudar.

---

## 5. Portfólio e Visual

### 5.1 Galeria de fotos / portfólio
- **Problema:** Não há seção para mostrar trabalhos anteriores.
- **Sugestão:** Criar modelo `Portfolio` (id, imageUrl, description, serviceId, tags, createdAt) com página pública no frontend para o cliente ver exemplos.

### 5.2 Depoimentos / avaliações
- **Problema:** Clientes não podem avaliar o serviço após conclusão.
- **Sugestão:** Adicionar tabela `Review` (id, bookingId, rating 1-5, comment) exibida na Home.

---

## 6. Funcionalidades do Admin

### 6.1 Suporte a múltiplas profissionais
- **Problema:** O sistema tem apenas um perfil ADMIN — não suporta mais de uma manicure.
- **Sugestão:** Adicionar campo `technicianId` em Booking e modelo `Technician` para salões com mais de uma profissional.

### 6.2 Dashboard com KPIs visuais
- **Problema:** O dashboard mostra números básicos sem visualização gráfica.
- **Sugestão:** Adicionar gráficos (Chart.js / Recharts) com: agendamentos por dia da semana, receita mensal, serviços mais populares.

### 6.3 Relatorio de cancelamentos
- **Problema:** Não há análise de cancelamentos (quantos, por quê, quem mais cancela).
- **Sugestão:** Endpoint que agrupa cancelamentos por motivo e cliente.

---

## 7. Performance e Escala

### 7.1 Paginação em listas
- **Problema:** Agendamentos, clientes e serviços carregam tudo de uma vez sem paginação.
- **Sugestão:** Adicionar `?page=&limit=` nos endpoints e paginação no frontend.

### 7.2 Índices no banco
- **Sugestão:** Verificar índices em campos frequentemente filtrados: `Booking.date`, `Booking.status`, `User.email`, `Service.category`.

### 7.3 Datas como string
- **Problema:** Datas são armazenadas como string `YYYY-MM-DD` em vez de `DateTime`. Perde suporte a queries nativas de intervalo no Prisma.
- **Sugestão:** Migrar para `DateTime` no schema do Prisma.

---

## 8. Segurança

### 8.1 Proteção contra força bruta no login
- **Problema:** Sem rate limiting nas rotas de autenticação.
- **Sugestão:** Adicionar `@fastify/rate-limit` com limite de tentativas por IP.

### 8.2 JWT secret hardcoded
- **Problema:** Em `server.js:55`, secret fallback é `'isa-nails-secret-key-change-in-production'`.
- **Sugestão:** Tornar `JWT_SECRET` obrigatório via variável de ambiente. Falhar se não definido.

### 8.3 Zod não está sendo usado para validação
- **Problema:** Zod está listado em `package.json` mas não é importado em nenhuma rota. Validação usa apenas schema do Fastify.
- **Sugestão:** Padronizar com Zod ou remover a dependência não usada.

### 8.4 Expiração do cookie JWT
- **Problema:** O cookie httpOnly não tem expiração explícita configurada.
- **Sugestão:** Definir `maxAge` adequado (ex: 7 dias).

---

## 9. Frontend — Bugs e Melhorias UX

### 9.1 Testes insuficientes
- **Problema:** Apenas 1 teste no frontend (Booking.test.tsx) vs 76 no backend.
- **Sugestão:** Adicionar testes para fluxos críticos: login, criação de agendamento, profile, admin dashboard.

### 9.2 Importação faltando em services.test.js
- **Problema:** `beforeEach` é usado mas não importado do vitest.
- **Sugestão:** Adicionar `beforeEach` no import de `services.test.js`.

### 9.3 Responsividade em telas pequenas
- **Sugestão:** Testar todas as páginas admin/em tablet e mobile para garantir usabilidade.

### 9.4 Loading states e skeletons
- **Sugestão:** Adicionar skeleton loaders em listas e tabelas para melhor percepção de performance.

### 9.5 Feedback de erro mais claro
- **Sugestão:** Centralizar tratamento de erros da API e exibir mensagens amigáveis ao invés de texto técnico.

---

## Priorização Sugerida

| Prioridade | Itens | Impacto |
|------------|-------|---------|
| **Alta** | 3.3 (fix troca de senha quebrada), 3.4 (fix edição de cliente stub), 8.1 (rate limiting), 4.1 (lembretes), 3.1 (histórico de serviços) | Corrige bugs reais + funcionalidades mais úteis |
| **Média** | 2.1 (pagamento parcial), 5.1 (portfólio), 6.1 (múltiplas profissionais), 2.2 (relatórios financeiros), 1.2 (conflito admin), 1.4 (recorrência) | Diferenciais competitivos |
| **Baixa** | 5.2 (avaliações), 1.3 (lista de espera), 7.2 (índices), 7.3 (DateTime), 9.4 (skeletons) | Nice-to-have para escala futura |
