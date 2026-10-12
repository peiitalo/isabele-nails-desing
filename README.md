# Isa Nails Design - Sistema Completo

Sistema completo de agendamento e gerenciamento para salão de manicure com frontend moderno em **React + Vite** e backend robusto em **Fastify + Prisma ORM + SQLite**.

---

## 🚀 Funcionalidades

### Para Clientes:
- **Página Inicial**: Apresentação dos serviços, diferenciais e informações do salão.
- **Catálogo de Serviços**: Visualização completa de todos os procedimentos disponíveis, com filtros por categoria e status.
- **Sistema de Agendamento**: Fluxo interativo de agendamento com cálculo dinâmico de horários disponíveis em tempo real (respeitando expediente semanal, intervalos de duração e dias especiais).
- **Histórico e Cancelamento**: Visualização dos agendamentos realizados e cancelamento de agendamentos pendentes.
- **Perfil do Cliente**: Gerenciamento de informações pessoais e alteração segura de senha.

### Para Administradores:
- **Dashboard de Gestão**: Métricas em tempo real (faturamento total, agendamentos pendentes/concluídos, agendamentos do dia e clientes ativos).
- **Controle de Agendamentos**: Gestão do status (`PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`), anotações de cancelamento e registro de pagamentos (`PAID`/`UNPAID` via PIX, Dinheiro ou Cartão).
- **Horários de Funcionamento (Semanais)**: Configuração de horários de expediente regulares para cada dia da semana (Domingo a Sábado).
- **Dias Especiais (Exceções)**: Criação de horários customizados ou bloqueios para datas específicas (feriados, horários estendidos) com prioridade sobre a grade semanal.
- **Catálogo de Serviços**: Cadastro, edição de preços/durações e ativação/desativação de serviços.
- **Carteira de Clientes**: Visualização detalhada de clientes cadastrados, histórico de agendamentos e remoção de contas sem agendamentos vinculados.

---

## 🏗️ Arquitetura do Backend (Camadas Limpas)

O backend segue uma arquitetura em camadas bem definida, garantindo baixo acoplamento e alta testabilidade:

$$\text{Routes} \longrightarrow \text{Controllers} \longrightarrow \text{Services} \longrightarrow \text{Models / Repositories} \longrightarrow \text{Prisma ORM}$$

