# Deploy no Render - Guia Passo a Passo

Este guia mostra como fazer deploy unificado (frontend + backend) no Render.

## Pre-requisitos

- Conta no [Render](https://render.com)
- Repositorio no GitHub com este projeto
- Credenciais do Supabase (URL, Anon Key, Service Role Key)
- URL de conexao do banco de dados PostgreSQL

---

## Passo 1: Enviar para o GitHub

1. Crie um repositorio no GitHub (se ainda nao tiver)
2. Conecte seu projeto ao repositorio:

```bash
git init
git add .
git commit -m "Preparando para deploy no Render"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git push -u origin main
```

---

## Passo 2: Criar Web Service no Render

1. Acesse [dashboard.render.com](https://dashboard.render.com)
2. Clique em **"New +"** > **"Web Service"**
3. Conecte sua conta GitHub se ainda nao estiver conectada
4. Selecione o repositorio do projeto
5. Configure:
   - **Name**: `vibe-drinks` (ou o nome que preferir)
   - **Region**: Escolha a mais proxima
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm run start`
   - **Plan**: `Starter` (ou Free para testes)

---

## Passo 3: Configurar Variaveis de Ambiente

Na aba **"Environment"** do seu Web Service, adicione:

| Variavel | Valor | Descricao |
|----------|-------|-----------|
| `NODE_ENV` | `production` | Modo de producao |
| `DATABASE_URL` | `postgresql://...` | URL de conexao do PostgreSQL |
| `SUPABASE_URL` | `https://xxx.supabase.co` | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Chave de servico do Supabase |
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` | URL do Supabase (para o frontend) |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` | Chave anonima do Supabase |
| `SESSION_SECRET` | (gerar valor aleatorio) | Segredo para sessoes |

### Onde encontrar as credenciais do Supabase:

1. Acesse [app.supabase.com](https://app.supabase.com)
2. Selecione seu projeto
3. Va em **Settings** > **API**
4. Copie:
   - **Project URL** → `SUPABASE_URL` e `VITE_SUPABASE_URL`
   - **anon public** → `VITE_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

### Para o DATABASE_URL:

Use a URL de conexao do seu banco PostgreSQL. Se estiver usando o banco do Supabase:
1. Va em **Settings** > **Database**
2. Copie a **Connection string** (URI)

---

## Passo 4: Deploy

1. Clique em **"Create Web Service"**
2. O Render vai automaticamente:
   - Clonar seu repositorio
   - Instalar dependencias (`npm ci`)
   - Buildar o projeto (`npm run build`)
   - Iniciar o servidor (`npm run start`)

3. Aguarde o deploy completar (pode levar alguns minutos)
4. Sua aplicacao estara disponivel em: `https://seu-app.onrender.com`

---

## Deploys Automaticos

Por padrao, o Render faz deploy automatico sempre que voce faz push para a branch `main`:

```bash
git add .
git commit -m "Nova feature"
git push origin main
```

O Render detecta o push e inicia um novo deploy automaticamente.

---

## Solucao de Problemas

### Build falhou

1. Verifique os logs do build no dashboard do Render
2. Certifique-se que todas as variaveis de ambiente estao configuradas
3. Teste localmente: `npm run build`

### App nao inicia

1. Verifique os logs do servico
2. Confirme que `DATABASE_URL` esta correto
3. Verifique se as credenciais do Supabase estao corretas

### Pagina em branco

1. Verifique se o build do frontend foi bem sucedido
2. Acesse `/api/health` para testar se a API esta funcionando
3. Verifique os logs para erros

---

## Comandos Uteis

```bash
# Testar build localmente
npm run build

# Testar producao localmente
npm run start

# Verificar se tudo funciona
curl http://localhost:5000/api/health
```

---

## Estrutura do Deploy

```
Render Web Service
├── Build: npm ci && npm run build
│   ├── Instala dependencias
│   ├── Builda frontend (Vite) → dist/public/
│   └── Builda backend (esbuild) → dist/index.cjs
└── Start: npm run start
    └── Executa dist/index.cjs que:
        ├── Serve API em /api/*
        └── Serve frontend estatico em /*
```

O servidor Express serve tanto a API quanto os arquivos estaticos do frontend, tudo em uma unica aplicacao.
