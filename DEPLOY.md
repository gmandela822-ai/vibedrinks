# Deploy no Render

## Arquitetura
- **Full-Stack**: React + Vite (Frontend) + Express (Backend) no **mesmo serviço**
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage

## Pré-requisitos
- Conta em [render.com](https://render.com)
- Repositório GitHub com este projeto
- Variáveis de ambiente do Supabase

## Passos para Deploy

### 1. Conectar Repositório ao Render
1. Acesse [Render Dashboard](https://dashboard.render.com)
2. Clique em "New +" → "Web Service"
3. Conecte seu repositório GitHub
4. Autorize o Render a acessar seu repositório

### 2. Configuração Automática
O arquivo `render.yaml` já contém toda a configuração necessária:

```yaml
services:
  - type: web
    name: vibe-drinks
    runtime: node
    buildCommand: npm ci --include=dev && npm run build
    startCommand: npm run start
```

**Render lerá automaticamente este arquivo!**

### 3. Variáveis de Ambiente

No dashboard do Render, adicione em "Environment":

```
NODE_ENV=production
PORT=5000
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-chave-de-servico
SUPABASE_DATABASE_URL=sua-url-postgres-do-supabase
SESSION_SECRET=(será gerado automaticamente)
FRONTEND_URL=https://vibe-drinks.onrender.com
VITE_API_URL=https://vibe-drinks.onrender.com
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publica-do-supabase
```

### 4. Deploy

1. Clique em "Create Web Service"
2. Render fará o deploy automaticamente
3. Cada push para `main` dispara novo deploy

## Como Funciona

```
1. npm ci → Instala dependências exatas
2. npm run build →
   ├─ vite build → Compila React + Vite
   └─ esbuild → Compila backend para dist/index.mjs
3. npm run start →
   ├─ Inicia servidor Express em PORT 5000
   └─ Serve arquivos estáticos do dist/public
```

## Monitoramento

- **Logs**: Aba "Logs" do Render Dashboard
- **Status**: Aba "Health" mostra status do serviço
- **Métricas**: Aba "Metrics" mostra CPU/memória/requisições

## Troubleshooting

### Build falha
```
✓ Verifique npm run build localmente
✓ Confirme todas as variáveis de ambiente
✓ Veja logs em "Logs" do dashboard
```

### Aplicação não inicia
```
✓ Confirme PORT=5000 está set
✓ Veja logs em tempo real
✓ npm run start funciona localmente?
```

### Erro de conexão com banco
```
✓ SUPABASE_DATABASE_URL está correto?
✓ SUPABASE_SERVICE_ROLE_KEY está válida?
✓ Teste conexão localmente
```

## Verificar Deploy

Após deploy, acesse:
```
https://vibe-drinks.onrender.com
```

Render levará ~2-5 minutos para build + start.
Monitore progresso em "Events" do dashboard.
