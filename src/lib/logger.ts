/**
 * Sistema de Logging Centralizado
 *
 * Reduz logs em produção mantendo apenas erros críticos.
 * Em desenvolvimento, mantém todos os logs para debug.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";

// Níveis de log permitidos por ambiente
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Em produção, só loga warn e error
// Em desenvolvimento, loga tudo
const minLogLevel = isProduction ? LOG_LEVELS.warn : LOG_LEVELS.debug;

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= minLogLevel;
}

interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

/**
 * Logger centralizado que respeita o ambiente
 */
export const logger: Logger = {
  debug: (...args: unknown[]) => {
    if (shouldLog("debug")) {
      console.log(...args);
    }
  },

  info: (...args: unknown[]) => {
    if (shouldLog("info")) {
      console.log(...args);
    }
  },

  warn: (...args: unknown[]) => {
    if (shouldLog("warn")) {
      console.warn(...args);
    }
  },

  error: (...args: unknown[]) => {
    if (shouldLog("error")) {
      console.error(...args);
    }
  },
};

/**
 * Logger específico para métricas (sempre loga em dev, nunca em prod)
 */
export const metricsLogger = {
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
};

/**
 * Logger para APIs (reduzido em produção)
 */
export const apiLogger = {
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  error: (...args: unknown[]) => {
    // Erros sempre são logados
    console.error(...args);
  },

  warn: (...args: unknown[]) => {
    // Warnings sempre são logados
    console.warn(...args);
  },
};
