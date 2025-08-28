// Design System Tokens - Mova+
// Cores e estilos padronizados para todo o projeto

export const colors = {
  // Background
  background: {
    primary: "#f5f1e8", // Background principal do site
    white: "#ffffff", // Cards e elementos destacados
    gray: {
      50: "#f9fafb",
      100: "#f3f4f6",
      200: "#e5e7eb",
      300: "#d1d5db",
    },
  },

  // Textos
  text: {
    primary: "text-gray-800", // Títulos principais
    secondary: "text-gray-600", // Descrições e textos secundários
    tertiary: "text-gray-500", // Textos menos importantes
    muted: "text-gray-400", // Placeholders e textos desabilitados
  },

  // Status e feedback
  status: {
    success: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-800",
      accent: "text-green-600",
    },
    warning: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-yellow-800",
      accent: "text-yellow-600",
    },
    error: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-800",
      accent: "text-red-600",
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-800",
      accent: "text-blue-600",
    },
  },

  // Elementos interativos
  interactive: {
    primary: {
      bg: "bg-gray-800",
      hover: "hover:bg-gray-900",
      text: "text-white",
      focus: "focus:ring-gray-800",
    },
    secondary: {
      bg: "bg-white",
      border: "border-gray-300",
      hover: "hover:bg-gray-50",
      text: "text-gray-700",
      focus: "focus:ring-gray-500",
    },
  },
} as const;

export const typography = {
  // Font families
  fonts: {
    primary: "font-inter", // Textos gerais
    heading: "font-poppins", // Títulos e destaques
  },

  // Tamanhos e pesos
  heading: {
    h1: "text-2xl md:text-4xl font-bold font-poppins",
    h2: "text-xl md:text-2xl font-semibold font-poppins",
    h3: "text-lg md:text-xl font-medium font-poppins",
    h4: "text-base md:text-lg font-medium font-poppins",
  },

  body: {
    large: "text-base md:text-lg font-inter",
    normal: "text-sm md:text-base font-inter",
    small: "text-xs md:text-sm font-inter",
  },
} as const;

export const components = {
  // Cards
  card: {
    base: "bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300",
    interactive: "transform hover:-translate-y-1",
    padding: "p-6",
  },

  // Botões
  button: {
    base: "font-medium rounded-lg transition-colors duration-200 font-inter",
    sizes: {
      sm: "px-3 py-2 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-6 py-3 text-base",
    },
    variants: {
      primary: `${colors.interactive.primary.bg} ${colors.interactive.primary.hover} ${colors.interactive.primary.text}`,
      secondary: `${colors.interactive.secondary.bg} ${colors.interactive.secondary.border} ${colors.interactive.secondary.hover} ${colors.interactive.secondary.text} border`,
    },
  },

  // Inputs
  input: {
    base: "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-colors font-inter",
    error: "border-red-300 focus:ring-red-500",
  },

  // Badges/Tags
  badge: {
    base: "px-2 py-1 rounded-full text-xs font-medium font-inter",
    variants: {
      success: `${colors.status.success.bg} ${colors.status.success.text}`,
      warning: `${colors.status.warning.bg} ${colors.status.warning.text}`,
      error: `${colors.status.error.bg} ${colors.status.error.text}`,
      info: `${colors.status.info.bg} ${colors.status.info.text}`,
    },
  },
} as const;

// Helper functions
export const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(" ");
};
