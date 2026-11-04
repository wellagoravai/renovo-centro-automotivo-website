# Guia: Deploy do Backend no Railway.app

## Problema
O Vercel **não suporta** aplicações ASP.NET Core/.NET. O backend precisa ser hospedado em uma plataforma diferente.

## Solução: Railway.app

**Por quê Railway?**
- ✅ **Gratuito**: $5 de crédito/mês (suficiente para desenvolvimento)
- ✅ **Suporte nativo a .NET 8**
- ✅ **Deploy automático** via GitHub
- ✅ **Configuração simples** em 5 minutos
- ✅ **Banco de dados SQLite** funciona sem configuração extra

---

## Passo a Passo

### 1. Criar conta no Railway

1. Acesse: https://railway.app
2. Clique em **"Start a New Project"**
3. Faça login com **GitHub** (recomendado)

### 2. Preparar o repositório

Certifique-se que o arquivo `backend/railway.json` foi criado (já criamos ele para você).

### 3. Deploy do Backend

1. No Railway, clique em **"New Project"**
2. Selecione **"Deploy from GitHub repo"**
3. Escolha o repositório `renovo-centro-automotivo-website`
4. **IMPORTANTE**: Em "Root Directory", digite: `backend`
   - Isso diz ao Railway para usar a pasta `backend` como raiz do projeto
5. Clique em **"Deploy Now"**

O Railway vai:
- Detectar automaticamente que é um projeto .NET
- Executar `dotnet publish`
- Iniciar a aplicação

### 4. Configurar Variáveis de Ambiente

Após o deploy, clique no projeto e vá em **"Variables"**:

Adicione estas variáveis:

```
Jwt__Key=<gere-uma-chave-aleatoria-de-64-caracteres>
Jwt:Issuer=RenovoWorkshop
Jwt:Audience=RenovoWorkshopUsers
ASPNETCORE_ENVIRONMENT=Production
```

**Importante**: Para produção, use uma chave JWT mais segura!

### 5. Obter a URL do Backend

Após o deploy, o Railway vai gerar uma URL como:
```
https://renovo-workshop-api-production.up.railway.app
```

Clique em **"Settings"** → **"Domains"** para ver a URL completa.

### 6. Configurar CORS

Atualize o arquivo `backend/RenovoWorkshop.Api/Program.cs` para aceitar o domínio do Vercel:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowLocalhost", policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000", 
                "http://localhost:3001", 
                "http://localhost:8080", 
                "http://127.0.0.1:3000", 
                "http://192.168.*.*", 
                "http://10.0.*.*",
                "https://seu-frontend.vercel.app"  // Adicione aqui
              )
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});
```

**Substitua** `https://seu-frontend.vercel.app` pela URL real do seu frontend no Vercel.

Faça commit e push das alterações. O Railway vai fazer deploy automático.

### 7. Configurar o Frontend

No Vercel, configure a variável de ambiente:

1. Vá para o projeto do frontend no Vercel
2. **Settings** → **Environment Variables**
3. Adicione:

```
REACT_APP_API_URL=https://renovo-workshop-api-production.up.railway.app
```

4. Clique em **"Redeploy"** para aplicar as alterações

### 8. Testar

1. Acesse o frontend no Vercel
2. Tente fazer login com:
   - **Usuário**: `admin`
   - **Senha**: `<senha-do-ambiente-local>`
3. Verifique se as APIs estão funcionando

---

## Verificação

### Testar API diretamente

Acesse no navegador:
```
https://renovo-workshop-api-production.up.railway.app/swagger
```

Você deve ver a documentação Swagger da API.

### Testar Login

```bash
curl -X POST https://renovo-workshop-api-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"<senha-do-ambiente-local>"}'
```

Deve retornar um token JWT.

---

## Limites do Plano Gratuito

- **$5 de crédito/mês**
- **512 MB RAM**
- **1 GB armazenamento**
- **100 horas de execução/mês**

**Suficiente para**: Desenvolvimento, testes e projetos pequenos.

Para produção com mais tráfego, considere o plano **Hobby** ($5/mês).

---

## Troubleshooting

### Erro: "Cannot connect to database"
- Verifique se o arquivo `.db` está sendo criado
- Verifique os logs no Railway (aba "Deployments" → "View Logs")

### Erro: "CORS policy"
- Verifique se a URL do frontend está correta no CORS
- Verifique se `AllowCredentials()` está habilitado

### Erro: "Application failed to start"
- Verifique os logs no Railway
- Certifique-se que o `startCommand` está correto no `railway.json`

### Banco de dados não persiste
- O Railway usa **ephemeral storage** (arquivos são perdidos ao reiniciar)
- Para produção, use um banco de dados gerenciado (PostgreSQL no Railway)

---

## Alternativas Gratuitas

Se o Railway não funcionar, tente:

1. **Render.com** - Plano gratuito com limitações
2. **Fly.io** - $5 de crédito gratuito
3. **Azure App Service** - Plano gratuito para .NET

Mas o **Railway é o mais simples** para .NET.

---

## Próximos Passos

1. ✅ Fazer deploy do backend no Railway
2. ✅ Configurar variáveis de ambiente
3. ✅ Atualizar CORS com a URL do Vercel
4. ✅ Configurar `REACT_APP_API_URL` no Vercel
5. ✅ Testar a aplicação completa

---

## Suporte

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway