/***** TYPE DEFINITIONS *****/
/**
 * Server configuration for Haven multiplayer game
 * This file manages the Bun-native server implementation
 */

export const ServerConfig = {
  /***** SERVER SELECTION *****/
  // Only 'bun' server type is supported after migration
  serverType: 'bun' as const,
  
  /***** CONNECTION SETTINGS *****/
  port: 8081,
  host: 'localhost',
  
  /***** AUTO-RESTART SETTINGS *****/
  // When using Bun server with --watch flag, these files will trigger restart
  watchPatterns: [
    'src/server/**/*.ts',
    'src/shared/**/*.ts'
  ],
  
  /***** DEVELOPMENT OPTIONS *****/
  enableHotReload: true,
  logLevel: 'info' as 'debug' | 'info' | 'warn' | 'error',
  
  /***** WEBSOCKET SETTINGS *****/
  maxConnections: 100,
  heartbeatInterval: 30000, // 30 seconds
  connectionTimeout: 5000,   // 5 seconds

  /***** FEATURE FLAGS *****/
  experimental_serverSideChunkRendering: true,

  /***** RENDERER SERVICE SETTINGS *****/
  rendererService: {
    host: 'localhost',
    port: 3001,
    healthCheckRetries: 30,
    healthCheckDelayMs: 1000,
    requestTimeoutMs: 10000,
  },
} as const;

/***** RUNTIME SERVER SELECTION *****/
export function getServerEntryPoint(): string {
  return 'src/server/bunServer.ts';
}

export function getServerUrl(): string {
  return `ws://${ServerConfig.host}:${ServerConfig.port}`;
}

export function getServerHttpUrl(): string {
  return `http://${ServerConfig.host}:${ServerConfig.port}`;
}

export function getRendererServiceUrl(): string {
  return `http://${ServerConfig.rendererService.host}:${ServerConfig.rendererService.port}`;
}
