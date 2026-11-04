# 🚗 Renovo Workshop - Guia Rápido de Correção e Execução

## ✅ Problemas Resolvidos

### 1. **Erro de Acesso Admin** - CORRIGIDO
**Problema:** O backend não retornava as permissões do usuário no login, causando erro de acesso.

**Solução aplicada:**
- ✅ Modificado `AuthController.cs` para retornar permissões baseadas na role do usuário
- ✅ Usuário admin agora tem todas as permissões automaticamente

**Arquivo modificado:** `backend/RenovoWorkshop.Api/Controllers/AuthController.cs`

### 2. **Layout do Menu** - VERIFICADO
**Status:** O layout está correto, mas se precisar de ajustes visuais, edite:
- `src/components/Layout.tsx` - estrutura do menu
- `src/styles/Layout.css` - estilos do menu

### 3. **CORS Configurado** - CORRIGIDO
**Problema:** App mobile não conseguia acessar a API.

**Solução aplicada:**
- ✅ Adicionadas origens CORS para mobile (localhost, 192.168.*, 10.0.*)
- ✅ Configurado para permitir acesso de qualquer dispositivo na rede local

**Arquivo modificado:** `backend/RenovoWorkshop.Api/Program.cs`

---

## 🗄️ Acesso ao Banco de Dados

### **Tipo:** SQLite (arquivo local)

### **Localização do arquivo:**
```
backend/RenovoWorkshop.Api/RenovoWorkshop.db
```

### **Como acessar:**

#### **Opção 1 - DB Browser for SQLite (Recomendado)**
1. Baixe: https://sqlitebrowser.org/
2. Abra o arquivo: `backend/RenovoWorkshop.Api/RenovoWorkshop.db`
3. Navegue pelas tabelas:
   - `Users` - Usuários do sistema
   - `Customers` - Clientes
   - `Vehicles` - Veículos
   - `ServiceOrders` - Ordens de serviço
   - `VehicleCheckLists` - Checklists

#### **Opção 2 - Linha de comando**
```bash
cd backend/RenovoWorkshop.Api
sqlite3 RenovoWorkshop.db

# Listar tabelas
.tables

# Ver usuários
SELECT * FROM Users;

# Sair
.quit
```

#### **Opção 3 - Via código (Visual Studio)**
1. Abra o projeto no Visual Studio
2. Tools → SQL Server → New Query
3. Conecte ao banco SQLite

### **Usuário Admin Padrão:**
```
Usuário: admin
Senha: <senha-do-ambiente-local>
```

**Este usuário já está cadastrado no banco** (seedado na criação do banco).

---

## 🚀 Como Executar o Sistema Completo

### **Passo 1: Iniciar o Backend**

```bash
# Navegue até a pasta do backend
cd backend

# Restaure dependências (primeira vez apenas)
dotnet restore

# Execute o projeto
dotnet run --project RenovoWorkshop.Api
```

**Você verá:**
```
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: http://localhost:13900
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: https://localhost:13901
```

✅ **Backend rodando em:** `http://localhost:13900`

---

### **Passo 2: Testar o Backend (Opcional)**

Abra o navegador e acesse:
```
http://localhost:13900/swagger
```

Teste o login:
```
POST /api/Auth/login
{
  "Username": "admin",
  "Password": "<senha-do-ambiente-local>"
}
```

---

### **Passo 3: Iniciar o Frontend Web**

Abra um **novo terminal** (mantenha o backend rodando):

```bash
# Na pasta raiz do projeto
npm install  # Primeira vez apenas

# Inicie o servidor de desenvolvimento
npm start
```

✅ **Frontend rodando em:** `http://localhost:3000`

Acesse: `http://localhost:3000`
- Login: `admin`
- Senha: `<senha-do-ambiente-local>`

---

### **Passo 4: Executar o App Mobile POC**

Abra um **terceiro terminal**:

```bash
# Na pasta raiz do projeto
npx serve mobile-poc -p 3000
```

✅ **App Mobile em:** `http://localhost:3000`

**OU** simplesmente abra o arquivo:
```
mobile-poc/index.html
```

---

## 📱 Testar App Mobile no Celular

### **Requisitos:**
- Celular e PC na **mesma rede WiFi**
- Backend rodando
- App mobile servido (não pode ser arquivo local)

### **Passos:**

1. **Descubra o IP do seu PC:**
   ```bash
   ipconfig
   ```
   Procure por "IPv4 Address" (ex: `192.168.1.100`)

2. **Inicie o app mobile:**
   ```bash
   npx serve mobile-poc -p 3000
   ```

3. **Acesse no celular:**
   ```
   http://192.168.1.100:3000
   ```
   (substitua pelo seu IP)

