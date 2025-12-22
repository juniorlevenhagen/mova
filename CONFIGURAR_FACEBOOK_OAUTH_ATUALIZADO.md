# 🔵 Como Configurar Login com Facebook (Interface Atualizada 2024/2025)

## 📋 Passo a Passo Atualizado

### 1️⃣ Criar App no Facebook Developers

1. Acesse: [Facebook Developers](https://developers.facebook.com/)
2. Faça login com sua conta Facebook
3. Clique em **"My Apps"** → **"Create App"**
4. Selecione **"Consumer"** ou **"Business"**
5. Preencha:
   - **App Name**: `Mova+`
   - **App Contact Email**: Seu email
6. Clique em **"Create App"**

#### 📸 Ícone do App (Obrigatório)

O Facebook exige um ícone para o app. Requisitos:

- **Formato**: JPG, GIF ou PNG
- **Tamanho**: Entre 512x512 e 1024x1024 pixels
- **Tamanho do arquivo**: Máximo 5 MB

**Onde encontrar o logo do Mova+**:

- Os logos estão em `public/images/`:
  - `logo_blue.webp` - Logo azul
  - `logo_black.webp` - Logo preto
  - `logo_white.webp` - Logo branco
  - `logo_blue.svg` - Logo azul (SVG)
  - `logo_white.svg` - Logo branco (SVG)

**Como preparar o ícone**:

1. Use um dos logos como base (recomendo `logo_blue.webp` ou `logo_blue.svg`)
2. Converta para PNG usando um editor de imagens (Photoshop, GIMP, Canva, etc.)
3. Redimensione para **512x512 pixels** ou **1024x1024 pixels** (quadrado)
4. Se o logo for retangular, adicione padding/background para criar um quadrado
5. Salve como PNG ou JPG

**Dica**: Você pode usar ferramentas online como:

- [Canva](https://www.canva.com/) - Criar ícone 512x512
- [TinyPNG](https://tinypng.com/) - Comprimir a imagem
- [ImageResizer](https://imageresizer.com/) - Redimensionar

**Localização no Facebook**:

- Vá em **"Settings"** → **"Basic"**
- Procure por **"App Icon"** ou **"Ícone do app"**
- Faça upload da imagem

---

### 2️⃣ Adicionar Facebook Login como Produto

1. No painel do app, procure por **"Add Product"** ou **"Adicionar Produto"** (geralmente no menu lateral ou no topo)
2. Encontre **"Facebook Login"** na lista de produtos
3. Clique em **"Set Up"** ou **"Configurar"**
4. Isso adicionará o Facebook Login ao seu app

---

### 3️⃣ Configurar URIs de Redirecionamento

**IMPORTANTE**: Você precisa ir para a seção específica do Facebook Login!

#### Opção A: Pelo Menu Lateral

1. No menu lateral esquerdo, procure por **"Facebook Login"**
2. Clique em **"Facebook Login"**
3. Depois clique em **"Settings"** (ou **"Configurações"**)

#### Opção B: Se não aparecer no menu

1. No topo da página, procure por **"Products"** ou **"Produtos"**
2. Clique em **"Facebook Login"**
3. Vá em **"Settings"**

#### Na página de Settings do Facebook Login:

1. Procure por **"Valid OAuth Redirect URIs"** ou **"URIs de redirecionamento OAuth válidas"**
2. Adicione as seguintes URLs (uma por linha):

   ```
   http://localhost:3000/auth/callback
   https://movamais.fit/auth/callback
   https://ictlvqhrnhjxnhrwhfaq.supabase.co/auth/v1/callback
   ```

3. **Validador da URI de redirecionamento** (opcional):
   - Cole uma das URLs acima para testar
   - Exemplo: `https://movamais.fit/auth/callback`
   - Clique em **"Verificar"** (opcional)

4. Clique em **"Save Changes"** ou **"Salvar alterações"**

---

### 4️⃣ Adicionar Plataforma Web (Obrigatório!)

O Facebook exige que você adicione uma plataforma ao app antes de continuar.

1. No menu lateral, vá em **"Settings"** → **"Basic"** (ou **"Configurações"** → **"Básico"**)
2. Role a página até encontrar a seção **"Adicionar plataforma"** ou **"Add Platform"**
3. Clique em **"Adicionar plataforma"** ou **"Add Platform"**
4. Selecione **"Website"** ou **"Site"** da lista de opções
5. Isso adicionará a plataforma Web ao seu app

**💡 Dica**: Se você não encontrar "Add Platform", procure por:

- Um botão **"+"** ou **"Add"** na seção de plataformas
- Uma seção chamada **"Platforms"** ou **"Plataformas"**

---

### 5️⃣ Configurar App Domains (Settings → Basic)

1. Após adicionar a plataforma Web, você verá campos adicionais
2. Em **"App Domains"**, adicione:
   ```
   movamais.fit
   localhost
   ```
3. **Site URL** (se aparecer): Adicione `https://movamais.fit`
4. **Gerenciador de Domínios**: Verifique se tem `https://movamais.fit/`
5. Clique em **"Save Changes"**

---

### 6️⃣ Obter App ID e App Secret

1. Na página **"Settings"** → **"Basic"**
2. Você verá:
   - **App ID** - Copie este (é o Client ID)
   - **App Secret** - Clique em **"Show"** para revelar e copiar (é o Client Secret)
   - ⚠️ **O App Secret só aparece uma vez!** Anote com cuidado

---

### 7️⃣ Configurar Permissões

1. Vá em **"Facebook Login"** → **"Settings"**
2. Procure por **"User & Friend Permissions"** ou **"Permissões de Usuário e Amigos"**
3. Clique em **"Add Permissions"** ou **"Adicionar Permissões"**
4. Adicione:
   - ✅ `email`
   - ✅ `public_profile`
5. Clique em **"Save Changes"**

---

### 8️⃣ Configurar URL de Exclusão de Dados (Obrigatório!)

O Facebook exige uma URL de callback para exclusão de dados (GDPR/LGPD). **Esta é uma exigência obrigatória!**

#### 📍 Caminho Completo:

1. **Menu Lateral** → Clique em **"Settings"** (ou **"Configurações"**)
2. Dentro de Settings, clique em **"Basic"** (ou **"Básico"**)
3. Role a página para baixo até encontrar a seção **"Exclusão de dados do usuário"** ou **"User Data Deletion"**
   - Esta seção geralmente fica **no final da página** de Basic Settings
   - Procure por um texto que diz: _"Os apps que acessam os dados do usuário devem permitir que os usuários solicitem a exclusão de seus respectivos dados"_
4. Dentro dessa seção, você encontrará o campo **"Data Deletion Callback URL"** ou **"URL de retorno de chamada de exclusão de dados"**

#### 🗺️ Navegação Visual:

```
Facebook Developers Dashboard
└── Seu App (Mova+)
    └── Menu Lateral
        └── Settings (Configurações)
            └── Basic (Básico)
                └── [Role até o final]
                    └── Exclusão de dados do usuário
                        └── Data Deletion Callback URL
```

#### 💡 Dica:

Se não encontrar imediatamente:

- Use **Ctrl+F** (ou Cmd+F no Mac) e busque por: **"exclusão"** ou **"deletion"**
- A seção geralmente aparece **após** os campos de App ID, App Secret, etc.
- Pode estar em uma **aba separada** chamada **"Advanced"** ou **"Avançado"** em alguns casos

#### ⚠️ IMPORTANTE: Escolha a opção correta!

O Facebook oferece **duas opções**:

1. **"Retorno de chamada de exclusão"** ou **"Data Deletion Callback URL"** ✅ **USE ESTA!**
   - Esta é uma URL que o Facebook **chama automaticamente** quando um usuário solicita exclusão
   - O Facebook envia uma requisição POST para esta URL com os dados do usuário
   - Nossa rota processa automaticamente a exclusão

2. **"Instruções de exclusão"** ou **"Data Deletion Instructions URL"** ❌ **NÃO USE ESTA**
   - Esta é apenas uma URL para uma página com instruções manuais
   - O usuário teria que excluir os dados manualmente

#### O que adicionar:

1. **Escolha "Retorno de chamada de exclusão"** (Data Deletion Callback URL)
2. No campo de URL, adicione:

   ```
   https://movamais.fit/api/facebook-data-deletion
   ```

   - Para desenvolvimento (opcional): `http://localhost:3000/api/facebook-data-deletion`

3. Clique em **"Save Changes"** ou **"Salvar alterações"**

#### O que esta URL faz:

Esta rota foi criada em `src/app/api/facebook-data-deletion/route.ts` e:

- Recebe requisições do Facebook quando um usuário solicita exclusão de dados
- Identifica o usuário pelo `user_id` do Facebook
- Exclui todos os dados do usuário do banco de dados (perfil, planos, evoluções, etc.)
- Remove o usuário da autenticação
- Retorna confirmação para o Facebook

**⚠️ IMPORTANTE**:

- Esta URL é **obrigatória** para apps que acessam dados do usuário
- O Facebook **não permitirá** que o app seja publicado sem ela
- A URL deve estar acessível publicamente (não pode estar em localhost em produção)

---

### 9️⃣ Preencher Formulário de Tratamento de Dados

O Facebook exige que você responda perguntas sobre práticas de tratamento de dados (GDPR/LGPD).

#### 📋 Como Responder:

**1. Operadores de dados ou provedores de serviços?**

**Pergunta**: "Você tem operadores de dados ou provedores de serviços que terão acesso aos Dados da Plataforma?"

**Resposta**: ✅ **Sim**

**Operadores que você usa**:

- **Supabase** - Banco de dados e autenticação
- **Vercel** - Hospedagem da aplicação
- **Stripe** - Processamento de pagamentos (se aplicável)

**Como preencher**: Liste os nomes:

```
Supabase
Vercel
    Stripe
```

---

**2. Responsável pelos dados**

**Pergunta**: "Quem é a pessoa ou a entidade que será responsável por todos os Dados da Plataforma?"

**Resposta**:

- Se você tem uma **empresa registrada**: Nome da empresa (ex: "Mova+ Ltda" ou "Mova Mais Tecnologia")
- Se é **pessoa física**: Seu nome completo

**Exemplo**: `Mova Mais Tecnologia` ou `Seu Nome Completo`

---

**3. País da entidade**

**Pergunta**: "Selecione o país em que a pessoa ou a entidade está localizada."

**Resposta**: 🇧🇷 **Brasil** (ou o país onde sua empresa está registrada)

---

**4. Compartilhamento com autoridades públicas**

**Pergunta**: "Você forneceu dados pessoais a autoridades públicas em resposta a solicitações de segurança nacional nos últimos 12 meses?"

**Resposta**: ❌ **Não**

_(A menos que você realmente tenha recebido e atendido tais solicitações)_

---

**5. Processos e políticas**

**Pergunta**: "Quais dos seguintes processos ou políticas você aplica a solicitações de autoridades públicas?"

**Resposta**: Marque as opções que se aplicam:

- ✅ **Análise obrigatória sobre a legitimidade das solicitações** - Recomendado
- ✅ **Disposições para contestar os pedidos considerados ilegais** - Recomendado
- ✅ **Política de minimização de dados** - Recomendado
- ✅ **Registro dessas solicitações** - Recomendado (se você mantém registros)

**Nota**: Mesmo que você ainda não tenha políticas formais documentadas, marque as opções que você **pretende aplicar** ou que são **boas práticas**.

---

**⚠️ IMPORTANTE**:

- Essas respostas são **obrigatórias** para apps que acessam dados do usuário
- O Facebook pode rejeitar o app se as respostas não estiverem completas
- Consulte um advogado especializado em LGPD/GDPR se tiver dúvidas sobre aspectos legais

---

### 🔟 Configurar no Supabase

1. Acesse: [Supabase Dashboard](https://app.supabase.com)
2. Seu projeto → **Authentication** → **Providers**
3. Encontre **"Facebook"** e clique para **ativar**
4. Preencha:
   - **Client ID**: Cole o **App ID** do Facebook
   - **Client Secret**: Cole o **App Secret** do Facebook
5. Clique em **"Save"**

---

## 🔍 Se Você Não Encontra "Facebook Login"

### Procure por:

- **"Products"** ou **"Produtos"** no menu
- **"Tools"** ou **"Ferramentas"** no menu
- Use a **barra de busca** no topo e digite "Facebook Login"
- Procure por **"Add Product"** ou **"Adicionar Produto"**

---

## ⚠️ Importante: Modo de Desenvolvimento

Se o app estiver em **modo de desenvolvimento**, apenas você (e usuários adicionados como testadores) poderá fazer login.

### Para adicionar testadores:

1. Vá em **"Roles"** → **"Test Users"** (ou **"Funções"** → **"Usuários de Teste"**)
2. Clique em **"Add Test Users"**
3. Adicione emails de pessoas que podem testar

---

## ✅ Checklist Rápido

- [ ] App criado no Facebook Developers
- [ ] **Plataforma Web adicionada** ⚠️ OBRIGATÓRIO
- [ ] Facebook Login adicionado como produto
- [ ] URIs de redirecionamento adicionadas (3 URLs)
- [ ] **URL de exclusão de dados configurada** ⚠️ OBRIGATÓRIO
- [ ] **Formulário de tratamento de dados preenchido** ⚠️ OBRIGATÓRIO
- [ ] App Domains configurado
- [ ] App ID e App Secret copiados
- [ ] Permissões configuradas (email, public_profile)
- [ ] Provider ativado no Supabase
- [ ] Client ID e Secret configurados no Supabase

---

## 🧪 Testar

1. Acesse: `https://movamais.fit/auth/login`
2. Clique em **"Continuar com Facebook"**
3. Faça login com sua conta Facebook
4. Você deve ser redirecionado para `/dashboard`

---

## 🆘 Ainda Não Encontra?

Se você não conseguir encontrar a seção "Facebook Login", me diga:

- O que aparece no menu lateral?
- Há alguma opção "Products" ou "Produtos"?
- O que aparece quando você clica em "Add Product"?

Com essas informações, posso te guiar melhor! 🎯
