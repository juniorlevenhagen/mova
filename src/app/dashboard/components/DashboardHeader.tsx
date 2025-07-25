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
    <div className="flex justify-between items-center mb-2">
      <h1 className="text-2xl font-bold text-gray-800">
        Olá, {user.full_name}! Seja bem-vindo ao Mova+.
      </h1>
      <button
        onClick={onLogout}
        disabled={logoutLoading}
        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {logoutLoading ? "Saindo..." : "Sair"}
      </button>
    </div>
  );
}
