export class Logger {
  private logger: any;
  private name: string;
  constructor(logger: any, name: string) {
    this.logger = logger;
    this.name = name;
  }
  info(msg: string) {
    this.logger.info(`[${this.name}] ${msg}`);
  }
  warn(msg: string) {
    this.logger.warn(`[${this.name}] ${msg}`);
  }
  error(msg: string) {
    this.logger.error(`[${this.name}] ${msg}`);
  }
}

export default function getLogger(name: string) {
  try {
    require.resolve('node-windows');
    const EventLogger = require('node-windows').EventLogger;
    return new Logger(new EventLogger(name), name);
  }
  catch (error) {
    return new Logger(console, name);
  }
};
