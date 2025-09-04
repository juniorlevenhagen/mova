import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Verificar sessão atual
    const getSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Erro ao verificar sessão:", error);
          if (isMounted) setUser(null);
        } else if (isMounted) {
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error("Erro inesperado ao verificar sessão:", error);
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    getSession();

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      const currentUserId = user?.id; // Capturar valor atual

      // ✅ Evitar logs duplicados do mesmo evento
      if (event === "INITIAL_SESSION" && currentUserId === session?.user?.id) {
        return; // Não atualizar se for o mesmo usuário
      }

      // ✅ Evitar logs excessivos do INITIAL_SESSION
      if (event === "INITIAL_SESSION" && !session?.user?.id) {
        return; // Não logar INITIAL_SESSION sem usuário
      }

      if (process.env.NODE_ENV === "development") {
        console.log("Auth state change:", event, session?.user?.id);
      }

      if (event === "SIGNED_OUT") {
        localStorage.removeItem("lastActivity");
        sessionStorage.clear();
        setUser(null);
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setUser(session?.user ?? null);
      }

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

    // Verificar a cada 5 minutos para reduzir logs
    const interval = setInterval(checkSessionTimeout, 300000);

    // Atualizar atividade em eventos do usuário
    ["mousedown", "mousemove", "keypress", "scroll", "touchstart"].forEach(
      (event) => {
        document.addEventListener(event, updateActivity, true);
      }
    );

    return () => {
      isMounted = false;
      clearInterval(interval);
      ["mousedown", "mousemove", "keypress", "scroll", "touchstart"].forEach(
        (event) => {
          document.removeEventListener(event, updateActivity, true);
        }
      );
      subscription.unsubscribe();
    };
  });

  return { user, loading };
}
