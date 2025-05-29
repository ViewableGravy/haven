/***** TYPE DEFINITIONS *****/
import { GameConstants } from "../../shared/constants";

/***** LOGGER CLASS *****/
/**
 * Centralized logging utility that provides controlled debug output
 * Only logs messages when DEBUG is enabled in global configuration
 */
export class Logger {
  /**
   * Log a message to the console if debug mode is enabled
   * @param message - The message to log
   */
  public log = (message: string): void => {
    if (GameConstants.DEBUG) {
      console.log(message);
    }
  };
}

/***** GLOBAL LOGGER INSTANCE *****/
export const logger = new Logger();
