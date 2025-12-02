# 💪 Mova+

> Planos fitness personalizados com Inteligência Artificial

O Mova+ é uma plataforma inovadora que utiliza inteligência artificial para criar planos de treino e nutrição totalmente personalizados para cada usuário. Desenvolvido com tecnologia de ponta para transformar a jornada fitness de forma inteligente e eficaz.

## ✨ Funcionalidades

- 🤖 **Geração de Planos com IA** - Planos personalizados baseados em avaliações físicas
- 📄 **Processamento de PDFs** - Upload e análise automática de avaliações físicas
- 📊 **Dashboard Completo** - Acompanhamento de evolução e atividades
- 💳 **Sistema de Pagamento** - Integração com Stripe para compra de prompts
- 📧 **Newsletter** - Sistema de inscrição e envio de emails
- 🔐 **Autenticação Completa** - Login seguro com Supabase
- 📱 **Design Responsivo** - Experiência otimizada para mobile e desktop
- ⚡ **Scroll Reveal** - Animações fluidas em todas as páginas

## 🛠️ Tecnologias

### Frontend
- **Next.js 15** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização utility-first
- **Framer Motion** - Animações fluidas
- **React Hook Form** - Gerenciamento de formulários

### Backend
- **Next.js API Routes** - API Serverless
- **Supabase** - Autenticação e Banco de Dados
- **OpenAI GPT-4** - Geração de planos com IA
- **Stripe** - Processamento de pagamentos
- **Nodemailer** - Envio de emails via Gmail SMTP

### Ferramentas
- **Vitest** - Testes unitários
- **ESLint** - Linter
- **Prettier** - Formatação de código
- **Bun** - Runtime e gerenciador de pacotes

## 🚀 Começando

### Pré-requisitos

- Node.js 18+ ou Bun
- Conta no Supabase
- Chave da API OpenAI
- Conta no Stripe (para pagamentos)
- Conta no Gmail (para envio de emails)

### Instalação

1. **Clone o repositório**

```bash
git clone [seu-repositorio]
cd mova
```

2. **Instale as dependências**

```bash
bun install
# ou
npm install
```

3. **Configure as variáveis de ambiente**

Copie o arquivo `env-example.txt` para `.env.local` e preencha com suas credenciais:

```bash
cp env-example.txt .env.local
```

4. **Configure as variáveis necessárias**

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima

# OpenAI
OPENAI_API_KEY=sua_chave_openai

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=sua_chave_publica
STRIPE_SECRET_KEY=sua_chave_secreta
STRIPE_WEBHOOK_SECRET=sua_chave_webhook

# Gmail (para envio de emails)
GMAIL_USER=seu_email@gmail.com
GMAIL_APP_PASSWORD=sua_senha_de_app

# Emails
NEXT_PUBLIC_CONTACT_EMAIL=seu_email@gmail.com
NEXT_PUBLIC_NEWSLETTER_EMAIL=seu_email@gmail.com
```

📖 **Documentação completa:**
- [Como configurar Gmail](./docs/CONFIGURAR_GMAIL.md)
- [Variáveis de ambiente no Vercel](./docs/VERCEL_ENV_VARIABLES.md)

### Executar o projeto

```bash
# Desenvolvimento
bun dev
# ou
npm run dev

# Build para produção
bun run build

# Iniciar servidor de produção
bun start
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

## 📜 Scripts Disponíveis

```bash
# Desenvolvimento
bun dev              # Inicia servidor de desenvolvimento com Turbopack

# Build
bun run build        # Gera build de produção

# Qualidade de código
bun run lint         # Executa ESLint
bun run lint:fix     # Corrige problemas do ESLint
bun run format       # Formata código com Prettier
bun run typecheck    # Verifica tipos TypeScript

# Testes
bun test             # Executa testes
bun test:ui          # Interface visual de testes
bun test:run         # Executa testes sem watch mode
bun test:coverage    # Cobertura de testes
```

## 📁 Estrutura do Projeto

```
mova/
├── src/
│   ├── app/                    # Páginas e rotas (App Router)
│   │   ├── api/                # API Routes
│   │   ├── dashboard/          # Dashboard do usuário
│   │   ├── auth/               # Autenticação
│   │   └── register/           # Cadastro
│   ├── components/             # Componentes React
│   │   ├── ui/                 # Componentes de UI
│   │   └── admin/              # Componentes administrativos
│   ├── hooks/                  # React Hooks customizados
│   ├── lib/                    # Utilitários e configurações
│   └── types/                  # Definições TypeScript
├── public/                     # Arquivos estáticos
├── docs/                       # Documentação
└── package.json
```

## 🔧 Configuração Adicional

### Configurar Admin

Para acessar o painel administrativo, siga as instruções em:
- [Configuração de Admin](./docs/ADMIN_SETUP.md)

### Configurar Banco de Dados

O projeto usa Supabase. Certifique-se de que as tabelas necessárias estão criadas no seu projeto Supabase.

## 🚢 Deploy

### Vercel (Recomendado)

1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente no painel do Vercel
3. Deploy automático a cada push

📖 Veja: [Configurar variáveis no Vercel](./docs/VERCEL_ENV_VARIABLES.md)

### Outras Plataformas

O projeto pode ser deployado em qualquer plataforma que suporte Next.js:
- Railway
- Render
- AWS
- DigitalOcean

## 📚 Documentação

- [Configurar Gmail](./docs/CONFIGURAR_GMAIL.md) - Como configurar envio de emails
- [Variáveis no Vercel](./docs/VERCEL_ENV_VARIABLES.md) - Configurar variáveis de ambiente
- [Setup Admin](./docs/ADMIN_SETUP.md) - Configurar painel administrativo
- [Reutilização de Tabelas](./docs/REUTILIZACAO_TABELAS_NORMALIZADAS.md) - Documentação técnica

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto é privado e proprietário.

## 👥 Equipe

Desenvolvido com ❤️ para transformar vidas através da tecnologia e fitness.

## 🔗 Links Úteis

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [OpenAI API](https://platform.openai.com/docs)

---

**Mova+** - Seu plano fitness personalizado com IA 🚀
