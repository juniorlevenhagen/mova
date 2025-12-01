# Como Configurar o Gmail para Envio de Emails

Este projeto usa Gmail SMTP para enviar emails. Siga os passos abaixo para configurar.

## Passo 1: Criar uma Senha de App do Gmail

⚠️ **IMPORTANTE**: Você NÃO pode usar sua senha normal do Gmail. É necessário criar uma "Senha de App" específica.

### Como criar:

1. Acesse: https://myaccount.google.com/apppasswords
   - Se não conseguir acessar, ative a verificação em duas etapas primeiro: https://myaccount.google.com/signinoptions/two-step-verification

2. Selecione:
   - **App**: Escolha "Outro (Nome personalizado)"
   - **Nome**: Digite "Mova+"

3. Clique em "Gerar"

4. Copie a senha gerada (16 caracteres, sem espaços)

## Passo 2: Configurar no .env.local

Adicione as seguintes variáveis no seu arquivo `.env.local`:

```env
GMAIL_USER=juniorlevenhagen@gmail.com
GMAIL_APP_PASSWORD=sua_senha_de_app_aqui
```

**Exemplo:**

```env
GMAIL_USER=juniorlevenhagen@gmail.com
GMAIL_APP_PASSWORD=abcd efgh ijkl mnop
```

⚠️ **Nota**: Se a senha tiver espaços, remova-os ou coloque entre aspas.

## Passo 3: Testar

1. Reinicie o servidor de desenvolvimento:

   ```bash
   bun dev
   ```

2. Teste a newsletter ou formulário de contato

3. Verifique se os emails estão chegando no seu Gmail

## Modo Desenvolvimento (sem Gmail configurado)

Se você não configurar o Gmail, o sistema funcionará em "modo desenvolvimento":

- Os emails não serão enviados
- Os dados serão apenas logados no console do servidor
- O usuário verá mensagem de sucesso

## Troubleshooting

### Erro: "Invalid login"

- Verifique se está usando a **Senha de App**, não a senha normal
- Certifique-se de que a verificação em duas etapas está ativada

### Erro: "Less secure app access"

- Não é mais necessário ativar "Acesso a apps menos seguros"
- Use sempre a Senha de App

### Emails não estão chegando

- Verifique a pasta de Spam
- Confirme que o email de destino está correto em `config.ts`
- Verifique os logs do servidor para ver erros
