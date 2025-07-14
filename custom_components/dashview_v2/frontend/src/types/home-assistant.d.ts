export interface HomeAssistant {
  states: { [entityId: string]: any };
  callService(domain: string, service: string, data?: any): Promise<void>;
  callWS<T>(msg: MessageBase): Promise<T>;
  connection: {
    subscribeEvents(callback: (event: any) => void, eventType: string): Promise<() => void>;
    sendMessage(message: any): void;
  };
  user: {
    name: string;
    id: string;
    is_admin: boolean;
  };
  language: string;
  selectedLanguage: string | null;
  resources: any;
  localize: (key: string, ...args: any[]) => string;
  translationMetadata: any;
  suspendWhenHidden: boolean;
  enableShortcuts: boolean;
  vibrate: boolean;
  dockedSidebar: "docked" | "always_hidden" | "auto";
  defaultPanel: string;
  moreInfoEntityId: string | null;
  hassUrl(path?: string): string;
  callApi<T>(method: string, path: string, data?: any): Promise<T>;
  fetchWithAuth(path: string, init?: RequestInit): Promise<Response>;
  themes: any;
  selectedTheme: string | null;
  darkMode: boolean;
}

export interface MessageBase {
  id?: number;
  type: string;
  [key: string]: any;
}