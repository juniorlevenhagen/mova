import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

interface UserProfile {
  id: string;
  user_id: string;
  age: number;
  birth_date: string; // Adicionar este campo
  height: number;
  weight: number;
  gender: string;
  objective: string;
  training_frequency: string;
  training_location: string;
  has_pain: string;
  dietary_restrictions: string;
  created_at: string;
  updated_at: string;
}

interface UserData {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

export function useUserProfile(user: User | null) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setUserData(null);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchUserData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Buscar dados básicos do usuário
        const { data: userDataResult, error: userError } = await supabase
          .from("users")
          .select("id, email, full_name, created_at")
          .eq("id", user.id)
          .single();

        if (userError) {
          console.error("Erro ao buscar dados do usuário:", userError);
          setError("Erro ao carregar dados do usuário");
          return;
        }

        setUserData(userDataResult);

        // Buscar perfil do usuário
        const { data: profileResult, error: profileError } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (profileError) {
          if (profileError.code === "PGRST116") {
            // Perfil não encontrado - isso é normal para usuários novos
            console.log("Perfil não encontrado, usuário pode ser novo");
            setProfile(null);
          } else {
            console.error("Erro ao buscar perfil:", profileError);
            setError("Erro ao carregar perfil");
            return;
          }
        } else {
          setProfile(profileResult);
        }
      } catch (error) {
        console.error("Erro inesperado ao buscar dados:", error);
        setError("Erro inesperado ao carregar dados");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  return {
    profile,
    userData,
    loading,
    error,
  };
}
