import { LitElement, PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import type { DashviewConfig, HomeAssistant } from '@/types';

export class DashviewBaseElement extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ type: Object }) config!: DashviewConfig;
  
  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (!this.hass) {
      console.warn('DashviewBaseElement: hass object not available');
      return false;
    }
    return super.shouldUpdate(changedProps);
  }

  protected async callWebSocket<T>(command: string, data?: any): Promise<T> {
    if (!this.hass) {
      throw new Error('Home Assistant connection not available');
    }

    try {
      const result = await this.hass.callWS<T>({
        type: `dashview_v2/${command}`,
        ...data,
      });
      return result;
    } catch (error) {
      console.error(`WebSocket call failed for ${command}:`, error);
      throw error;
    }
  }

  protected handleError(error: Error, context: string): void {
    console.error(`[Dashview V2] Error in ${context}:`, error);
    // In the future, we can show user-friendly error messages here
  }

  connectedCallback(): void {
    super.connectedCallback();
    console.log('DashviewBaseElement connected');
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    console.log('DashviewBaseElement disconnected');
  }
}