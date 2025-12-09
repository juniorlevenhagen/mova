import { typography, components, colors } from "@/lib/design-tokens";

interface DashboardHeaderProps {
  user: {
    full_name: string;
    email: string;
  };
  onLogout: () => void;
  logoutLoading: boolean;
}

export function DashboardHeader({
  user,
  onLogout,
  logoutLoading,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
      <div className="flex-1 min-w-0">
        <h1
          className={`${typography.heading.h1} ${colors.text.primary} mb-2 break-words`}
        >
          Olá, {user.full_name}!
        </h1>
        <p className={`${typography.body.normal} ${colors.text.secondary}`}>
          Seja bem-vindo ao seu painel Mova+
        </p>
      </div>
      <button
        onClick={onLogout}
        disabled={logoutLoading}
        className={`${components.button.base} ${components.button.sizes.md} bg-black text-white hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl whitespace-nowrap w-full sm:w-auto`}
      >
        {logoutLoading ? "Saindo..." : "Sair"}
      </button>
    </div>
  );
}
