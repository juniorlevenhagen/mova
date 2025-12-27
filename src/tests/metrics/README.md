# Testes do Sistema de Métricas e Insights

Este diretório contém testes para validar o sistema de métricas, resumos e insights automáticos.

## Testes Disponíveis

### 1. `metricsInsights.test.ts`

Testa a geração de insights automáticos em diferentes cenários:

- Perfil Atleta com problema de séries por sessão
- Perfil Sedentário com sistema funcionando bem
- Perfil Alto Rendimento com múltiplos problemas
- Problemas de inconsistência entre dias
- Sistema funcionando perfeitamente
- Validação de sugestões específicas

### 2. `metricsSummaryIntegration.test.ts`

Testes de integração que simulam perfis reais:

- Simula semanas/meses de uso
- Valida detecção de problemas específicos
- Testa thresholds e limites configurados
- Valida geração de sugestões automáticas

## Como Executar

### Executar todos os testes

```bash
bun run test
```

### Executar apenas testes de métricas

```bash
bunx vitest src/tests/metrics
```

### Executar com interface visual

```bash
bun run test:ui
```

### Executar em modo watch

```bash
bunx vitest --watch src/tests/metrics
```

### Executar com coverage

```bash
bun run test:coverage
```

## Cenários de Teste

### Cenário 1: Atleta com Problema de Ombros

Simula um perfil Atleta onde:

- 45% dos planos são rejeitados
- 44.4% das rejeições são por "excesso_series_por_sessao"
- 40% das rejeições envolvem o músculo "ombro"
- 55.6% das rejeições ocorrem em dias "push"

**Insights esperados:**

- Taxa de rejeição alta
- Aumento significativo de rejeições
- Problema específico com ombro
- Problema em dias Push
- Problema no nível Atleta

### Cenário 2: Sedentário - Sistema Funcionando Bem

Simula um perfil Sedentário onde:

- Apenas 3% dos planos são rejeitados
- Score de qualidade de 94/100
- Taxa de correção de 100%

**Insights esperados:**

- Apenas insights positivos
- Nenhum problema detectado
- Sistema funcionando bem

### Cenário 3: Alto Rendimento - Múltiplos Problemas

Simula um perfil Alto Rendimento com:

- 40% de taxa de rejeição
- Score de qualidade baixo (68/100)
- Múltiplos problemas (séries semanais, padrões motores)
- Problemas em músculos específicos (quadríceps, posterior)

**Insights esperados:**

- Múltiplos insights de problema
- Sugestões específicas para cada problema
- Detecção de problemas por nível, dia e músculo

## Validações Realizadas

Os testes validam:

1. **Detecção de Problemas:**
   - Taxa de rejeição alta (> 20%)
   - Aumento significativo de rejeições (> 30%)
   - Score de qualidade baixo (< 70)
   - Taxa de correção baixa (< 80%)

2. **Detecção de Sucessos:**
   - Taxa de rejeição baixa (< 5%)
   - Score de qualidade excelente (>= 90)
   - Taxa de correção alta (> 95%)

3. **Análise Segmentada:**
   - Por nível de atividade
   - Por tipo de dia (Push/Pull/Lower)
   - Por músculo específico

4. **Sugestões Automáticas:**
   - Funções específicas a revisar
   - Configurações a ajustar
   - Arquivos relacionados

## Estrutura dos Testes

Cada teste segue o padrão:

1. **Arrange**: Cria um `MetricsSummary` simulando dados reais
2. **Act**: Chama `generateInsights(summary)`
3. **Assert**: Valida se os insights gerados estão corretos

## Exemplo de Uso

```typescript
// Simular um cenário
const summary: MetricsSummary = {
  period: "weekly",
  current: {
    totalRejections: 50,
    // ... outros dados
  },
  // ...
};

// Gerar insights
const insights = generateInsights(summary);

// Validar
expect(insights.length).toBeGreaterThan(0);
expect(insights[0].suggestion).toContain("validateFrequencyVolume");
```

## Adicionando Novos Testes

Para adicionar um novo cenário de teste:

1. Crie um novo `describe` block
2. Defina um `MetricsSummary` com dados simulados
3. Chame `generateInsights(summary)`
4. Valide os insights esperados

Exemplo:

```typescript
describe("Novo Cenário", () => {
  it("deve detectar X", () => {
    const summary: MetricsSummary = {
      /* ... */
    };
    const insights = generateInsights(summary);
    expect(insights.some((i) => i.title === "Título esperado")).toBe(true);
  });
});
```
