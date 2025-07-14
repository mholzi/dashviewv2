import type { HomeAssistant, HomeInfo } from '@/types';

export class WebSocketConnection {
  private hass: HomeAssistant;

  constructor(hass: HomeAssistant) {
    this.hass = hass;
  }

  async getHomeInfo(): Promise<HomeInfo> {
    try {
      const result = await this.hass.callWS<HomeInfo>({
        type: 'dashview_v2/get_home_info',
      });
      return result;
    } catch (error) {
      console.error('Failed to get home info:', error);
      throw error;
    }
  }

  async subscribeToStateChanges(
    callback: (event: any) => void,
    entityIds?: string[]
  ): Promise<() => void> {
    if (!this.hass.connection) {
      throw new Error('WebSocket connection not available');
    }

    const unsubscribe = await this.hass.connection.subscribeEvents(
      (event: any) => {
        if (!entityIds || entityIds.includes(event.data.entity_id)) {
          callback(event);
        }
      },
      'state_changed'
    );

    return unsubscribe as () => void;
  }

  isConnected(): boolean {
    return !!this.hass && !!this.hass.connection;
  }
}