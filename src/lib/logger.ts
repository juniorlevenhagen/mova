// Sistema de logs estruturado para análise
export enum LogLevel {
  ERROR = "error",
  WARN = "warn",
  INFO = "info",
  DEBUG = "debug",
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  stack?: string;
}

class Logger {
  private formatMessage(
    level: LogLevel,
    message: string,
    context?: Record<string, any>
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      stack: level === LogLevel.ERROR ? new Error().stack : undefined,
    };
  }

  error(message: string, context?: Record<string, any>) {
    const entry = this.formatMessage(LogLevel.ERROR, message, context);
    console.error("🚨 ERROR:", entry);
    return entry;
  }

  warn(message: string, context?: Record<string, any>) {
    const entry = this.formatMessage(LogLevel.WARN, message, context);
    console.warn("⚠️ WARN:", entry);
    return entry;
  }

  info(message: string, context?: Record<string, any>) {
    const entry = this.formatMessage(LogLevel.INFO, message, context);
    console.info("ℹ️ INFO:", entry);
    return entry;
  }

  debug(message: string, context?: Record<string, any>) {
    const entry = this.formatMessage(LogLevel.DEBUG, message, context);
    console.debug("🐛 DEBUG:", entry);
    return entry;
  }

  // Método para analisar logs com o Cursor
  analyzeLogs(logs: LogEntry[]) {
    const errors = logs.filter((log) => log.level === LogLevel.ERROR);
    const warnings = logs.filter((log) => log.level === LogLevel.WARN);

    return {
      totalLogs: logs.length,
      errors: errors.length,
      warnings: warnings.length,
      errorPatterns: this.findPatterns(errors),
      warningPatterns: this.findPatterns(warnings),
    };
  }

  private findPatterns(logs: LogEntry[]) {
    const patterns: Record<string, number> = {};
    logs.forEach((log) => {
      const key = log.message.split(":")[0]; // Primeira parte da mensagem
      patterns[key] = (patterns[key] || 0) + 1;
    });
    return patterns;
  }
}

export const logger = new Logger();
