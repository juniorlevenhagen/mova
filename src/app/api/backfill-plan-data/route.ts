import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

type PlanAnalysis = {
  currentStatus?: string | null;
  strengths?: unknown[];
  improvements?: unknown[];
  specialConsiderations?: unknown[];
};

type TrainingPlan = {
  overview?: unknown;
  progression?: unknown;
  weeklySchedule?: unknown;
};

type NutritionPlan = {
  dailyCalories?: unknown;
  macros?: {
    protein?: unknown;
    carbs?: unknown;
    fats?: unknown;
  };
  mealPlan?: unknown;
};

type PlanData = {
  analysis?: PlanAnalysis;
  trainingPlan?: TrainingPlan;
  nutritionPlan?: NutritionPlan;
};

function getSupabaseUserClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.replace("Bearer ", "")
      : null;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    let authedUser:
      | { id: string }
      | null = null;
    let tokenForUserClient: string | null = null;

    // 1) Tentar autenticar via Authorization: Bearer <token>
    if (bearerToken) {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser(bearerToken);
      if (!userError && user) {
        authedUser = { id: user.id };
        tokenForUserClient = bearerToken;
      }
    }

    // 2) Fallback: tentar autenticar via cookie da sessão (requisição do browser logado)
    if (!authedUser) {
      const cookieStore = cookies();
      const supabaseServer = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value;
            },
            set() {
              // no-op para rotas de backfill (não precisamos escrever cookies)
            },
            remove() {
              // no-op
            },
          },
        }
      );
      const {
        data: { user },
      } = await supabaseServer.auth.getUser();
      if (user) {
        authedUser = { id: user.id };
        // Para operações com privilégios do usuário, podemos usar um client sem header Authorization,
        // pois o createServerClient já inclui os cookies. Como vamos usar um client com header,
        // manteremos tokenForUserClient nulo e criaremos um client server-side quando necessário.
      }
    }

    if (!authedUser) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    // Criar client autenticado do usuário:
    const supabaseUser = tokenForUserClient
      ? getSupabaseUserClient(tokenForUserClient)
      : createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              get: (name: string) => cookies().get(name)?.value,
              set: () => {},
              remove: () => {},
            },
          }
        );

    const { searchParams } = new URL(request.url);
    const limit = Math.max(1, Math.min(200, Number(searchParams.get("limit")) || 50));
    const offset = Math.max(0, Number(searchParams.get("offset")) || 0);
    const dryRun = (searchParams.get("dryRun") || "false") === "true";

    // Buscar lote de planos
    const { data: plans, error: fetchError } = await supabaseUser
      .from("user_plans")
      .select("id, user_id, plan_data, generated_at")
      .order("generated_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (fetchError) {
      console.error("❌ Erro ao carregar user_plans:", fetchError);
      return NextResponse.json(
        { error: "Erro ao carregar user_plans", details: fetchError.message },
        { status: 500 }
      );
    }

    const processed = {
      total: plans?.length || 0,
      analysesInserted: 0,
      trainingsInserted: 0,
      nutritionInserted: 0,
      skipped: 0,
    };

    if (!plans || plans.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Nenhum plano no intervalo solicitado",
        processed,
      });
    }

    for (const p of plans) {
      const planData = (p.plan_data || {}) as PlanData;
      const hasAnalysis = !!planData.analysis;
      const hasTraining = !!planData.trainingPlan;
      const hasNutrition = !!planData.nutritionPlan;

      if (!hasAnalysis && !hasTraining && !hasNutrition) {
        processed.skipped += 1;
        continue;
      }

      // Idempotência: verificar se já existe registro por plan_id
      // plan_analyses
      if (hasAnalysis) {
        const { data: exists } = await supabaseUser
          .from("plan_analyses")
          .select("id")
          .eq("plan_id", p.id)
          .maybeSingle();

        if (!exists && !dryRun) {
          const strengths =
            Array.isArray(planData.analysis?.strengths) ? planData.analysis.strengths : [];
          const improvements =
            Array.isArray(planData.analysis?.improvements) ? planData.analysis.improvements : [];
          const special =
            Array.isArray(planData.analysis?.specialConsiderations)
              ? planData.analysis.specialConsiderations
              : [];

          const { error } = await supabaseUser.from("plan_analyses").insert({
            plan_id: p.id,
            user_id: p.user_id,
            current_status: planData.analysis?.currentStatus || null,
            strengths,
            improvements,
            special_considerations: special,
          });
          if (!error) processed.analysesInserted += 1;
          else console.warn("⚠️ Falha ao inserir plan_analyses:", error);
        }
      }

      // plan_trainings
      if (hasTraining) {
        const { data: exists } = await supabaseUser
          .from("plan_trainings")
          .select("id")
          .eq("plan_id", p.id)
          .maybeSingle();

        if (!exists && !dryRun) {
          const { error } = await supabaseUser.from("plan_trainings").insert({
            plan_id: p.id,
            user_id: p.user_id,
            overview: planData.trainingPlan?.overview || null,
            progression: planData.trainingPlan?.progression || null,
            exercises: planData.trainingPlan?.weeklySchedule || null,
          });
          if (!error) processed.trainingsInserted += 1;
          else console.warn("⚠️ Falha ao inserir plan_trainings:", error);
        }
      }

      // plan_nutrition
      if (hasNutrition) {
        const { data: exists } = await supabaseUser
          .from("plan_nutrition")
          .select("id")
          .eq("plan_id", p.id)
          .maybeSingle();

        if (!exists && !dryRun) {
          // Extrair números de macros que podem vir como strings "180g"
          const toNumber = (val: unknown): number | null => {
            if (val === null || val === undefined) return null;
            if (typeof val === "number") return Number.isFinite(val) ? val : null;
            if (typeof val === "string") {
              const num = Number(val.replace(/[^\d.,-]/g, "").replace(",", "."));
              return Number.isFinite(num) ? num : null;
            }
            return null;
          };

          const dailyCalories = toNumber(planData.nutritionPlan?.dailyCalories);
          const protein = toNumber(planData.nutritionPlan?.macros?.protein);
          const carbs = toNumber(planData.nutritionPlan?.macros?.carbs);
          const fats = toNumber(planData.nutritionPlan?.macros?.fats);

          const { error } = await supabaseUser.from("plan_nutrition").insert({
            plan_id: p.id,
            user_id: p.user_id,
            daily_calories: dailyCalories,
            protein_grams: protein,
            carbs_grams: carbs,
            fats_grams: fats,
            meal_plan: planData.nutritionPlan?.mealPlan || null,
          });
          if (!error) processed.nutritionInserted += 1;
          else console.warn("⚠️ Falha ao inserir plan_nutrition:", error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed,
      next: {
        limit,
        offset: offset + limit,
      },
      hint: "Chame novamente com o próximo offset para processar o restante. Use ?dryRun=true para testar.",
    });
  } catch (error) {
    console.error("❌ Erro no backfill:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor", details: `${error}` },
      { status: 500 }
    );
  }
}


