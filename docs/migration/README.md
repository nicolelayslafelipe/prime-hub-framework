# Guia de Migração - DeliveryOS para Supabase Externo

Este guia contém todos os scripts necessários para migrar o sistema DeliveryOS para um projeto Supabase externo.

## 📋 Arquivos Incluídos

| Arquivo | Descrição |
|---------|-----------|
| `01_schema.sql` | Estrutura completa (tabelas, funções, tipos) |
| `02_triggers.sql` | Todos os triggers do sistema |
| `03_rls_policies.sql` | Políticas de Row Level Security |
| `04_indexes_realtime.sql` | Índices de performance, Realtime e Storage |
| `05_data.sql` | Dados existentes (categorias, produtos, etc.) |

## 🚀 Passo a Passo da Migração

### 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie uma nova conta ou faça login
3. Clique em "New Project"
4. Anote as credenciais:
   - **Project URL**: `https://SEU-PROJETO.supabase.co`
   - **Anon Key**: `eyJhbG...`
   - **Service Role Key**: `eyJhbG...` (manter seguro!)

### 2. Executar os Scripts SQL

No Supabase Dashboard, vá em **SQL Editor** e execute os scripts **na ordem**:

```
1. 01_schema.sql      → Cria tabelas e funções
2. 02_triggers.sql    → Cria triggers
3. 03_rls_policies.sql → Configura RLS
4. 04_indexes_realtime.sql → Índices e Realtime
5. 05_data.sql        → Importa dados
```

⚠️ **IMPORTANTE**: Execute cada arquivo separadamente e verifique se não há erros.

### 3. Criar Usuários

Os usuários precisam ser criados manualmente no Supabase Auth:

1. Vá em **Authentication > Users**
2. Clique em "Add User"
3. Crie cada usuário com email e senha
4. Anote os UUIDs gerados
5. Atualize `05_data.sql` com os novos UUIDs antes de executar

### 4. Configurar Primeiro Admin

Após criar o primeiro usuário, adicione a role de admin:

```sql
-- Substitua pelo UUID do usuário criado
INSERT INTO public.user_roles (user_id, role)
VALUES ('UUID-DO-USUARIO', 'admin');
```

### 5. Configurar Secrets

No Supabase Dashboard, vá em **Settings > Secrets** e adicione:

| Secret | Descrição |
|--------|-----------|
| `MERCADO_PAGO_ACCESS_TOKEN` | Token do Mercado Pago |
| `MAPBOX_ACCESS_TOKEN` | Token do Mapbox |

### 6. Deploy das Edge Functions

Copie todas as edge functions da pasta `supabase/functions/` para o novo projeto:

```bash
# Usando Supabase CLI
supabase functions deploy admin-create-user
supabase functions deploy admin-delete-user
supabase functions deploy admin-list-users
supabase functions deploy admin-update-user
supabase functions deploy calculate-delivery-fee
supabase functions deploy calculate-eta
supabase functions deploy check-integrations-health
supabase functions deploy create-mercadopago-payment
supabase functions deploy geocode-address
supabase functions deploy get-manifest
supabase functions deploy get-mapbox-token
supabase functions deploy mercadopago-webhook
supabase functions deploy test-mapbox-connection
supabase functions deploy test-payment-connection
supabase functions deploy update-mapbox-token
supabase functions deploy update-payment-credentials
supabase functions deploy check-expired-payments
supabase functions deploy send-push-notification
```

### 7. Atualizar Variáveis de Ambiente

No seu projeto hospedado (Vercel, Netlify, etc.), configure:

```env
VITE_SUPABASE_URL="https://SEU-PROJETO.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sua-anon-key"
VITE_SUPABASE_PROJECT_ID="seu-project-id"
```

### 8. Configurar Storage

No Supabase Dashboard, vá em **Storage** e verifique se os buckets foram criados:

- `avatars` (público)
- `products` (público)
- `branding` (público)

Se não foram criados automaticamente, crie-os manualmente.

### 9. Configurar Auth

No Supabase Dashboard, vá em **Authentication > Settings**:

1. **Email Auth**:
   - Habilitar "Enable Email Signup"
   - Desabilitar "Confirm Email" para testes
   
2. **Site URL**:
   - Configurar a URL do seu domínio

## 🔒 Estrutura de Roles

O sistema usa 4 roles:

| Role | Descrição | Permissões |
|------|-----------|------------|
| `admin` | Administrador | Acesso total |
| `kitchen` | Cozinha | Ver/atualizar pedidos |
| `motoboy` | Entregador | Ver pedidos prontos, atualizar entregas |
| `client` | Cliente | Ver próprios pedidos, criar pedidos |

## 📊 Tabelas Principais

### Públicas (visualização)
- `categories` - Categorias do cardápio
- `products` - Produtos
- `payment_methods` - Formas de pagamento
- `banners` - Banners promocionais
- `message_templates` - Templates de mensagens
- `loyalty_settings` - Config. fidelidade
- `loyalty_rewards` - Recompensas fidelidade

### Privadas (autenticado)
- `profiles` - Perfis de usuários
- `addresses` - Endereços dos clientes
- `orders` - Pedidos
- `order_items` - Itens dos pedidos
- `payments` - Pagamentos
- `client_preferences` - Preferências

### Admin Only
- `establishment_settings` - Configurações
- `admin_settings` - Config. admin
- `admin_notifications` - Notificações
- `admin_audit_logs` - Logs de auditoria
- `user_roles` - Roles dos usuários
- `cash_registers` - Caixas
- `cash_transactions` - Transações do caixa

## ✅ Checklist de Validação

Após a migração, teste:

- [ ] Login com email/senha
- [ ] Cadastro de novo usuário
- [ ] Visualização do cardápio (sem login)
- [ ] Criação de pedido (cliente logado)
- [ ] Atualização de status (admin)
- [ ] Acesso ao painel admin
- [ ] Upload de imagens
- [ ] Notificações em tempo real

## 🆘 Problemas Comuns

### Erro "infinite recursion in policy"
- Verifique se a função `has_role` foi criada corretamente
- Execute novamente `01_schema.sql`

### Erro "permission denied"
- Verifique se RLS está habilitado
- Verifique se o usuário tem a role correta

### Dados não aparecem
- Verifique se os dados foram inseridos
- Verifique as políticas RLS da tabela

### Realtime não funciona
- Verifique se a tabela foi adicionada à publicação
- Execute: `ALTER PUBLICATION supabase_realtime ADD TABLE public.nome_tabela;`

## 📞 Suporte

Em caso de dúvidas sobre a migração, consulte:
- [Documentação do Supabase](https://supabase.com/docs)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
