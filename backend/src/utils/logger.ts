// Azure-compatible logging configuration
// Console only - no file logging (Azure has ephemeral filesystem)

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LoggerConfig {
  readonly console: boolean;
  readonly file: boolean;
  readonly level: LogLevel;
}

// Load config from environment variables
const getLoggerConfig = (): LoggerConfig => ({
  console: process.env.LOG_CONSOLE !== 'false',
  file: process.env.LOG_FILE === 'true', // Default false for Azure
  level: (process.env.LOG_LEVEL as LogLevel) || 'info',
});

const config = getLoggerConfig();

// Validate Azure-compatible configuration
if (config.file) {
  console.warn(
    '⚠️  WARNING: File logging is enabled but not recommended for Azure App Service (ephemeral filesystem)'
  );
}

// Simple console logger (Azure-compatible)
const logLevels: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const shouldLog = (level: LogLevel): boolean => {
  return logLevels[level] <= logLevels[config.level];
};

export const logger = {
  error: (message: string, ...args: any[]) => {
    if (config.console && shouldLog('error')) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  },

  warn: (message: string, ...args: any[]) => {
    if (config.console && shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },

  info: (message: string, ...args: any[]) => {
    if (config.console && shouldLog('info')) {
      console.info(`[INFO] ${message}`, ...args);
    }
  },

  debug: (message: string, ...args: any[]) => {
    if (config.console && shouldLog('debug')) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },
};

// Export for testing
export const getConfig = () => config;
