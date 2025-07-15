/**
 * Room widget for Dashview V2.
 * Displays all entities in a room with summary and controls.
 */

import { html, css, PropertyValues, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { DashviewWidget, WidgetConfig } from '../core/widget-base';

interface RoomWidgetConfig extends WidgetConfig {
  type: 'room';
  areaId?: string;
  areaName?: string;
  showEmpty?: boolean;
}

@customElement('dashview-room-widget')
export class RoomWidget extends DashviewWidget {
  @property({ type: String }) areaId?: string;
  @property({ type: String }) areaName?: string;
  @state() private expanded = false;
  @state() private lightCount = 0;
  @state() private lightsOn = 0;
  @state() private temperature?: number;
  @state() private humidity?: number;
  @state() private lastMotion?: Date;

  protected subscribedEntities(): string[] {
    // Subscribe to all entities when expanded, or just key entities when collapsed
    if (this.expanded || this.entityStates.size < 10) {
      return this.widgetConfig?.entities || [];
    }
    
    // When collapsed with many entities, only subscribe to key entities
    const entities = this.widgetConfig?.entities || [];
    return entities.filter(id => 
      id.includes('motion') || 
      id.includes('door') || 
      id.includes('presence') ||
      id.includes('temperature') ||
      id.includes('humidity') ||
      id.startsWith('light.')
    );
  }

  protected getDefaultConfig(): Partial<RoomWidgetConfig> {
    return {
      type: 'room',
      entities: [],
      showEmpty: false,
    };
  }

  protected firstUpdated(changedProps: PropertyValues): void {
    super.firstUpdated(changedProps);
    this.updateSummary();
  }

  protected onStateChanged(entityId: string, newState: any, oldState: any): void {
    super.onStateChanged(entityId, newState, oldState);
    this.updateSummary();
  }

  private updateSummary(): void {
    let lightCount = 0;
    let lightsOn = 0;
    let temperature: number | undefined;
    let humidity: number | undefined;
    let lastMotion: Date | undefined;

    for (const [entityId, state] of this.entityStates) {
      if (entityId.startsWith('light.')) {
        lightCount++;
        if (state.state === 'on') {
          lightsOn++;
        }
      } else if (entityId.includes('temperature') && state.state !== 'unavailable') {
        const temp = parseFloat(state.state);
        if (!isNaN(temp)) {
          temperature = temp;
        }
      } else if (entityId.includes('humidity') && state.state !== 'unavailable') {
        const hum = parseFloat(state.state);
        if (!isNaN(hum)) {
          humidity = hum;
        }
      } else if (entityId.includes('motion') || entityId.includes('presence')) {
        if (state.state === 'on' && state.last_changed) {
          const motionTime = new Date(state.last_changed);
          if (!lastMotion || motionTime > lastMotion) {
            lastMotion = motionTime;
          }
        }
      }
    }

    this.lightCount = lightCount;
    this.lightsOn = lightsOn;
    this.temperature = temperature;
    this.humidity = humidity;
    this.lastMotion = lastMotion;
  }

  protected render(): TemplateResult {
    const roomName = this.areaName || this.widgetConfig?.title || 'Unknown Room';

    if (this.isLoading) {
      return html`
        <div class="widget-loading">
          Loading room data...
        </div>
      `;
    }

    if (this.error) {
      return html`
        <div class="widget-error">
          ${this.error}
        </div>
      `;
    }

    return html`
      <ha-card>
        <div class="header" @click=${this.toggleExpanded}>
          <h2>${roomName}</h2>
          <div class="summary">
            ${this.renderSummary()}
          </div>
          <ha-icon
            class="expand-icon ${this.expanded ? 'expanded' : ''}"
            icon="mdi:chevron-down"
          ></ha-icon>
        </div>
        
        ${this.expanded ? this.renderExpanded() : ''}
        
        <div class="actions">
          ${this.lightCount > 0 ? html`
            <mwc-button @click=${this.turnAllLightsOff}>
              <ha-icon icon="mdi:lightbulb-off"></ha-icon>
              All Off
            </mwc-button>
          ` : ''}
        </div>
      </ha-card>
    `;
  }

  private renderSummary(): TemplateResult[] {
    const summary: TemplateResult[] = [];

    // Light status
    if (this.lightCount > 0) {
      summary.push(html`
        <span class="summary-item">
          <ha-icon icon="mdi:lightbulb"></ha-icon>
          ${this.lightsOn}/${this.lightCount}
        </span>
      `);
    }

    // Temperature
    if (this.temperature !== undefined) {
      summary.push(html`
        <span class="summary-item">
          <ha-icon icon="mdi:thermometer"></ha-icon>
          ${this.temperature.toFixed(1)}°
        </span>
      `);
    }

    // Humidity
    if (this.humidity !== undefined) {
      summary.push(html`
        <span class="summary-item">
          <ha-icon icon="mdi:water-percent"></ha-icon>
          ${this.humidity.toFixed(0)}%
        </span>
      `);
    }

    // Last motion
    if (this.lastMotion) {
      const minutesAgo = Math.floor((Date.now() - this.lastMotion.getTime()) / 60000);
      const timeStr = minutesAgo < 1 ? 'now' : 
                      minutesAgo < 60 ? `${minutesAgo}m ago` :
                      `${Math.floor(minutesAgo / 60)}h ago`;
      summary.push(html`
        <span class="summary-item">
          <ha-icon icon="mdi:motion-sensor"></ha-icon>
          ${timeStr}
        </span>
      `);
    }

    return summary;
  }

  private renderExpanded(): TemplateResult {
    const sortedEntities = this.getSortedEntities();

    return html`
      <div class="entities">
        ${sortedEntities.map(entityId => this.renderEntity(entityId))}
      </div>
    `;
  }

  private renderEntity(entityId: string): TemplateResult {
    const state = this.entityStates.get(entityId);
    if (!state) return html``;

    const name = state.attributes.friendly_name || entityId;
    const domain = entityId.split('.')[0];
    const isToggleable = ['light', 'switch', 'fan', 'input_boolean'].includes(domain);

    return html`
      <div class="entity-row">
        <span class="entity-name">${name}</span>
        ${isToggleable ? html`
          <ha-switch
            .checked=${state.state === 'on'}
            @change=${() => this.toggleEntity(entityId)}
          ></ha-switch>
        ` : html`
          <span class="entity-state">${state.state}</span>
        `}
      </div>
    `;
  }

  private getSortedEntities(): string[] {
    const entities = Array.from(this.entityStates.keys());
    
    // Sort by domain priority, then by name
    const domainPriority: Record<string, number> = {
      'light': 1,
      'switch': 2,
      'fan': 3,
      'climate': 4,
      'cover': 5,
      'sensor': 6,
      'binary_sensor': 7,
    };

    return entities.sort((a, b) => {
      const domainA = a.split('.')[0];
      const domainB = b.split('.')[0];
      const priorityA = domainPriority[domainA] || 999;
      const priorityB = domainPriority[domainB] || 999;
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      return a.localeCompare(b);
    });
  }

  private toggleExpanded(): void {
    this.expanded = !this.expanded;
    
    // Update subscriptions when expanding/collapsing
    if (this.expanded) {
      this.updateSubscriptions();
    }
  }

  private async turnAllLightsOff(): Promise<void> {
    const lights = Array.from(this.entityStates.keys()).filter(id => 
      id.startsWith('light.') && this.entityStates.get(id)?.state === 'on'
    );

    for (const light of lights) {
      await this.turnOff(light);
    }
  }

  static styles = [
    DashviewWidget.styles,
    css`
      ha-card {
        height: 100%;
        display: flex;
        flex-direction: column;
      }

      .header {
        padding: 16px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .header h2 {
        margin: 0;
        font-size: 1.2em;
        font-weight: 500;
        flex: 1;
      }

      .summary {
        display: flex;
        gap: 16px;
        align-items: center;
        color: var(--secondary-text-color);
        font-size: 0.9em;
      }

      .summary-item {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .summary-item ha-icon {
        --mdc-icon-size: 16px;
      }

      .expand-icon {
        transition: transform 0.3s ease;
      }

      .expand-icon.expanded {
        transform: rotate(180deg);
      }

      .entities {
        flex: 1;
        overflow-y: auto;
        padding: 0 16px;
        max-height: 300px;
      }

      .entity-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid var(--divider-color);
      }

      .entity-row:last-child {
        border-bottom: none;
      }

      .entity-name {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .entity-state {
        color: var(--secondary-text-color);
        font-size: 0.9em;
      }

      .actions {
        padding: 8px 16px;
        border-top: 1px solid var(--divider-color);
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }

      .actions:empty {
        display: none;
      }

      mwc-button {
        --mdc-theme-primary: var(--primary-color);
      }

      mwc-button ha-icon {
        margin-right: 4px;
      }
    `
  ];
}