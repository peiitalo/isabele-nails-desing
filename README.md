# Isa Nails Design - Sistema Completo

Sistema completo de agendamento para salão de manicure com frontend React + Vite e backend Fastify + Prisma.

## 🚀 Funcionalidades

### Para Clientes:
- **Página Inicial**: Apresentação dos serviços e informações do salão
- **Catálogo de Serviços**: Visualização de todos os serviços disponíveis com filtros
- **Sistema de Agendamento**: Interface intuitiva para agendar horários
- **Perfil do Cliente**: Gerenciamento de informações pessoais e histórico de agendamentos

### Para Administradores:
- **Dashboard**: Visão geral com estatísticas do negócio
- **Gerenciamento de Agendamentos**: Controle completo dos horários marcados
- **Gestão de Serviços**: Cadastro, edição e remoção de serviços
- **Base de Clientes**: Visualização e gerenciamento da carteira de clientes

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** - Biblioteca JavaScript para interfaces
- **TypeScript** - Tipagem estática para JavaScript
- **Vite** - Build tool e dev server
- **React Router DOM** - Roteamento da aplicação
- **Tailwind CSS** - Framework CSS utilitário
- **Lucide React** - Ícones modernos
- **React Hook Form** - Gerenciamento de formulários
- **React Hot Toast** - Notificações toast
- **Date-fns** - Manipulação de datas

### Backend
- **Fastify** - Framework web rápido e eficiente
- **Prisma** - ORM moderno para Node.js
- **SQLite** - Banco de dados leve e rápido
- **JWT** - Autenticação baseada em tokens
- **bcryptjs** - Criptografia de senhas
- **CORS** - Cross-Origin Resource Sharing

## 📦 Instalação

### Frontend

1. Clone o repositório:
```bash
git clone [url-do-repositorio]
cd isa-nails-design
```

2. Instale as dependências:
```bash
npm install
```

3. Execute o projeto em modo de desenvolvimento:
```bash
npm run dev
```

4. Acesse a aplicação em `http://localhost:3000`

### Backend

1. Navegue para a pasta do backend:
```bash
cd backend
```

2. Instale as dependências:
```bash
npm install
```

3. Configure o banco de dados:
```bash
# Gerar cliente Prisma
npm run db:generate

# Criar tabelas no banco
npm run db:push

# Popular banco com dados iniciais
npm run db:seed
```

4. Inicie o servidor:
```bash
# Desenvolvimento (com hot reload)
npm run dev

# Produção
npm start
```

5. O backend estará rodando em `http://localhost:3333`

## 🔐 Credenciais de Teste

### Administrador:
- **Email**: admin@isa.com
- **Senha**: admin123

### Cliente:
- **Email**: cliente@teste.com
- **Senha**: cliente123

## 📁 Estrutura do Projeto

```
├── src/                    # Frontend
│   ├── components/         # Componentes reutilizáveis
│   ├── contexts/           # Contextos React (AuthContext)
│   ├── layouts/            # Layouts das páginas
│   ├── pages/              # Páginas da aplicação
│   │   ├── admin/          # Páginas do administrador
│   │   └── client/         # Páginas do cliente
│   ├── services/           # Serviços de API
│   ├── types/              # Definições TypeScript
│   ├── App.tsx             # Componente principal
│   ├── main.tsx            # Ponto de entrada
│   └── index.css           # Estilos globais
├── backend/                # Backend
│   ├── prisma/             # Schema e banco de dados
│   ├── src/
│   │   ├── database/       # Cliente Prisma e seed
│   │   ├── middleware/     # Middlewares de autenticação
│   │   ├── routes/         # Rotas da API
│   │   └── server.js       # Servidor principal
│   └── package.json
└── README.md
```

## 🔌 API Endpoints

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `GET /api/auth/me` - Dados do usuário atual

### Serviços
- `GET /api/services` - Listar serviços
- `POST /api/services` - Criar serviço (admin)
- `PUT /api/services/:id` - Atualizar serviço (admin)
- `DELETE /api/services/:id` - Deletar serviço (admin)

### Agendamentos
- `GET /api/bookings` - Listar agendamentos
- `POST /api/bookings` - Criar agendamento
- `PATCH /api/bookings/:id/status` - Atualizar status (admin)
- `DELETE /api/bookings/:id` - Cancelar agendamento
- `GET /api/bookings/availability/:date` - Horários disponíveis

### Usuários
- `GET /api/users` - Listar usuários (admin)
- `PUT /api/users/:id` - Atualizar usuário
- `PATCH /api/users/:id/password` - Alterar senha

## 🗄️ Banco de Dados

O sistema usa SQLite com Prisma ORM. O banco é criado automaticamente e populado com dados de exemplo.

### Tabelas
- **Users** - Usuários (admin e clientes)
- **Services** - Serviços oferecidos
- **Bookings** - Agendamentos

## 🎨 Design System

O projeto utiliza um design system consistente com:

- **Cores Primárias**: Rosa (#ec4899) e Azul (#0ea5e9)
- **Tipografia**: Inter (sistema)
- **Componentes**: Cards, botões, inputs padronizados
- **Responsividade**: Design mobile-first

## 🔧 Scripts Disponíveis

### Frontend
- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Gera build de produção
- `npm run preview` - Visualiza o build de produção
- `npm run lint` - Executa o linter

### Backend
- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm start` - Inicia o servidor de produção
- `npm run db:generate` - Gera cliente Prisma
- `npm run db:push` - Sincroniza schema com banco
- `npm run db:seed` - Popula banco com dados iniciais
- `npm run db:studio` - Abre Prisma Studio

## 📱 Responsividade

O sistema é totalmente responsivo e funciona em:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (até 767px)

## 🔐 Autenticação

O sistema usa JWT para autenticação. Os tokens são armazenados no localStorage e enviados automaticamente nas requisições.

## 🚀 Deploy

### Frontend
```bash
npm run build
```

### Backend
```bash
cd backend
npm start
```

## 📄 Licença

Este projeto está sob a licença MIT.

## 👥 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

Para dúvidas ou suporte, entre em contato através dos canais disponíveis.

---

Desenvolvido com ❤️ para o Isa Nails Design 