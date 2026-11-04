# Renovo - POC App Mobile
## Check-in & Checklist de Veículos

Aplicativo mobile POC para check-in e checklist de veículos na oficina Renovo.

## 📱 Funcionalidades

- ✅ Login de usuários
- ✅ Check-in de veículos (placa, quilometragem, combustível, observações)
- ✅ Checklist de itens do veículo (10 itens padrão)
- ✅ Registro de observações adicionais
- ✅ Histórico de ordens de serviço

## 🔧 Pré-requisitos

1. **Backend rodando** em `http://localhost:13900`
2. **Navegador moderno** (Chrome, Firefox, Safari, Edge)
3. **Conexão com a internet** (para carregar assets)

## 🚀 Como Executar

### 1. Iniciar o Backend

```bash
cd backend
dotnet run --project RenovoWorkshop.Api
```

O backend estará disponível em `http://localhost:13900`

### 2. Abrir o App Mobile

**Opção 1 - Servidor HTTP simples:**
```bash
# Na pasta raiz do projeto
npx serve mobile-poc -p 3000
```

Acesse: `http://localhost:3000`

**Opção 2 - Abrir diretamente:**
Abra o arquivo `mobile-poc/index.html` em um navegador (funcionalidade limitada)

**Opção 3 - Live Server (VS Code):**
- Instale a extensão "Live Server"
- Clique com botão direito em `index.html`
- Selecione "Open with Live Server"

## 👤 Credenciais de Acesso

```
Usuário: admin
Senha: <senha-do-ambiente-local>
```

## 📋 Estrutura do Projeto

```
mobile-poc/
├── index.html          # Tela de login
├── styles.css          # Estilos do app
├── app.js              # Lógica JavaScript
├── manifest.json       # PWA manifest
└── README.md           # Este arquivo
```

## 🔄 Fluxo de Uso

1. **Login** → Usuário autentica com credenciais
2. **Check-in** → Registra entrada do veículo:
   - Placa
   - Quilometragem
   - Nível de combustível
   - Observações
3. **Checklist** → Marca itens do veículo:
   - 10 itens padrão
   - Observações adicionais
4. **Confirmação** → Tela de sucesso

## 🛠️ Tecnologias

- HTML5
- CSS3 (Responsivo)
- JavaScript (Vanilla)
- PWA (Progressive Web App)

## 📱 Testar no Celular

1. **Mesma rede WiFi** - Celular e PC devem estar na mesma rede
2. **Descobrir IP do PC:**
   ```bash
   ipconfig
   ```
3. **Acessar pelo celular:**
   ```
   http://SEU_IP:3000
   ```
4. **Adicionar à tela inicial:**
   - Chrome Android: Menu → "Adicionar à tela inicial"
   - Safari iOS: Compartilhar → "Adicionar à tela inicial"

## ⚙️ Configuração

### Alterar URL da API

Edite o arquivo `app.js`, linha 1:

```javascript
const API_URL = 'http://localhost:13900/api';
```

Para produção, altere para o IP/domínio do servidor.

## 🐛 Troubleshooting

### Erro de CORS
Certifique-se que o backend está configurado para aceitar requisições do origin do app.

### Erro 404
Verifique se o backend está rodando e a porta está correta.

### Login não funciona
- Verifique se o backend está rodando
- Teste as credenciais no Postman/Insomnia
- Verifique o console do navegador para erros

## 📝 Próximos Passos (Produção)

- [ ] Converter para React Native ou Flutter
- [ ] Implementar cache offline
- [ ] Adicionar fotos do veículo
- [ ] Assinatura digital do cliente
- [ ] Notificações push
- [ ] Sincronização em background
- [ ] Modo offline completo

## 📞 Suporte

Em caso de dúvidas, consulte a documentação do backend ou o arquivo README.md principal do projeto.

---

**Desenvolvido para Renovo Workshop** 🚗⚙️