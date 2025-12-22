/**
 * Script para testar a API de geração de planos localmente
 * 
 * Uso:
 * 1. Inicie o servidor: bun dev
 * 2. Execute este script: node test-api-local.js
 * 
 * IMPORTANTE: Você precisa ter um token de autenticação válido.
 * Para obter o token:
 * - Faça login na aplicação (http://localhost:3000/auth/login)
 * - Abra o DevTools (F12) > Console
 * - Execute: (await supabase.auth.getSession()).data.session.access_token
 * - Copie o token e cole abaixo
 */

const API_URL = "http://localhost:3000/api/generate-plan";

// ⚠️ SUBSTITUA ESTE TOKEN pelo token real do seu usuário autenticado
const AUTH_TOKEN = "SEU_TOKEN_AQUI";

async function testGeneratePlan() {
  try {
    console.log("🚀 Testando geração de plano...\n");
    console.log("📡 URL:", API_URL);
    console.log("🔑 Token:", AUTH_TOKEN.substring(0, 20) + "...\n");

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
    });

    console.log("📊 Status:", response.status, response.statusText);
    console.log("📋 Headers:", Object.fromEntries(response.headers.entries()));

    const data = await response.json();

    if (response.ok) {
      console.log("\n✅ SUCESSO!\n");
      console.log("📦 Resposta completa:");
      console.log(JSON.stringify(data, null, 2));

      // Análise específica do treino
      if (data.plan?.trainingPlan?.weeklySchedule) {
        console.log("\n🏋️ ANÁLISE DO TREINO:\n");
        
        const schedule = data.plan.trainingPlan.weeklySchedule;
        console.log(`📅 Total de dias: ${schedule.length}`);
        
        // Agrupar por tipo
        const byType = {};
        schedule.forEach((day, index) => {
          const type = day.type || "sem tipo";
          if (!byType[type]) {
            byType[type] = [];
          }
          byType[type].push({ day: day.day, index: index + 1 });
        });

        console.log("\n📊 Distribuição por tipo:");
        Object.entries(byType).forEach(([type, days]) => {
          console.log(`  ${type}: ${days.length}x - ${days.map(d => d.day).join(", ")}`);
        });

        // Verificar se dias do mesmo tipo têm os mesmos exercícios
        console.log("\n🔍 Verificando repetição de exercícios:");
        Object.entries(byType).forEach(([type, days]) => {
          if (days.length > 1) {
            const firstDay = schedule[days[0].index - 1];
            const firstExercises = firstDay.exercises.map(e => e.name);
            
            console.log(`\n  ${type} (${days.length}x):`);
            console.log(`    Dia 1 (${firstDay.day}): ${firstExercises.length} exercícios`);
            
            days.slice(1).forEach((dayInfo, idx) => {
              const currentDay = schedule[dayInfo.index - 1];
              const currentExercises = currentDay.exercises.map(e => e.name);
              const areEqual = JSON.stringify(firstExercises) === JSON.stringify(currentExercises);
              
              console.log(`    Dia ${idx + 2} (${currentDay.day}): ${currentExercises.length} exercícios`);
              console.log(`      ${areEqual ? "✅" : "❌"} Exercícios ${areEqual ? "IGUAIS" : "DIFERENTES"}`);
              
              if (!areEqual) {
                console.log(`      Primeiro dia:`, firstExercises);
                console.log(`      Este dia:`, currentExercises);
              }
            });
          }
        });

        // Verificar ordem dos exercícios
        console.log("\n📋 Verificando ordem dos exercícios:");
        schedule.forEach((day) => {
          const type = day.type?.toLowerCase() || "";
          const exercises = day.exercises || [];
          
          if (exercises.length === 0) {
            console.log(`  ${day.day}: ⚠️ Sem exercícios`);
            return;
          }

          // Detectar grupos musculares
          const groups = exercises.map(ex => {
            const primary = ex.primaryMuscle || ex.muscleGroups?.[0] || "desconhecido";
            return primary.toLowerCase();
          });

          // Verificar se está agrupado corretamente
          let lastGroup = null;
          let groupChanges = 0;
          groups.forEach((group, idx) => {
            if (group !== lastGroup) {
              groupChanges++;
              lastGroup = group;
            }
          });

          const isGrouped = groupChanges <= 2; // Máximo 2 grupos (grande + pequeno)
          
          console.log(`  ${day.day} (${type}):`);
          console.log(`    ${isGrouped ? "✅" : "❌"} Ordem: ${isGrouped ? "AGRUPADA" : "ALTERNADA"}`);
          console.log(`    Grupos detectados: ${groupChanges}`);
          console.log(`    Exercícios: ${exercises.map(e => e.name).join(" → ")}`);
        });
      }
    } else {
      console.log("\n❌ ERRO!\n");
      console.log("📦 Resposta de erro:");
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error("\n💥 Erro ao testar API:", error);
  }
}

// Executar teste
testGeneratePlan();

