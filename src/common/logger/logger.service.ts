import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { appendFile } from 'fs/promises';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

export enum LogLevel {
  LOG = 'LOG',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

// ANSI color codes
const Colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
};

const levelColors: Record<LogLevel, string> = {
  [LogLevel.LOG]: Colors.green,
  [LogLevel.WARN]: Colors.yellow,
  [LogLevel.ERROR]: Colors.red,
  [LogLevel.DEBUG]: Colors.magenta,
};

const levelBgColors: Record<LogLevel, string> = {
  [LogLevel.LOG]: `${Colors.green}`,
  [LogLevel.WARN]: `${Colors.yellow}`,
  [LogLevel.ERROR]: `${Colors.red}`,
  [LogLevel.DEBUG]: `${Colors.magenta}`,
};

@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly logDir = join(process.cwd(), 'logs');
  private readonly logFile = join(this.logDir, 'app.log');
  private readonly isProduction = process.env.NODE_ENV === 'production';

  constructor() {
    this.ensureLogDir();
  }

  private ensureLogDir(): void {
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }
  }

  private async writeToFile(level: LogLevel, message: string, context?: string): Promise<void> {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${context ? `[${context}] ` : ''}${message}\n`;

    try {
      await appendFile(this.logFile, logEntry, 'utf-8');
    } catch {
      // Silently fail
    }
  }

  private colorize(level: LogLevel, message: string, context?: string): string {
    const timestamp = new Date().toLocaleString();
    const levelColor = levelColors[level];
    const contextStr = context
      ? `${Colors.cyan}[${context}]${Colors.reset} `
      : '';

    const levelStr = `${levelBgColors[level]}${Colors.bright}${level}${Colors.reset}`;

    return `${Colors.gray}[${timestamp}]${Colors.reset} ${levelStr} ${contextStr}${levelColor}${message}${Colors.reset}`;
  }

  log(message: any, context?: string): void {
    const msg = typeof message === 'string' ? message : JSON.stringify(message);
    console.log(this.colorize(LogLevel.LOG, msg, context));
    this.writeToFile(LogLevel.LOG, msg, context);
  }

  warn(message: any, context?: string): void {
    const msg = typeof message === 'string' ? message : JSON.stringify(message);
    console.warn(this.colorize(LogLevel.WARN, msg, context));
    this.writeToFile(LogLevel.WARN, msg, context);
  }

  error(message: any, trace?: string, context?: string): void {
    const msg = typeof message === 'string' ? message : JSON.stringify(message);
    const errorMsg = `${Colors.bright}${Colors.red}${msg}${Colors.reset}`;
    
    const timestamp = new Date().toLocaleString();
    const contextStr = context
      ? `${Colors.cyan}[${context}]${Colors.reset} `
      : '';
    const levelStr = `${Colors.red}${Colors.bright}ERROR${Colors.reset}`;
    
    console.error(`${Colors.gray}[${timestamp}]${Colors.reset} ${levelStr} ${contextStr}${errorMsg}`);
    
    if (trace) {
      console.error(`${Colors.dim}${Colors.red}${trace}${Colors.reset}`);
      this.writeToFile(LogLevel.ERROR, `${msg}\nStack: ${trace}`, context);
    } else {
      this.writeToFile(LogLevel.ERROR, msg, context);
    }
  }

  debug(message: any, context?: string): void {
    if (this.isProduction) return;
    const msg = typeof message === 'string' ? message : JSON.stringify(message);
    console.debug(this.colorize(LogLevel.DEBUG, msg, context));
    this.writeToFile(LogLevel.DEBUG, msg, context);
  }

  verbose(message: any, context?: string): void {
    if (this.isProduction) return;
    this.log(message, context);
  }
}