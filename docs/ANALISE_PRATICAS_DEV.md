# 📊 Análise de Práticas de Desenvolvimento - Mova

## ✅ O que você JÁ está fazendo bem:

1. **TypeScript com strict mode** - Configuração correta
2. **ESLint configurado** - Next.js core-web-vitals
3. **Estrutura organizada** - Separação de componentes, hooks, libs
4. **Type checking** - Script `typecheck` no package.json
5. **Git** - Versionamento adequado
6. **Next.js 15** - Framework moderno
7. **Supabase** - Backend como serviço bem estruturado

---

## 🚨 FERRAMENTAS E PRÁTICAS CRÍTICAS QUE ESTÃO FALTANDO:

### 1. **TESTES AUTOMATIZADOS** ⚠️ CRÍTICO

**Status:** ❌ Nenhum teste encontrado

**Impacto:**

- Sem testes, você não tem confiança ao refatorar
- Bugs podem chegar em produção
- Mudanças quebram funcionalidades existentes

**O que implementar:**

```bash
# Instalar ferramentas de teste
bun add -d vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react jsdom
```

**Estrutura sugerida:**

```
src/
  __tests__/
    api/
      generate-plan.test.ts
      verify-payment.test.ts
    components/
      PersonalizedPlanModal.test.tsx
    hooks/
      useTrial.test.ts
```

**Exemplo de teste:**

```typescript
// src/__tests__/api/generate-plan.test.ts
import { describe, it, expect, vi } from "vitest";
import { POST } from "@/app/api/generate-plan/route";

describe("generate-plan API", () => {
  it("should return 401 when not authenticated", async () => {
    const request = new Request("http://localhost/api/generate-plan", {
      method: "POST",
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });
});
```

**Scripts para adicionar no package.json:**

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

---

### 2. **PREttier** - Formatação Automática

**Status:** ❌ Não configurado

**Impacto:**

- Código inconsistente entre desenvolvedores
- Diferenças de estilo causam conflitos no Git

**O que fazer:**

```bash
bun add -d prettier eslint-config-prettier eslint-plugin-prettier
```

**Criar `.prettierrc`:**

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

**Adicionar script:**

```json
{
  "scripts": {
    "format": "prettier --write \"src/**/*.{ts,tsx,json,css}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,json,css}\""
  }
}
```

---

### 3. **Husky + lint-staged** - Git Hooks

**Status:** ❌ Não configurado

**Impacto:**

- Commits com código quebrado podem ser feitos
- Código sem formatação vai para o repositório

**O que fazer:**

```bash
bun add -d husky lint-staged
bunx husky init
```

**Configurar `.husky/pre-commit`:**

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

bun run lint-staged
```

**Adicionar no package.json:**

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"]
  }
}
```

---

### 4. **CI/CD Pipeline** - GitHub Actions

**Status:** ❌ Não configurado

**Impacto:**

- Sem validação automática em PRs
- Bugs podem ser mergeados
- Deploy manual propenso a erros

**Criar `.github/workflows/ci.yml`:**

```yaml
name: CI

on:
  push:
    branches: [master, main]
  pull_request:
    branches: [master, main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run lint
      - run: bun run typecheck
      - run: bun run test
      - run: bun run build
```

---

### 5. **Variáveis de Ambiente Documentadas**

**Status:** ⚠️ Parcial (existe `env-example.txt` mas pode melhorar)

**O que fazer:**

Criar `.env.example` (não `.env-example.txt`):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Google Cloud (se aplicável)
project_id=your_project_id
private_key=your_private_key
client_email=your_client_email
```

**Adicionar validação no código:**

```typescript
// src/lib/env.ts
export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  openaiKey: process.env.OPENAI_API_KEY!,
} as const;

// Validar no início da aplicação
Object.entries(env).forEach(([key, value]) => {
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
});
```

---

### 6. **Logging Estruturado** - Substituir console.log

**Status:** ⚠️ Usando console.log (229 ocorrências)

**Problema:**

- `console.log` não é adequado para produção
- Difícil filtrar e analisar logs
- Sem níveis de log (info, warn, error)

**Solução:**

```bash
bun add pino pino-pretty
```

**Criar `src/lib/logger.ts`:**

```typescript
import pino from "pino";

export const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  transport:
    process.env.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
          },
        }
      : undefined,
});

// Uso:
// logger.info('Plano gerado com sucesso', { planId, userId });
// logger.error('Erro ao gerar plano', { error, userId });
```

---

### 7. **Error Tracking** - Sentry ou similar

**Status:** ❌ Não configurado

**Impacto:**

- Erros em produção não são rastreados
- Sem contexto sobre quando/onde erros ocorrem

**Solução:**

```bash
bun add @sentry/nextjs
bunx @sentry/wizard@latest -i nextjs
```

**Configurar em `sentry.client.config.ts`:**

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
```

---

### 8. **Documentação de API** - OpenAPI/Swagger

**Status:** ❌ Não documentado

**Impacto:**

- Difícil entender endpoints disponíveis
- Sem contrato claro para frontend/backend

**Solução:**

```bash
bun add -d swagger-jsdoc swagger-ui-react
```

**Criar `src/lib/swagger.ts`:**

```typescript
import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Mova API",
      version: "1.0.0",
    },
  },
  apis: ["./src/app/api/**/route.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
```

---

### 9. **Type Safety Melhorado** - Zod para Validação

**Status:** ⚠️ Zod instalado mas pode ser usado mais

