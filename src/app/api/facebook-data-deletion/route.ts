import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Rota de callback para exclusão de dados do Facebook (GDPR/LGPD)
 *
 * O Facebook envia requisições POST para esta URL quando um usuário
 * solicita a exclusão de seus dados através do Facebook.
 *
 * Documentação: https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback
 */
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase credentials not configured");
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // O Facebook envia um objeto com 'signed_request' ou dados do usuário
    const { signed_request, user_id, confirmation_code } = body;

    // Se for uma requisição inicial (signed_request), retornar confirmação
    if (signed_request) {
      // Validar e processar signed_request se necessário
      // Por enquanto, retornamos confirmação de recebimento
      return NextResponse.json({
        url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.movamais.fit"}/central-ajuda`,
        confirmation_code: confirmation_code || "mova_data_deletion",
      });
    }

    // Se for uma requisição de exclusão com user_id
    if (user_id) {
      const supabaseAdmin = getSupabaseAdmin();

      // Buscar usuário pelo provider_id do Facebook
      const { data: authUsers, error: authError } =
        await supabaseAdmin.auth.admin.listUsers();

      if (authError) {
        console.error("Erro ao listar usuários:", authError);
        return NextResponse.json(
          { error: "Erro ao processar exclusão de dados" },
          { status: 500 }
        );
      }

      // Encontrar usuário que fez login com Facebook
      // O Facebook envia o user_id que corresponde ao provider_id
      const facebookUser = authUsers.users.find(
        (user) =>
          user.app_metadata?.provider === "facebook" &&
          (user.user_metadata?.provider_id === user_id ||
            user.identities?.some((identity) => identity.id === user_id))
      );

      if (facebookUser) {
        const userId = facebookUser.id;

        // Excluir dados do usuário
        const deletionPromises = [];

        // 1. Excluir perfil do usuário
        deletionPromises.push(
          supabaseAdmin.from("user_profiles").delete().eq("user_id", userId)
        );

        // 2. Excluir evoluções
        deletionPromises.push(
          supabaseAdmin.from("user_evolutions").delete().eq("user_id", userId)
        );

        // 3. Excluir planos gerados
        deletionPromises.push(
          supabaseAdmin.from("user_plans").delete().eq("user_id", userId)
        );

        // 4. Excluir histórico de planos (se a tabela existir)
        deletionPromises.push(
          (async () => {
            try {
              return await supabaseAdmin
                .from("plan_history")
                .delete()
                .eq("user_id", userId);
            } catch (err) {
              // Ignorar erro se a tabela não existir
              console.log("Tabela plan_history não encontrada ou erro:", err);
              return { data: null, error: null };
            }
          })()
        );

        // 5. Excluir métricas relacionadas (se houver)
        deletionPromises.push(
          (async () => {
            try {
              return await supabaseAdmin
                .from("plan_rejection_metrics")
                .delete()
                .eq("user_id", userId);
            } catch (err) {
              // Ignorar erro se a tabela não existir
              console.log(
                "Tabela plan_rejection_metrics não encontrada ou erro:",
                err
              );
              return { data: null, error: null };
            }
          })()
        );

        // Executar todas as exclusões
        const results = await Promise.all(deletionPromises);

        // Verificar se houve erros críticos (ignorar erros de tabelas que não existem)
        const criticalErrors = results.filter(
          (result) =>
            result.error && !result.error.message?.includes("does not exist")
        );

        if (criticalErrors.length > 0) {
          console.error("Erros ao excluir dados do usuário:", criticalErrors);
          return NextResponse.json(
            { error: "Erro ao excluir alguns dados" },
            { status: 500 }
          );
        }

        // Excluir o usuário da autenticação
        try {
          await supabaseAdmin.auth.admin.deleteUser(userId);
        } catch (deleteUserError) {
          console.error(
            "Erro ao excluir usuário da autenticação:",
            deleteUserError
          );
          // Continuar mesmo se falhar, pois os dados já foram excluídos
        }

        return NextResponse.json({
          success: true,
          message: "Dados do usuário excluídos com sucesso",
        });
      } else {
        // Usuário não encontrado - pode já ter sido excluído ou nunca existiu
        return NextResponse.json({
          success: true,
          message: "Usuário não encontrado ou já excluído",
        });
      }
    }

    // Se não tiver signed_request nem user_id, retornar instruções
    return NextResponse.json({
      url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.movamais.fit"}/central-ajuda`,
      confirmation_code: "mova_data_deletion",
    });
  } catch (error) {
    console.error("Erro no callback de exclusão de dados do Facebook:", error);
    return NextResponse.json(
      { error: "Erro ao processar requisição" },
      { status: 500 }
    );
  }
}

// GET para validação inicial do Facebook
export async function GET() {
  return NextResponse.json({
    url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.movamais.fit"}/central-ajuda`,
    confirmation_code: "mova_data_deletion",
  });
}
