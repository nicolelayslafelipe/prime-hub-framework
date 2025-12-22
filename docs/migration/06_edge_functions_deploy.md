# Deploy das Edge Functions - Supabase Externo

## Pré-requisitos

1. **Supabase CLI instalado**
```bash
npm install -g supabase
```

2. **Autenticado no Supabase**
```bash
supabase login
```

3. **Projeto linkado**
```bash
supabase link --project-ref SEU-PROJECT-ID
```

## Edge Functions Disponíveis

| Função | JWT | Descrição |
|--------|-----|-----------|
| `admin-create-user` | ✅ | Criar usuários (admin only) |
| `admin-delete-user` | ✅ | Deletar usuários (admin only) |
| `admin-list-users` | ✅ | Listar usuários (admin only) |
| `admin-update-user` | ✅ | Atualizar usuários (admin only) |
| `calculate-delivery-fee` | ✅ | Calcular taxa de entrega |
| `calculate-eta` | ✅ | Calcular tempo estimado |
| `check-expired-payments` | ❌ | Verificar pagamentos expirados (cron) |
| `check-integrations-health` | ✅ | Status das integrações |
| `create-mercadopago-payment` | ✅ | Criar pagamento PIX |
| `geocode-address` | ✅ | Geocodificar endereço |
| `get-manifest` | ❌ | PWA manifest (público) |
| `get-mapbox-token` | ✅ | Obter token Mapbox |
| `mercadopago-webhook` | ❌ | Webhook do MercadoPago (público) |
| `send-push-notification` | ✅ | Enviar push notification |
| `test-mapbox-connection` | ✅ | Testar conexão Mapbox |
| `test-payment-connection` | ✅ | Testar conexão pagamento |
| `update-mapbox-token` | ✅ | Atualizar token Mapbox |
| `update-payment-credentials` | ✅ | Atualizar credenciais pagamento |

## Deploy Completo (Script)

```bash
#!/bin/bash

# Deploy de todas as Edge Functions
echo "🚀 Iniciando deploy das Edge Functions..."

functions=(
  "admin-create-user"
  "admin-delete-user"
  "admin-list-users"
  "admin-update-user"
  "calculate-delivery-fee"
  "calculate-eta"
  "check-expired-payments"
  "check-integrations-health"
  "create-mercadopago-payment"
  "geocode-address"
  "get-manifest"
  "get-mapbox-token"
  "mercadopago-webhook"
  "send-push-notification"
  "test-mapbox-connection"
  "test-payment-connection"
  "update-mapbox-token"
  "update-payment-credentials"
)

for func in "${functions[@]}"; do
  echo "📦 Deploying: $func"
  supabase functions deploy "$func"
done

echo "✅ Deploy concluído!"
```

## Configurar Secrets

No Supabase Dashboard > Settings > Edge Functions > Secrets:

| Secret | Descrição | Obrigatório |
|--------|-----------|-------------|
| `MERCADO_PAGO_ACCESS_TOKEN` | Token de produção do MercadoPago | Para pagamentos |
| `MAPBOX_ACCESS_TOKEN` | Token público do Mapbox | Para mapas |

**Secrets automáticos (já configurados pelo Supabase):**
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Configurar Webhook do MercadoPago

No painel do MercadoPago, configurar webhook para:
```
https://SEU-PROJECT-ID.supabase.co/functions/v1/mercadopago-webhook
```

Eventos:
- `payment.created`
- `payment.updated`

## Configurar CRON para Pagamentos Expirados

O Supabase oferece pg_cron para tarefas agendadas. Adicione no SQL Editor:

```sql
-- Habilitar extensão (se não habilitada)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Criar job para verificar pagamentos expirados a cada 5 minutos
SELECT cron.schedule(
  'check-expired-payments',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://SEU-PROJECT-ID.supabase.co/functions/v1/check-expired-payments',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

## Testar Edge Functions

```bash
# Testar função pública
curl https://SEU-PROJECT-ID.supabase.co/functions/v1/get-manifest

# Testar função autenticada (precisa do token)
curl -H "Authorization: Bearer SEU_JWT_TOKEN" \
  https://SEU-PROJECT-ID.supabase.co/functions/v1/get-mapbox-token
```

## Troubleshooting

### Erro: "Function not found"
- Verifique se o deploy foi concluído
- Verifique o nome da função

### Erro: "JWT expired"
- Gere um novo token de acesso
- Verifique se o usuário está autenticado

### Erro: "Secret not found"
- Adicione o secret no Dashboard do Supabase
- Verifique o nome exato do secret

### Logs
```bash
# Ver logs de uma função específica
supabase functions logs admin-create-user

# Acompanhar logs em tempo real
supabase functions logs --follow
```
