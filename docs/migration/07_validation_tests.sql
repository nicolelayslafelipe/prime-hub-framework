-- =====================================================
-- SCRIPT DE VALIDAÇÃO PÓS-MIGRAÇÃO
-- Sistema de Delivery - DeliveryOS
-- Execute após rodar todos os scripts de migração
-- =====================================================

-- 1. VERIFICAR TABELAS CRIADAS
-- =====================================================
SELECT 
    'Tabelas' as categoria,
    COUNT(*) as total,
    CASE WHEN COUNT(*) >= 29 THEN '✅ OK' ELSE '❌ FALTANDO' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

-- Listar tabelas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. VERIFICAR FUNÇÕES CRIADAS
-- =====================================================
SELECT 
    'Funções' as categoria,
    COUNT(*) as total,
    CASE WHEN COUNT(*) >= 12 THEN '✅ OK' ELSE '❌ FALTANDO' END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.prokind = 'f';

-- Listar funções
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- 3. VERIFICAR TRIGGERS CRIADOS
-- =====================================================
SELECT 
    'Triggers' as categoria,
    COUNT(*) as total,
    CASE WHEN COUNT(*) >= 25 THEN '✅ OK' ELSE '❌ FALTANDO' END as status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
AND NOT t.tgisinternal;

-- Listar triggers
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 4. VERIFICAR RLS HABILITADO
-- =====================================================
SELECT 
    'RLS Habilitado' as categoria,
    COUNT(*) as total,
    CASE WHEN COUNT(*) >= 29 THEN '✅ OK' ELSE '⚠️ VERIFICAR' END as status
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true;

-- Tabelas SEM RLS (devem ser 0)
SELECT tablename as 'Tabelas SEM RLS (PROBLEMA!)'
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = false;

-- 5. VERIFICAR POLÍTICAS RLS
-- =====================================================
SELECT 
    'Políticas RLS' as categoria,
    COUNT(*) as total,
    CASE WHEN COUNT(*) >= 60 THEN '✅ OK' ELSE '❌ FALTANDO' END as status
FROM pg_policies
WHERE schemaname = 'public';

-- Listar políticas por tabela
SELECT 
    tablename,
    COUNT(*) as num_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- 6. VERIFICAR ENUM
-- =====================================================
SELECT 
    'ENUM app_role' as categoria,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'app_role'
    ) THEN '✅ OK' ELSE '❌ FALTANDO' END as status;

-- 7. VERIFICAR ÍNDICES
-- =====================================================
SELECT 
    'Índices' as categoria,
    COUNT(*) as total,
    CASE WHEN COUNT(*) >= 15 THEN '✅ OK' ELSE '⚠️ VERIFICAR' END as status
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname NOT LIKE '%_pkey';

-- 8. VERIFICAR STORAGE BUCKETS
-- =====================================================
SELECT 
    'Storage Buckets' as categoria,
    COUNT(*) as total,
    CASE WHEN COUNT(*) >= 3 THEN '✅ OK' ELSE '❌ FALTANDO' END as status
FROM storage.buckets;

-- Listar buckets
SELECT id, name, public 
FROM storage.buckets
ORDER BY name;

-- 9. VERIFICAR REALTIME
-- =====================================================
SELECT 
    'Realtime Tables' as categoria,
    COUNT(*) as total
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';

-- Listar tabelas com realtime
SELECT tablename 
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- 10. VERIFICAR DADOS INICIAIS
-- =====================================================
SELECT 'Categorias' as tabela, COUNT(*) as registros FROM public.categories
UNION ALL
SELECT 'Produtos', COUNT(*) FROM public.products
UNION ALL
SELECT 'Métodos Pagamento', COUNT(*) FROM public.payment_methods
UNION ALL
SELECT 'Banners', COUNT(*) FROM public.banners
UNION ALL
SELECT 'Templates Mensagem', COUNT(*) FROM public.message_templates
UNION ALL
SELECT 'Config Estabelecimento', COUNT(*) FROM public.establishment_settings
UNION ALL
SELECT 'Config Som', COUNT(*) FROM public.sound_settings
UNION ALL
SELECT 'Config Fidelidade', COUNT(*) FROM public.loyalty_settings;

-- =====================================================
-- RESUMO FINAL
-- =====================================================
SELECT '========================================' as "";
SELECT 'RESUMO DA VALIDAÇÃO' as "";
SELECT '========================================' as "";

SELECT 
    'Migração' as "",
    CASE 
        WHEN (
            (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') >= 29
            AND (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') >= 60
            AND (SELECT COUNT(*) FROM storage.buckets) >= 3
        ) THEN '✅ COMPLETA - Pronto para produção!'
        ELSE '⚠️ INCOMPLETA - Verifique os itens acima'
    END as status;
