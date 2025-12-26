"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export function useAdminAuth() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (authLoading) {
        return;
      }

      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("users")
          .select("admin")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.error("❌ Erro ao verificar admin:", error);
          console.error("Detalhes:", {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
          });
          setIsAdmin(false);
        } else if (data?.admin === true) {
          console.log("✅ Usuário é admin:", user.email);
          setIsAdmin(true);
        } else {
          console.warn("⚠️ Usuário não é admin:", {
            email: user.email,
            userId: user.id,
            adminValue: data?.admin,
            dataExists: !!data,
          });
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("❌ Erro inesperado ao verificar admin:", error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [user, authLoading]);

  return { isAdmin, loading: loading || authLoading, user };
}
