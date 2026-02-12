// type LogLevel = "info" | "warn" | "error" | "debug";

class Logger {
  private isProd = import.meta.env.MODE === "production";

  info(message: string, data?: unknown) {
    console.info(message, data ?? "");
  }

  warn(message: string, data?: unknown) {
    console.warn(message, data ?? "");
  }

  error(message: string, data?: unknown) {
    console.error(message, data ?? "");
    // future: send to monitoring service
  }

  debug(message: string, data?: unknown) {
    if (!this.isProd) {
      console.debug(message, data ?? "");
    }
  }
}

export const logger = new Logger();
