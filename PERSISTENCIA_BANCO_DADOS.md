# 💾 Persistência em Banco de Dados - Métricas de Rejeição

## ✅ Implementação Completa

Sistema de persistência em banco de dados (Supabase) implementado para métricas de rejeição de planos.

---

## 📁 Arquivos Criados/Modificados

### 1. **`supabase/migrations/create_plan_rejection_metrics.sql`** ✅
Script de migração SQL para criar a tabela:
- ✅ Tabela `plan_rejection_metrics`
- ✅ Índices para performance
- ✅ Políticas RLS (Row Level Security)
- ✅ Função de limpeza automática (opcional)

### 2. **`src/lib/metrics/planRejectionMetrics.ts`** ✅
Sistema atualizado com persistência:
- ✅ Persistência automática no banco
- ✅ Fallback para memória se banco falhar
- ✅ Métodos assíncronos para banco
- ✅ Métodos síncronos para memória (compatibilidade)

### 3. **`src/app/api/metrics/plan-rejections/route.ts`** ✅
Endpoint atualizado:
- ✅ Busca do banco de dados por padrão
- ✅ Fallback para memória se necessário
- ✅ Parâmetro `source` para forçar memória se necessário

---

## 🗄️ Estrutura da Tabela

```sql
CREATE TABLE plan_rejection_metrics (
  id UUID PRIMARY KEY,
  reason TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  context JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);
```

### Campos:
- **`id`**: UUID único (gerado automaticamente)
- **`reason`**: Motivo da rejeição (enum validado)
- **`timestamp`**: Timestamp Unix em milissegundos
- **`context`**: Contexto adicional (JSONB)
- **`created_at`**: Data/hora de criação no banco

### Índices:
- `idx_plan_rejection_metrics_timestamp` - Ordenação por data
- `idx_plan_rejection_metrics_reason` - Filtro por motivo
- `idx_plan_rejection_metrics_created_at` - Ordenação por criação
- `idx_plan_rejection_metrics_context` - Busca em JSONB (GIN)
- `idx_plan_rejection_metrics_timestamp_reason` - Consultas compostas

---

## 🔧 Configuração

### Variáveis de Ambiente Necessárias

```env
# Obrigatórias (já devem existir)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Opcional (recomendado para produção)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Nota:** Se `SUPABASE_SERVICE_ROLE_KEY` não estiver configurado, o sistema usará `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Isso pode falhar se as políticas RLS bloquearem INSERTs.

---

## 📋 Como Aplicar a Migração

### Opção 1: Via Supabase Dashboard
1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Cole o conteúdo de `supabase/migrations/create_plan_rejection_metrics.sql`
4. Execute o script

### Opção 2: Via Supabase CLI
```bash
# Se você usa Supabase CLI
supabase db push
```

### Opção 3: Via SQL direto
Execute o SQL diretamente no banco de dados.

---

## 🔐 Políticas RLS (Row Level Security)

### Políticas Configuradas:
1. **INSERT**: Permitido para todos (sistema precisa registrar)
2. **SELECT**: Apenas usuários autenticados
3. **DELETE**: Apenas service_role (limpeza/manutenção)

### Ajustar Políticas (Opcional):
Se quiser restringir SELECT apenas para admins:

```sql
-- Remover política atual
DROP POLICY IF EXISTS "Allow select for authenticated users" ON plan_rejection_metrics;

-- Criar política apenas para admins
CREATE POLICY "Allow select for admins only" ON plan_rejection_metrics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email IN ('admin@example.com', 'outro-admin@example.com')
    )
  );
```

---

## 🚀 Funcionamento

### Fluxo de Persistência

1. **Rejeição ocorre** → `recordPlanRejection()` é chamado
2. **Métrica adicionada em memória** (fallback imediato)
3. **Tentativa de persistir no banco** (assíncrono, não bloqueia)
4. **Se banco falhar** → continua funcionando com memória
5. **Logs de erro** → mas não interrompe o fluxo

### Consulta de Métricas

