import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão atual
    const getSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Erro ao verificar sessão:", error);
          setUser(null);
        } else {
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error("Erro inesperado ao verificar sessão:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (process.env.NODE_ENV === "development") {
        console.log("Auth state change:", event, session?.user?.id);
      }

      if (event === "SIGNED_OUT") {
        // Limpar dados do localStorage quando fizer logout
        localStorage.removeItem("lastActivity");
        // Limpar outros dados que possam estar em cache
        sessionStorage.clear();
      }

      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Adicionar verificação de tempo limite
    const checkSessionTimeout = () => {
      const lastActivity = localStorage.getItem("lastActivity");
      const now = Date.now();
      const timeout = 30 * 60 * 1000; // 30 minutos

      if (lastActivity && now - parseInt(lastActivity) > timeout) {
        console.log("Sessão expirada por inatividade");
        supabase.auth.signOut();
      }
    };

    // Atualizar atividade do usuário
    const updateActivity = () => {
      localStorage.setItem("lastActivity", Date.now().toString());
    };

    // Verificar a cada minuto
    const interval = setInterval(checkSessionTimeout, 60000);

    // Atualizar atividade em eventos do usuário
    ["mousedown", "mousemove", "keypress", "scroll", "touchstart"].forEach(
      (event) => {
        document.addEventListener(event, updateActivity, true);
      }
    );

    return () => {
      clearInterval(interval);
      ["mousedown", "mousemove", "keypress", "scroll", "touchstart"].forEach(
        (event) => {
          document.removeEventListener(event, updateActivity, true);
        }
      );
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}