1. **Routes (`src/routes/`)**:
   - Define apenas os caminhos de endpoint HTTP, verbos (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`), schemas de validação Fastify/JSON Schema e middlewares anexados (`fastify.authenticate`, `fastify.adminAuth`).
   - Não contém regras de negócio nem manipulação de banco de dados; apenas delega a execução ao Controller correspondente.

2. **Controllers (`src/controllers/`)**:
   - Responsável pelo transporte HTTP: extração de dados (`req.params`, `req.query`, `req.body`), envio de cookies HTTPOnly, geração de tokens JWT e formatação de respostas.
   - Captura exceções e mapeia instâncias de `AppError` para os respectivos códigos HTTP (400, 401, 403, 404, 500).

3. **Services (`src/services/`)**:
   - Contém **estritamente as regras de negócio e validações de domínio**:
     - Cálculo de disponibilidade de horários (priorização de dias especiais sobre horários semanais, subtração de horários ocupados, validação de duração).
     - Verificação de conflitos de agendamento e regras de cancelamento.
     - Validação de credenciais e criptografia de senhas com `bcryptjs`.
     - Agregação de estatísticas financeiras e operacionais.
   - Não importa o Prisma diretamente; consome os métodos da camada de Models.

4. **Models / Repositories (`src/models/`)**:
   - Camada exclusiva de acesso e persistência de dados.
   - Executa as queries brutas no banco de dados através do `prisma` (`findMany`, `findUnique`, `create`, `update`, `delete`, `count`, `groupBy`).
   - Normaliza tipos de dados (por exemplo, `weekday` como inteiro e `date` como `YYYY-MM-DD`).

5. **Prisma ORM (`src/database/client.js` & `prisma/schema.prisma`)**:
   - Conexão singleton e mapeamento objeto-relacional com o SQLite (`prisma/dev.db`).

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** & **TypeScript** - Interface declarativa e tipada
- **Vite** - Build tool e dev server ultra-rápido (porta 3000)
- **React Router DOM 6** - Roteamento client-side
- **Tailwind CSS** - Estilização utilitária e responsiva
- **FullCalendar** - Visualização de calendário e agendas
- **Framer Motion** - Transições e animações de interface
- **Lucide React** - Biblioteca de ícones
- **React Hook Form** - Controle de formulários
- **React Hot Toast** - Notificações toast
- **Date-fns** - Utilitários de manipulação de datas

### Backend
- **Node.js (ES Modules)** - Runtime JavaScript moderno
- **Fastify 5** - Framework HTTP de alta performance
- **Prisma ORM 5** - Modelagem e manipulação do banco de dados
- **SQLite** - Banco de dados relacional leve e autocontido
- **@fastify/jwt** & **@fastify/cookie** - Autenticação segura via cookies HTTPOnly
- **@fastify/cors** - Gerenciamento de CORS
- **bcryptjs** - Hashing e validação de senhas com salt
- **Vitest 4** - Framework de testes unitários e de integração

---

## 📁 Estrutura do Projeto

```
├── frontend/                   # Aplicação Frontend React + Vite
│   ├── src/
│   │   ├── components/         # Componentes reutilizáveis
│   │   ├── contexts/           # Contextos React (AuthContext)
│   │   ├── layouts/            # Layouts (AdminLayout, ClientLayout)
│   │   ├── pages/              # Páginas da aplicação
│   │   │   ├── admin/          # Dashboard, Agendamentos, Horários, Dias Especiais
│   │   │   └── client/         # Início, Serviços, Agendamento, Perfil
│   │   ├── services/           # Comunicação com a API (api.js)
│   │   ├── types/              # Definições de tipos TypeScript
│   │   ├── App.tsx             # Definição de rotas
│   │   └── main.tsx            # Ponto de entrada
│   └── package.json
├── backend/                    # API Backend Fastify + Prisma
│   ├── prisma/
│   │   ├── schema.prisma       # Definição dos modelos do banco
│   │   └── dev.db              # Banco de dados SQLite local
│   ├── src/
│   │   ├── controllers/        # Controladores HTTP (req, res, JWT)
│   │   ├── database/           # Conexão Prisma e script de seed
│   │   ├── errors/             # Tratamento de erros de domínio
│   │   ├── middleware/         # Middlewares de autenticação e autorização
│   │   ├── models/             # Camada de Model / Repositório (queries Prisma)
│   │   ├── routes/             # Definições de rotas Fastify e schemas
│   │   ├── services/           # Regras de negócio puras
│   │   └── server.js           # Inicialização e configuração do servidor Fastify
│   ├── tests/                  # Testes automatizados (150 testes passando)
│   │   ├── helpers/            # Helpers de setup do Fastify e seed de teste
│   │   ├── routes/             # Testes de integração de endpoints
│   │   └── services/           # Testes unitários com Models mockados
│   ├── package.json
│   └── vitest.config.js
├── README.md                   # Documentação e arquitetura do projeto
└── SETUP.md                    # Guia de instalação, execução e testes
```

---

## 🔌 API Endpoints

Base URL: `http://localhost:3333/api`

### 1. Autenticação (`/api/auth`)
| Método | Endpoint | Proteção | Descrição |
|---|---|---|---|
| `POST` | `/api/auth/login` | Público | Autentica usuário e define cookie `token` |
| `POST` | `/api/auth/register` | Público | Registra novo cliente e autentica |
| `GET` | `/api/auth/me` | Autenticado | Retorna os dados do perfil logado |

### 2. Serviços (`/api/services`)
| Método | Endpoint | Proteção | Descrição |
|---|---|---|---|
| `GET` | `/api/services` | Público | Lista serviços (filtros: `?category=`, `?isActive=`) |
| `GET` | `/api/services/:id` | Público | Retorna detalhes de um serviço |
| `POST` | `/api/services` | Admin | Cria novo serviço no catálogo |
| `PUT` | `/api/services/:id` | Admin | Atualiza dados de um serviço |
| `DELETE` | `/api/services/:id` | Admin | Remove serviço do catálogo |
| `GET` | `/api/services/stats/overview` | Admin | Estatísticas de serviços cadastrados |

### 3. Agendamentos & Disponibilidade (`/api/bookings`)
| Método | Endpoint | Proteção | Descrição |
|---|---|---|---|
| `GET` | `/api/bookings` | Autenticado | Lista agendamentos (cliente vê os seus; admin vê todos) |
| `GET` | `/api/bookings/:id` | Autenticado | Detalhes de um agendamento específico |
| `POST` | `/api/bookings` | Autenticado | Cria agendamento (`PENDING` p/ cliente, `CONFIRMED` p/ admin) |
| `PATCH` | `/api/bookings/:id/status` | Admin | Atualiza status (`PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`) |
| `PATCH` | `/api/bookings/:id/notes` | Admin | Atualiza anotações ou motivo do cancelamento |
| `PATCH` | `/api/bookings/:id/payment` | Admin | Registra pagamento (`PAID`/`UNPAID` e `PIX`/`CASH`/`CARD`) |
| `DELETE` | `/api/bookings/:id` | Autenticado | Cancela agendamento (cliente apenas os próprios `PENDING`) |
| `GET` | `/api/bookings/availability/:date` | Público | Calcula slots disponíveis para uma data |
| `GET` | `/api/bookings/availability` | Público | Suporta consulta por query params (`?date=YYYY-MM-DD&serviceId=...`) |
| `GET` | `/api/bookings/stats/dashboard` | Admin | Estatísticas do dashboard de agendamentos |
| `GET` | `/api/bookings/working-hours` | Admin | Lista horários de expediente regulares |
| `POST` | `/api/bookings/working-hours` | Admin | Cadastra horário de funcionamento semanal |
| `PUT` | `/api/bookings/working-hours/:id` | Admin | Atualiza horário de funcionamento semanal |
| `DELETE` | `/api/bookings/working-hours/:id` | Admin | Deleta horário de funcionamento semanal |
| `GET` | `/api/bookings/special-days` | Admin | Lista dias especiais e feriados |
| `POST` | `/api/bookings/special-days` | Admin | Cria dia especial com horários customizados |
| `PUT` | `/api/bookings/special-days/:id` | Admin | Atualiza dia especial |
| `DELETE` | `/api/bookings/special-days/:id` | Admin | Deleta dia especial |

### 4. Usuários (`/api/users`)
| Método | Endpoint | Proteção | Descrição |
|---|---|---|---|
| `GET` | `/api/users` | Admin | Lista usuários (filtros: `?role=`, `?search=`) |
| `GET` | `/api/users/:id` | Autenticado | Perfil e histórico (cliente vê o seu; admin vê qualquer) |
| `PUT` | `/api/users/:id` | Autenticado | Atualiza nome, email ou telefone |
| `PATCH` | `/api/users/:id/password` | Autenticado | Altera senha mediante verificação da senha atual |
| `DELETE` | `/api/users/:id` | Admin | Deleta usuário (bloqueado se possuir agendamentos) |
| `GET` | `/api/users/stats/overview` | Admin | Estatísticas gerais de usuários e receita |

---

## 🗄️ Banco de Dados

O banco relacional **SQLite** opera através do **Prisma ORM** com as seguintes tabelas:

- **users**: Contas de usuários com roles `ADMIN` ou `CLIENT`, dados de contato e senha criptografada.
- **services**: Catálogo de serviços com nome, descrição, preço, duração (minutos) e categoria (`MANICURE`, `PEDICURE`, `ESMALTACAO`, `DECORACAO`).
- **bookings**: Agendamentos com relacionamento para cliente e serviço, data (`YYYY-MM-DD`), horário (`HH:MM`), status e dados de pagamento.
- **working_hours**: Configurações de horários de trabalho recorrentes por dia da semana (`weekday`: 0 = Domingo a 6 = Sábado).
- **special_days**: Exceções de datas específicas com horários customizados de início e fim.

---

## 🧪 Testes Automatizados

O projeto conta com uma suíte abrangente de **150 testes automatizados** passando via Vitest:
- **Testes Unitários de Serviços (`tests/services/`)**: Testam isoladamente as regras de negócio de autenticação, usuários, serviços e agendamentos com mocks dos Models.
- **Testes de Integração de Rotas (`tests/routes/`)**: Validam todo o fluxo de transporte HTTP, autenticação por cookies/JWT, validação de payloads e persistência em banco SQLite de teste.

---

## 📖 Instruções de Instalação e Execução

Para o passo a passo completo de instalação, configuração do banco de dados, execução local, credenciais de teste e solução de problemas, consulte o [**Guia de Configuração (SETUP.md)**](SETUP.md).

---

Desenvolvido para o **Isa Nails Design**.