**O que fazer:**

Validar todas as entradas de API com Zod:

```typescript
// src/lib/validations/api.ts
import { z } from "zod";

export const generatePlanSchema = z.object({
  usePrompt: z.boolean().optional(),
  planType: z.enum(["single", "package"]).optional(),
});

export type GeneratePlanInput = z.infer<typeof generatePlanSchema>;
```

**Usar nas rotas:**

```typescript
export async function POST(request: NextRequest) {
  const body = await request.json();
  const validated = generatePlanSchema.safeParse(body);

  if (!validated.success) {
    return NextResponse.json(
      { error: "Invalid input", details: validated.error },
      { status: 400 }
    );
  }

  // Usar validated.data (type-safe)
}
```

---

### 10. **Testes E2E** - Playwright ou Cypress

**Status:** ❌ Não configurado

**Para fluxos críticos:**

- Geração de plano
- Processo de pagamento
- Autenticação

**Solução:**

```bash
bun add -d @playwright/test
bunx playwright install
```

**Criar `playwright.config.ts`:**

```typescript
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: "http://localhost:3000",
  },
});
```

**Exemplo de teste E2E:**

```typescript
// e2e/generate-plan.spec.ts
import { test, expect } from "@playwright/test";

test("should generate a plan successfully", async ({ page }) => {
  await page.goto("/dashboard");
  await page.click("text=Gerar Plano Personalizado");
  await expect(page.locator("text=Plano gerado com sucesso")).toBeVisible();
});
```

---

### 11. **Code Coverage** - Cobertura de Testes

**Status:** ❌ Não configurado

**Solução:**

```bash
bun add -d @vitest/coverage-v8
```

**Configurar em `vitest.config.ts`:**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "src/__tests__/"],
    },
  },
});
```

---

### 12. **Dependabot / Renovate** - Atualização Automática

**Status:** ❌ Não configurado

**Criar `.github/dependabot.yml`:**

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
```

---

### 13. **Changelog Automático** - Conventional Commits

**Status:** ⚠️ Commits não seguem padrão

**O que fazer:**

Usar Conventional Commits:

- `feat:` nova funcionalidade
- `fix:` correção de bug
- `docs:` documentação
- `refactor:` refatoração
- `test:` testes
- `chore:` manutenção

**Ferramenta:**

```bash
bun add -d @commitlint/cli @commitlint/config-conventional
```

**Criar `commitlint.config.js`:**

```javascript
module.exports = {
  extends: ["@commitlint/config-conventional"],
};
```

---

### 14. **Bundle Analyzer** - Análise de Tamanho

**Status:** ❌ Não configurado

**Solução:**

```bash
bun add -d @next/bundle-analyzer
```

**Configurar em `next.config.ts`:**

```typescript
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default withBundleAnalyzer(nextConfig);
```

**Script:**

```json
{
  "scripts": {
    "analyze": "ANALYZE=true bun run build"
  }
}
```

---

### 15. **Database Migrations** - Versionamento de Schema

**Status:** ⚠️ Parcial (tem algumas migrations mas pode melhorar)

**O que fazer:**

Criar estrutura organizada:

```
supabase_migrations/
  ├── 001_initial_schema.sql
  ├── 002_add_user_trials.sql
  ├── 003_add_plan_tables.sql
  └── ...
```

**Script para rodar migrations:**

```bash
# Criar script para aplicar migrations
bun add -d supabase
```

---

## 📊 PRIORIZAÇÃO - O que implementar PRIMEIRO:

### 🔴 CRÍTICO (Fazer AGORA):

1. **Testes Unitários** - Vitest
2. **Prettier** - Formatação
3. **Husky + lint-staged** - Git hooks
4. **Error Tracking** - Sentry
5. **Logging Estruturado** - Pino

### 🟡 IMPORTANTE (Próximas 2 semanas):

6. **CI/CD** - GitHub Actions
7. **Validação com Zod** - Type safety
8. **Documentação de API** - Swagger
9. **Variáveis de Ambiente** - Validação

### 🟢 DESEJÁVEL (Próximo mês):

10. **Testes E2E** - Playwright
11. **Code Coverage** - Cobertura
12. **Bundle Analyzer** - Otimização
13. **Conventional Commits** - Padronização

---

## 🎯 RESUMO EXECUTIVO:

**Pontos Fortes:**

- ✅ TypeScript bem configurado
- ✅ Estrutura de projeto organizada
- ✅ Framework moderno (Next.js 15)

**Principais Gaps:**

- ❌ **ZERO testes** (crítico!)
- ❌ Sem CI/CD
- ❌ Sem error tracking
- ❌ Logging inadequado (console.log)
- ❌ Sem formatação automática

**ROI (Retorno sobre Investimento):**

- **Testes:** Reduz bugs em 70-80%
- **CI/CD:** Economiza 10-15h/semana em deploy
- **Error Tracking:** Detecta 90% dos bugs antes do usuário reportar
- **Prettier:** Economiza 2-3h/semana em code review

---

## 📚 RECURSOS PARA APRENDER:

1. **Testing:** [Testing Library Docs](https://testing-library.com/)
2. **CI/CD:** [GitHub Actions Docs](https://docs.github.com/en/actions)
3. **Error Tracking:** [Sentry Next.js Guide](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
4. **Best Practices:** [Next.js Best Practices](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming)

---

**Próximo Passo Recomendado:** Começar com Testes Unitários (Vitest) + Prettier. São as mudanças com maior impacto imediato.
