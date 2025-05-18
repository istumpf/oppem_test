import {
  createLogger,
  format,
  transports,
  Logger as WinstonLogger,
} from "winston";
import { TransformableInfo } from "logform";

const { combine, timestamp, printf, colorize } = format;

const logFormat = printf(
  ({ level, message, context, timestamp, stack }: TransformableInfo) => {
    const logMessage = `${timestamp} [${level}] ${context ? `[${context}] ` : ""}${message}`;
    return stack ? `${logMessage}\n${stack}` : logMessage;
  },
);

const winstonLogger = createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: combine(
    colorize(),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.errors({ stack: true }),
    logFormat,
  ),
  transports: [
    new transports.Console({
      handleExceptions: true,
      handleRejections: true,
    }),
  ],
});

export class Logger {
  private logger: WinstonLogger;

  constructor(context: string) {
    this.logger = winstonLogger.child({ context });
  }

  public info(message: string, meta?: Record<string, unknown>) {
    this.logger.info(message, meta);
  }

  public error(
    message: string,
    error?: unknown | Error,
    meta?: Record<string, unknown>,
  ) {
    const parsedError =
      error instanceof Error ? error : new Error(String(error));

    this.logger.error({
      message,
      stack: parsedError?.stack,
      ...meta,
    });
  }

  public warn(message: string, meta?: Record<string, unknown>) {
    this.logger.warn(message, meta);
  }

  public debug(message: string, meta?: Record<string, unknown>) {
    this.logger.debug(message, meta);
  }

  public verbose(message: string, meta?: Record<string, unknown>) {
    this.logger.verbose(message, meta);
  }

  static configure() {
    winstonLogger.add(
      new transports.File({
        filename: "logs/combined.log",
        format: format.combine(format.uncolorize(), timestamp(), logFormat),
      }),
    );
  }
}

Logger.configure();
