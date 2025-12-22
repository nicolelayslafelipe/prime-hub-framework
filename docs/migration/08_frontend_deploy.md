# Deploy do Frontend - Supabase Externo

## 1. Exportar Código para GitHub

### Via Lovable
1. Acesse **Settings** no Lovable
2. Clique em **GitHub** > **Connect**
3. Autorize e crie o repositório
4. O código será sincronizado automaticamente

## 2. Clonar e Configurar Localmente

```bash
# Clonar repositório
git clone https://github.com/SEU-USUARIO/SEU-REPO.git
cd SEU-REPO

# Instalar dependências
npm install
```

## 3. Configurar Variáveis de Ambiente

Criar arquivo `.env` na raiz do projeto:

```env
# Supabase - Frontend (pode ser público)
VITE_SUPABASE_URL="https://SEU-PROJECT-ID.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
VITE_SUPABASE_PROJECT_ID="SEU-PROJECT-ID"
```

⚠️ **IMPORTANTE**: 
- `SUPABASE_SERVICE_ROLE_KEY` **NUNCA** deve ir no frontend
- É usado apenas nas Edge Functions (já configurado automaticamente pelo Supabase)

## 4. Testar Localmente

```bash
npm run dev
```

Acesse: `http://localhost:5173`

### Checklist de Testes Locais
- [ ] Login/Cadastro funcionando
- [ ] Cardápio carregando
- [ ] Imagens exibindo (Storage)
- [ ] Criar pedido (se logado)

## 5. Deploy - Vercel (Recomendado)

### Via CLI
```bash
npm install -g vercel
vercel login
vercel
```

### Via Dashboard
1. Acesse [vercel.com](https://vercel.com)
2. Import projeto do GitHub
3. Configure variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`
4. Deploy

## 6. Deploy - Netlify (Alternativa)

### Via CLI
```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

### Via Dashboard
1. Acesse [netlify.com](https://netlify.com)
2. Import projeto do GitHub
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Configure variáveis de ambiente
5. Deploy

## 7. Configurar Domínio Personalizado

### Vercel
1. Acesse projeto > Settings > Domains
2. Adicione seu domínio
3. Configure DNS conforme instruções

### Netlify
1. Acesse projeto > Domain settings
2. Adicione custom domain
3. Configure DNS conforme instruções

## 8. Configurar Auth Redirects

No **Supabase Dashboard** > Authentication > URL Configuration:

```
Site URL: https://seu-dominio.com

Redirect URLs:
- https://seu-dominio.com
- https://seu-dominio.com/auth
- https://seu-dominio.com/auth/callback
- http://localhost:5173 (para desenvolvimento)
```

## 9. Configurar CORS (se necessário)

No **Supabase Dashboard** > Settings > API:

Adicione seu domínio em "Additional redirect URLs":
```
https://seu-dominio.com
```

## 10. Checklist Final de Produção

### Segurança
- [ ] `.env` não está no Git (verificar `.gitignore`)
- [ ] Service Role Key não está exposta
- [ ] HTTPS habilitado

### Funcionalidade
- [ ] Login/Cadastro
- [ ] Visualizar cardápio
- [ ] Criar pedido
- [ ] Atualizar status (admin)
- [ ] Upload de imagens
- [ ] Pagamento PIX
- [ ] Notificações realtime

### Performance
- [ ] Build otimizado (`npm run build`)
- [ ] Imagens otimizadas
- [ ] Lazy loading funcionando

## Troubleshooting

### Erro: "Invalid API Key"
- Verifique se `VITE_SUPABASE_PUBLISHABLE_KEY` está correto
- Confirme que a variável está configurada no host

### Erro: "CORS blocked"
- Adicione o domínio nas redirect URLs do Supabase
- Verifique se está usando HTTPS

### Erro: "Auth redirect failed"
- Verifique Site URL no Supabase Auth
- Confirme que o domínio está nas Redirect URLs

### Imagens não carregam
- Verifique se os buckets estão públicos
- Confirme que as URLs estão corretas

### Realtime não funciona
- Verifique se a tabela está no publication
- Confirme RLS policies permitem SELECT
