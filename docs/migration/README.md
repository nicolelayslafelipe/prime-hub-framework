# 🚀 Guia Completo de Migração - DeliveryOS para Supabase Externo

Este guia contém todos os scripts e instruções para migrar o sistema DeliveryOS do Lovable Cloud para um projeto Supabase externo independente.

---

## 📋 Arquivos de Migração

| # | Arquivo | Descrição |
|---|---------|-----------|
| 1 | `01_schema.sql` | Estrutura completa (34 tabelas, 15 funções, tipos) |
| 2 | `02_triggers.sql` | 25+ triggers do sistema |
| 3 | `03_rls_policies.sql` | 60+ políticas de Row Level Security |
| 4 | `04_indexes_realtime.sql` | Índices, Realtime e Storage |
| 5 | `05_data.sql` | Dados iniciais (categorias, produtos, etc.) |
| 6 | `06_edge_functions_deploy.md` | Guia de deploy das Edge Functions |
| 7 | `07_validation_tests.sql` | Script de validação pós-migração |
| 8 | `08_frontend_deploy.md` | Guia de deploy do frontend |

---

## 🏁 Passo a Passo Rápido

### Fase 1: Preparar Supabase Externo

1. Criar projeto em [supabase.com](https://supabase.com)
2. Anotar credenciais:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY` 
   - `SUPABASE_SERVICE_ROLE_KEY` (⚠️ manter seguro!)

### Fase 2: Executar Scripts SQL

No **SQL Editor** do Supabase, execute **NA ORDEM**:

```
1. 01_schema.sql       → Cria tabelas e funções
2. 02_triggers.sql     → Cria triggers
3. 03_rls_policies.sql → Configura RLS
4. 04_indexes_realtime.sql → Índices, Realtime e Storage
5. 05_data.sql         → Importa dados iniciais
6. 07_validation_tests.sql → Valida migração
```

### Fase 3: Deploy Edge Functions

```bash
# Instalar CLI
npm install -g supabase

# Autenticar e linkar
supabase login
supabase link --project-ref SEU-PROJECT-ID

# Deploy de todas as funções
supabase functions deploy admin-create-user
supabase functions deploy admin-delete-user
supabase functions deploy admin-list-users
supabase functions deploy admin-update-user
supabase functions deploy calculate-delivery-fee
supabase functions deploy calculate-eta
supabase functions deploy check-expired-payments
supabase functions deploy check-integrations-health
supabase functions deploy create-mercadopago-payment
supabase functions deploy geocode-address
supabase functions deploy get-manifest
supabase functions deploy get-mapbox-token
supabase functions deploy mercadopago-webhook
supabase functions deploy send-push-notification
supabase functions deploy test-mapbox-connection
supabase functions deploy test-payment-connection
supabase functions deploy update-mapbox-token
supabase functions deploy update-payment-credentials
```

### Fase 4: Configurar Secrets

No Supabase Dashboard > Settings > Edge Functions > Secrets:

| Secret | Obrigatório |
|--------|-------------|
| `MERCADO_PAGO_ACCESS_TOKEN` | Para pagamentos PIX |
| `MAPBOX_ACCESS_TOKEN` | Para mapas e geocoding |

### Fase 5: Criar Primeiro Admin

```sql
-- 1. Crie o usuário no Dashboard > Authentication > Users
-- 2. Copie o UUID gerado
-- 3. Execute:
INSERT INTO public.user_roles (user_id, role)
VALUES ('UUID-DO-USUARIO', 'admin');
```

### Fase 6: Deploy do Frontend

1. Exportar código via GitHub (Settings > GitHub no Lovable)
2. Clonar repositório:
   ```bash
   git clone https://github.com/SEU-USUARIO/SEU-REPO.git
   cd SEU-REPO
   npm install
   ```
3. Criar `.env`:
   ```env
   VITE_SUPABASE_URL="https://SEU-PROJECT-ID.supabase.co"
   VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbG..."
   VITE_SUPABASE_PROJECT_ID="SEU-PROJECT-ID"
   ```
4. Deploy (Vercel/Netlify):
   ```bash
   npm install -g vercel
   vercel
   ```

### Fase 7: Configurar Auth

No Supabase > Authentication > URL Configuration:
- **Site URL**: `https://seu-dominio.com`
- **Redirect URLs**: 
  - `https://seu-dominio.com`
  - `https://seu-dominio.com/auth`

---

## 🔒 Estrutura de Roles

| Role | Descrição | Permissões |
|------|-----------|------------|
| `admin` | Administrador | Acesso total |
| `kitchen` | Cozinha | Ver/atualizar pedidos |
| `motoboy` | Entregador | Ver pedidos prontos, atualizar entregas |
| `client` | Cliente | Ver próprios pedidos, criar pedidos |

---

## 📊 Tabelas do Sistema

### Públicas (visualização sem login)
- `categories` - Categorias do cardápio
- `products` - Produtos
- `payment_methods` - Formas de pagamento
- `banners` - Banners promocionais
- `message_templates` - Templates de mensagens
- `loyalty_settings` / `loyalty_rewards` - Fidelidade

### Privadas (requer autenticação)
- `profiles` - Perfis de usuários
- `addresses` - Endereços dos clientes
- `orders` / `order_items` - Pedidos
- `payments` - Pagamentos
- `client_preferences` - Preferências

### Admin Only
- `establishment_settings` - Configurações do estabelecimento
- `admin_notifications` - Notificações
- `admin_audit_logs` - Logs de auditoria
- `user_roles` - Roles dos usuários
- `cash_registers` / `cash_transactions` - Caixa

---

## ✅ Checklist de Validação

### Funcionalidades Core
- [ ] Login/Cadastro funcionando
- [ ] Cardápio visível (sem login)
- [ ] Criar pedido (cliente logado)
- [ ] Atualizar status (admin)
- [ ] Kanban em tempo real
- [ ] Upload de imagens
- [ ] Pagamento PIX
- [ ] Notificações

### Segurança (RLS)
- [ ] Cliente não vê pedidos de outros
- [ ] Admin vê tudo do estabelecimento
- [ ] Motoboy vê apenas pedidos atribuídos
- [ ] Cozinha vê pedidos em preparo

### Realtime
- [ ] Pedidos atualizam automaticamente
- [ ] Notificações aparecem sem refresh
- [ ] Status do Kanban sincroniza

---

## 🆘 Problemas Comuns

### "infinite recursion in policy"
- Verifique se a função `has_role` foi criada corretamente
- Execute novamente `01_schema.sql`

### "permission denied"
- Verifique se RLS está habilitado
- Verifique se o usuário tem a role correta

### Dados não aparecem
- Verifique se os dados foram inseridos
- Verifique as políticas RLS da tabela

### Realtime não funciona
- Verifique se a tabela foi adicionada à publicação:
  ```sql
  ALTER PUBLICATION supabase_realtime ADD TABLE public.nome_tabela;
  ```

### Imagens não carregam
- Verifique se os buckets estão públicos
- Confirme que as URLs estão corretas

---

## 📞 Documentação Adicional

- [Supabase Docs](https://supabase.com/docs)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Vercel Deploy](https://vercel.com/docs)
- [Netlify Deploy](https://docs.netlify.com)