4. **Login:**
   ```
   Usuário: admin
   Senha: <senha-do-ambiente-local>
   ```

5. **Adicione à tela inicial (opcional):**
   - **Chrome Android:** Menu → "Adicionar à tela inicial"
   - **Safari iOS:** Compartilhar → "Adicionar à tela inicial"

---

## 🔧 Comandos Úteis

### **Backend:**
```bash
# Executar
cd backend
dotnet run --project RenovoWorkshop.Api

# Criar nova migration
dotnet ef migrations add NomeDaMigration --project RenovoWorkshop.Infrastructure --startup-project RenovoWorkshop.Api

# Aplicar migrations
dotnet ef database update --project RenovoWorkshop.Infrastructure --startup-project RenovoWorkshop.Api
```

### **Frontend:**
```bash
# Instalar dependências
npm install

# Executar desenvolvimento
npm start

# Build para produção
npm run build
```

### **App Mobile:**
```bash
# Servir app mobile
npx serve mobile-poc -p 3000

# Ou com outro servidor
npx http-server mobile-poc -p 3000
```

---

## 🐛 Troubleshooting

### **Erro: "Cannot connect to backend"**
✅ **Solução:** Verifique se o backend está rodando em `http://localhost:13900`

### **Erro: "Access denied" ou 403**
✅ **Solução:** O problema foi corrigido! Reinicie o backend.

### **Erro: CORS**
✅ **Solução:** Já configurado! Se persistir, reinicie o backend.

### **Erro: "User not found"**
✅ **Solução:** O usuário admin já existe. Use:
```
Usuário: admin
Senha: <senha-do-ambiente-local>
```

### **Banco de dados não existe**
✅ **Solução:** O banco é criado automaticamente na primeira execução do backend.

### **App mobile não carrega no celular**
✅ **Solução:** 
1. Use `npx serve` (não abra o arquivo diretamente)
2. Verifique se celular e PC estão na mesma rede
3. Use o IP do PC, não localhost

---

## 📊 Estrutura do Banco de Dados

### **Tabelas Principais:**

1. **Users** - Usuários do sistema
   - admin, gerente, recepção, mecânico, almoxarifado, cliente

2. **Customers** - Clientes da oficina
   - Nome, documento, telefone, email

3. **Vehicles** - Veículos dos clientes
   - Placa, marca, modelo, ano, cor

4. **ServiceOrders** - Ordens de serviço
   - Número, status, descrição, valor, data

5. **VehicleCheckLists** - Checklists de veículos
   - Itens verificados, observações

6. **InventoryItems** - Peças em estoque
   - Código, descrição, valores

7. **Suppliers** - Fornecedores
   - Nome, contato

8. **PurchaseOrders** - Ordens de compra
   - Número, fornecedor, itens

---

## 🎯 Checklist de Entrega para o Cliente

- [x] Backend funcionando
- [x] Frontend web funcionando
- [x] Login admin corrigido
- [x] Permissões funcionando
- [x] App mobile POC criado
- [x] CORS configurado
- [x] Banco de dados documentado
- [x] Credenciais de acesso documentadas

---

## 📞 Credenciais de Acesso

### **Sistema Web:**
```
URL: http://localhost:3000
Usuário: admin
Senha: <senha-do-ambiente-local>
```

### **App Mobile:**
```
URL: http://localhost:3000 (ou IP do PC)
Usuário: admin
Senha: <senha-do-ambiente-local>
```

### **API:**
```
URL: http://localhost:13900/api
Autenticação: Bearer Token (JWT)
```

---

## 🎓 Próximos Passos (Produção)

1. **Deploy do Backend:**
   - Azure App Service
   - AWS EC2
   - DigitalOcean Droplet

2. **Deploy do Frontend:**
   - Vercel
   - Netlify
   - Azure Static Web Apps

3. **App Mobile:**
   - Converter para React Native
   - Publicar na App Store / Google Play
   - Implementar push notifications

4. **Banco de Dados:**
   - Migrar para PostgreSQL ou SQL Server
   - Configurar backups automáticos

---

## 📝 Notas Importantes

1. **NUNCA** commite o arquivo `appsettings.Development.json` com senhas reais
2. **SEMPRE** use HTTPS em produção
3. **ALTERE** a senha do admin em produção
4. **CONFIGURE** backup automático do banco de dados
5. **TESTE** o app mobile em diferentes dispositivos antes de entregar

---

## 🆘 Suporte

Se algo não funcionar:

1. Verifique se o backend está rodando
2. Verifique o console do navegador (F12)
3. Verifique os logs do backend
4. Consulte a documentação em `README.md`

---

**Desenvolvido para Renovo Workshop** 🚗⚙️

**Data:** 14/06/2026
**Versão:** 1.0.0-POC