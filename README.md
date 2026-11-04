# Renovo Workshop - Sistema de Gestão de Oficina

Sistema completo de gerenciamento para oficinas mecânicas, desenvolvido com ASP.NET Core, React e SQLite.

## 🚀 Funcionalidades

### Backend (API REST)
- ✅ Autenticação JWT com níveis de acesso
- ✅ Autorização baseada em permissões
- ✅ Dashboard gerencial com estatísticas em tempo real
- ✅ Gestão de Clientes
- ✅ Gestão de Veículos
- ✅ Ordem de Serviço completa com fluxo de status
- ✅ Checklist Digital de entrada
- ✅ Controle de Estoque
- ✅ Gestão de Fornecedores
- ✅ Pedidos de Compra
- ✅ Gestão de Usuários
- ✅ Integração com WhatsApp Business API
- ✅ SignalR para atualizações em tempo real
- ✅ AutoMapper para DTOs
- ✅ Entity Framework Core com SQLite

### Frontend (React)
- ✅ Interface moderna e responsiva
- ✅ Sistema de login e autenticação
- ✅ Dashboard interativo
- ✅ Menu lateral com permissões por perfil
- ✅ Páginas para todos os módulos
- ✅ Design profissional com Bootstrap-like CSS

## 📋 Perfis de Usuário

1. **Administrador** - Acesso total
2. **Gerente** - Gerenciamento de operações
3. **Recepção** - Atendimento e cadastros
4. **Mecânico** - Ordens de serviço e checklists
5. **Almoxarifado** - Estoque e compras
6. **Cliente** - (Futuro) Acompanhamento de OS

## 🛠️ Tecnologias Utilizadas

### Backend
- ASP.NET Core 8.0
- Entity Framework Core 8.0
- SQLite
- AutoMapper
- SignalR
- JWT Authentication
- BCrypt para criptografia
- Swagger/OpenAPI

### Frontend
- React 17
- TypeScript
- React Router DOM
- CSS3 (Grid, Flexbox)
- Fetch API

## 📦 Estrutura do Projeto

```
renovo-centro-automotivo-website/
├── backend/
│   ├── RenovoWorkshop.Api/           # API REST
│   │   ├── Controllers/              # Controllers da API
│   │   ├── DTOs/                     # Data Transfer Objects
│   │   ├── Hubs/                     # SignalR Hubs
│   │   ├── Mapping/                  # AutoMapper Profiles
│   │   └── Program.cs                # Configuração da aplicação
│   ├── RenovoWorkshop.Application/   # Camada de aplicação
│   ├── RenovoWorkshop.Domain/        # Entidades e regras de negócio
│   ├── RenovoWorkshop.Infrastructure/# Repositórios e serviços
│   └── RenovoWorkshop.Tests/         # Testes unitários
├── src/
│   ├── components/                   # Componentes React
│   ├── pages/                        # Páginas da aplicação
│   ├── hooks/                        # Custom hooks
│   ├── services/                     # Serviços de API
│   ├── styles/                       # Arquivos CSS
│   └── App.tsx                       # Componente principal
└── README.md
```

## 🔧 Configuração e Instalação

### Pré-requisitos
- .NET 8.0 SDK
- Node.js 16+
- npm ou yarn

### Backend

1. Navegue até a pasta do backend:
```bash
cd backend
```

2. Restaure os pacotes:
```bash
dotnet restore
```

3. A aplicação já possui banco de dados SQLite configurado. Para recriar:
```bash
dotnet ef database update --project RenovoWorkshop.Infrastructure --startup-project RenovoWorkshop.Api
```

4. Execute a API:
```bash
cd RenovoWorkshop.Api
dotnet run
```

A API estará disponível em: `https://localhost:5001` ou `http://localhost:5000`

5. Acesse o Swagger para testar os endpoints:
```
https://localhost:5001/swagger
```

### Frontend

1. Navegue até a pasta do frontend:
```bash
cd src
```

2. Instale as dependências:
```bash
npm install
```

3. Execute o projeto:
```bash
npm start
```

O frontend estará disponível em: `http://localhost:3000`

## 🔐 Credenciais de Acesso

**Usuário Administrador (padrão):**
- Usuário: `admin`
- Senha: `<senha-do-ambiente-local>`

