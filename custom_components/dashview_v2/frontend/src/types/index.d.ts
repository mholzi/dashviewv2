export interface DashviewConfig {
  // Simple config for now, will expand later
}

export interface HomeInfo {
  roomCount: number;
  entityCount: number;
  areas: string[];
  complexityScore: number;
}

export interface DashviewWebSocketCommand extends MessageBase {
  type: string;
  [key: string]: any;
}

export interface DashviewWebSocketResponse<T = any> {
  id: number;
  type: string;
  success: boolean;
  result?: T;
  error?: {
    code: string;
    message: string;
  };
}

export * from './home-assistant';