1. **Endpoint chamado** → `/api/metrics/plan-rejections`
2. **Tenta buscar do banco** (se habilitado)
3. **Se banco falhar** → fallback para memória
4. **Retorna estatísticas** → sempre funciona

---

## 📊 Métodos Disponíveis

### Persistência (Assíncrono)
```typescript
// Registrar rejeição (persiste no banco)
await recordPlanRejection(reason, context);

// Obter estatísticas do banco
const stats = await planRejectionMetrics.getStatisticsFromDB();

// Obter últimas 24h do banco
const stats24h = await planRejectionMetrics.getLast24HoursStatisticsFromDB();

// Obter métricas por período do banco
const metrics = await planRejectionMetrics.getMetricsByPeriodFromDB(start, end);
```

### Memória (Síncrono - Fallback)
```typescript
// Obter estatísticas da memória
const stats = planRejectionMetrics.getStatistics();

// Obter últimas 24h da memória
const stats24h = planRejectionMetrics.getLast24HoursStatistics();
```

---

## 🔍 Verificação

### Verificar se Persistência Está Habilitada
```typescript
const isEnabled = planRejectionMetrics.isPersistenceEnabled();
console.log("Persistência:", isEnabled ? "Habilitada" : "Desabilitada");
```

### Verificar Dados no Banco
```sql
-- Contar total de métricas
SELECT COUNT(*) FROM plan_rejection_metrics;

-- Ver últimas 10 rejeições
SELECT reason, timestamp, context, created_at
FROM plan_rejection_metrics
ORDER BY timestamp DESC
LIMIT 10;

-- Estatísticas por motivo
SELECT reason, COUNT(*) as count
FROM plan_rejection_metrics
GROUP BY reason
ORDER BY count DESC;
```

---

## 🧹 Limpeza Automática

A função `cleanup_old_rejection_metrics()` remove registros com mais de 90 dias.

### Executar Manualmente:
```sql
SELECT cleanup_old_rejection_metrics();
```

### Agendar no Supabase (Cron Job):
1. Acesse **Database** → **Functions**
2. Crie um cron job que execute a função semanalmente

---

## ⚠️ Considerações

### Performance
- ✅ Índices criados para otimizar consultas
- ✅ Limite de 10.000 registros em memória
- ✅ Consultas paginadas no banco (limite padrão: 10.000)

### Segurança
- ✅ RLS habilitado
- ✅ Service role key recomendado para INSERTs
- ✅ Validação de `reason` via CHECK constraint

### Confiabilidade
- ✅ Fallback automático para memória
- ✅ Não bloqueia validação se banco falhar
- ✅ Logs de erro para debugging

---

## 🐛 Troubleshooting

### Problema: Métricas não estão sendo persistidas

**Verificar:**
1. Variáveis de ambiente configuradas?
2. Tabela criada no banco?
3. Políticas RLS permitem INSERT?
4. Service role key configurado?

**Solução:**
```typescript
// Verificar status
console.log("Persistence enabled:", planRejectionMetrics.isPersistenceEnabled());

// Verificar logs do console
// Deve aparecer: "[PlanRejectionMetrics] Erro ao persistir métrica..."
```

### Problema: Endpoint retorna dados vazios

**Verificar:**
1. Há dados no banco? (`SELECT COUNT(*) FROM plan_rejection_metrics`)
2. Políticas RLS permitem SELECT?
3. Usuário autenticado?

**Solução:**
- Usar `?source=memory` para forçar memória
- Verificar logs do endpoint

---

## ✅ Status

- ✅ Migração SQL criada
- ✅ Sistema de persistência implementado
- ✅ Fallback para memória funcionando
- ✅ Endpoint atualizado
- ✅ Documentação completa

**Pronto para uso em produção!**

---

## 📝 Próximos Passos (Opcional)

1. **Agendar Limpeza Automática**
   - Configurar cron job no Supabase
   - Executar `cleanup_old_rejection_metrics()` semanalmente

2. **Backup de Dados**
   - Exportar métricas periodicamente
   - Armazenar em storage externo

3. **Análise Avançada**
   - Criar views materializadas
   - Agregar dados por período
   - Gerar relatórios automáticos