## 📊 Módulos do Sistema

### 1. Dashboard
- Visão geral de veículos por status
- Estatísticas de serviços
- Alertas de estoque baixo
- Ranking de serviços mais executados
- Faturamento total

### 2. Clientes
- Cadastro completo de clientes
- Histórico de atendimentos
- Busca por nome, CPF/CNPJ ou telefone
- Integração com WhatsApp

### 3. Veículos
- Cadastro de veículos
- Histórico de manutenções
- Vínculo com clientes
- Controle de quilometragem

### 4. Ordens de Serviço
- Criação de OS com número automático
- Fluxo completo de status
- Anexação de checklist
- Controle de peças e serviços
- Aprovação de orçamento
- Integração com WhatsApp

### 5. Checklist Digital
- Registro completo do estado do veículo
- Checklist detalhado de itens
- Anexo de fotos
- Registro de GPS
- Histórico de avarias

### 6. Estoque
- Cadastro de peças, óleos, filtros
- Controle de quantidade mínima
- Alertas de estoque baixo
- Categorização de itens
- Controle de fornecedores

### 7. Fornecedores
- Cadastro de fornecedores
- Histórico de pedidos
- Dados de contato

### 8. Pedidos de Compra
- Criação de pedidos
- Controle de status
- Acompanhamento de entrega
- Vinculação com fornecedores

### 9. Usuários
- Gestão de usuários do sistema
- Controle de perfis e permissões
- Ativação/desativação de contas

## 🔔 Integração WhatsApp

O sistema possui integração preparada para WhatsApp Business API:
- Envio automático de mensagens ao alterar status da OS
- Notificações de aprovação de orçamento
- Alertas de conclusão de serviço
- Registro de todas as mensagens enviadas

**Configuração:**
Edite o arquivo `appsettings.json` na API:
```json
{
  "WhatsApp": {
    "IsEnabled": true,
    "ApiUrl": "sua-url-da-api",
    "ApiToken": "seu-token",
    "From": "seu-numero"
  }
}
```

## 🔄 Fluxo de Status da Ordem de Serviço

1. Recebido
2. Checklist realizado
3. Em diagnóstico
4. Orçamento elaborado
5. Aguardando aprovação
6. Aprovado
7. Aguardando peças
8. Peças recebidas
9. Em manutenção
10. Montagem
11. Testes
12. Lavagem
13. Pronto para retirada
14. Entregue
15. Cancelado

Cada alteração de status:
- Registra data e hora
- Identifica o usuário responsável
- Gera histórico completo
- Envia notificação via WhatsApp (se configurado)

## 📱 API para Aplicativo Mobile

Toda a funcionalidade do sistema está disponível via API REST, permitindo o desenvolvimento de aplicativos mobile (Android/iOS) que consomem os mesmos endpoints.

### Endpoints Principais

- `POST /api/Auth/login` - Login
- `GET /api/Dashboard` - Estatísticas
- `GET /api/Customers` - Listar clientes
- `POST /api/Customers` - Criar cliente
- `GET /api/Vehicles` - Listar veículos
- `POST /api/Vehicles` - Criar veículo
- `GET /api/ServiceOrders` - Listar ordens
- `POST /api/ServiceOrders` - Criar ordem
- `PATCH /api/ServiceOrders/{id}/status` - Alterar status
- `GET /api/Checklists` - Listar checklists
- `POST /api/Checklists` - Criar checklist
- `GET /api/Inventory` - Listar estoque
- `GET /api/Suppliers` - Listar fornecedores
- `GET /api/PurchaseOrders` - Listar pedidos
- `GET /api/Users` - Listar usuários

## 🎯 Próximos Passos

- [ ] Implementar página de aprovação de orçamento pública
- [ ] Adicionar upload de fotos
- [ ] Implementar impressão de OS
- [ ] Adicionar gráficos avançados no dashboard
- [ ] Implementar relatórios
- [ ] Adicionar backup automático
- [ ] Implementar app mobile (React Native/Flutter)

## 📝 Licença

MIT License

## 👨‍💻 Desenvolvido por

Renovo Workshop - Sistema de Gestão de Oficina

---

**Versão:** 1.0.0  
**Data:** Julho 2026