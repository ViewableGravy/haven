/***** TYPE DEFINITIONS *****/
import { GameConstants } from "../../shared/constants";

/***** Logger CLASS *****/
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

  /**
   * Log an error message to the console
   * @param message - The error message to log
   * @param error - Optional error object
   */
  public error = (message: string, error?: any): void => {
    console.error(message, error);
  };

  /**
   * Log a warning message to the console if debug mode is enabled
   * @param message - The warning message to log
   */
  public static warn = (message: string): void => {
    if (GameConstants.DEBUG) {
      console.warn(message);
    }
  }

  public static log = (message: string, chance: number = 1): void => {
    // We are on the server, so we don't have a window object
    if (typeof window === "undefined") {
      if ((GameConstants.DEBUG_SERVER || GameConstants.DEBUG) && Math.random() < chance) {
        console.log(message);
      }
    } else {
      if ((GameConstants.DEBUG_CLIENT || GameConstants.DEBUG) && Math.random() < chance) {
        console.log(message);
      }
    }
  }

  public static error = (message: string, error?: any): void => {
    if (typeof window === "undefined") {
      console.error(message, error);
    } else {
      console.error(message, error);
    }
  }
}
