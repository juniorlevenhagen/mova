# Guia de Acesso - Área Administrativa do Blog

## Como Acessar a Área de Criação/Edição de Posts

### 1. URL de Acesso

Acesse diretamente pelo navegador:
```
http://localhost:3000/admin/blog
```
(ou o domínio do seu site em produção)

### 2. Requisitos de Acesso

Para acessar a área administrativa do blog, você precisa:

1. **Estar autenticado** - Fazer login no sistema
2. **Ter permissão de administrador** - Seu usuário precisa ter o campo `admin: true` na tabela `users` do Supabase

### 3. Passo a Passo

#### Se você já tem uma conta de administrador:

1. Acesse: `/auth/login`
2. Faça login com suas credenciais
3. Você será redirecionado automaticamente para `/admin/blog` (se tiver permissão de admin)

#### Se você não tem permissão de admin ainda:

Você precisa atualizar seu usuário no Supabase:

1. Acesse o painel do Supabase
2. Vá em **Table Editor** → Tabela `users`
3. Encontre seu usuário (pelo `id` ou `email`)
4. Edite o registro e marque o campo `admin` como `true`
5. Salve as alterações
6. Faça logout e login novamente no site

### 4. Funcionalidades Disponíveis

#### Página Principal: `/admin/blog`

- **Lista todos os posts** criados
- **Visualizar** posts (ícone de olho)
- **Editar** posts (ícone de lápis)
- **Excluir** posts (ícone de lixeira)
- **Criar novo post** (botão "Novo Post")

#### Criar Novo Post: `/admin/blog/new`

Formulário completo com os seguintes campos:

- **Título** (obrigatório) - Gera o slug automaticamente
- **Slug** (URL amigável) - Gerado automaticamente do título
- **Excerpt** (resumo) - Texto curto que aparece na listagem
- **Conteúdo** - Conteúdo principal do artigo (texto longo)
- **Autor** - Nome do autor (preenchido automaticamente com seu nome)
- **Categoria** - Treino, Nutrição, Motivação, Recuperação, Mindset
- **Tempo de leitura** - Ex: "5 min", "7 min"
- **Data de publicação** - Quando o post será publicado
- **Key Takeaways** (insights principais) - Lista de pontos-chave
- **Seções** - Seções com título e corpo do texto
- **Citação destacada** - Citação opcional com autor

#### Editar Post: `/admin/blog/[slug]/edit`

Mesmo formulário de criação, mas pré-preenchido com os dados do post existente.

### 5. Estrutura de Dados no Supabase

O blog usa a tabela `blog_posts` no Supabase com os seguintes campos:

```typescript
{
  id: string (UUID)
  slug: string (único, usado na URL)
  title: string
  excerpt: string | null
  content: string | null (ou array de strings)
  author: string | null
  category: string | null (Treino, Nutrição, Motivação, Recuperação, Mindset)
  read_time: string | null
  published_at: timestamp | null (quando será publicado)
  created_at: timestamp
  key_takeaways: string[] | null
  sections: Array<{ heading?: string, body?: string }> | null
  highlighted_quote: { text?: string, author?: string } | null
  cover_image: string | null (URL da imagem)
}
```

### 6. Visualização Pública

Os posts criados aparecem em:
- **Listagem do blog:** `/blog`
- **Post individual:** `/blog/[slug]`

**Importante:** Posts só aparecem publicamente se:
- Tiverem `published_at` preenchido
- A data de `published_at` for menor ou igual à data atual

### 7. Dicas de Uso

1. **Slug único:** O slug é gerado automaticamente do título, mas você pode editá-lo. Certifique-se de que seja único.

2. **Data de publicação:** Se você definir uma data futura, o post não aparecerá no blog até aquela data.

3. **Conteúdo:** Você pode usar o campo `content` como texto simples ou como array de parágrafos.

4. **Seções:** Use as seções para organizar o conteúdo com subtítulos e parágrafos.

5. **Key Takeaways:** Esses pontos aparecem na sidebar do post como "Principais insights".

### 8. Solução de Problemas

#### "Você precisa estar autenticado"
- Faça login em `/auth/login`
- Verifique se suas credenciais estão corretas

#### "Acesso negado" ou redirecionamento para `/dashboard`
- Seu usuário não tem permissão de admin
- Atualize o campo `admin: true` na tabela `users` do Supabase

#### Posts não aparecem no blog público
- Verifique se `published_at` está preenchido
- Verifique se a data de publicação é menor ou igual à data atual
- Verifique se o slug está correto

#### Erro ao salvar post
- Verifique se o título está preenchido (obrigatório)
- Verifique se o slug é único (não pode haver outro post com o mesmo slug)
- Verifique sua conexão com o Supabase

---

## Resumo Rápido

1. **Acesse:** `http://localhost:3000/admin/blog` (ou seu domínio)
2. **Faça login** se necessário
3. **Clique em "Novo Post"** para criar
4. **Preencha o formulário** com o conteúdo
5. **Salve** e o post estará disponível no blog público (se `published_at` estiver definido)

