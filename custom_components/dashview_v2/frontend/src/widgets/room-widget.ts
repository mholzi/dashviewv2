/**
 * Room widget for Dashview V2.
 * Displays all entities in a room with summary and controls.
 */

import { PropertyValues, TemplateResult, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { DashviewWidget, WidgetConfig } from '../core/widget-base';
import { getEntityIcon, getEntityIconColor } from '../utils/icons';
import { skeletonStyles, touchStyles } from '../styles/animations';

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
  @state() private groupedEntities: Record<string, string[]> = {};

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

    // Group entities by type for better organization
    this.groupedEntities = this.groupEntitiesByType();

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
      return this.renderSkeleton();
    }

    if (this.error) {
      return html`
        <div class="widget-error">
          ${this.error}
        </div>
      `;
    }

    return html`
      <ha-card role="region" aria-label="${roomName} room controls">
        <div class="header touch-target" @click=${this.toggleExpanded} @keydown=${this.handleHeaderKeydown}>
          <h2>${roomName}</h2>
          <div class="summary">
            ${this.renderSummary()}
          </div>
          <ha-icon
            class="expand-icon ${this.expanded ? 'expanded' : ''}"
            icon="mdi:chevron-down"
            aria-label="${this.expanded ? 'Collapse' : 'Expand'} room details"
          ></ha-icon>
        </div>
        
        <div class="content ${this.expanded ? 'expanded' : 'collapsed'}">
          ${this.renderExpanded()}
        </div>
        
        <div class="actions">
          ${this.lightCount > 0 ? html`
            <mwc-button @click=${this.turnAllLightsOff} aria-label="Turn all lights off">
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
    return html`
      <div class="entity-list">
        ${Object.entries(this.groupedEntities).map(([type, entities]) => 
          this.renderEntityGroup(type, entities)
        )}
      </div>
    `;
  }

  private renderEntity(entityId: string): TemplateResult {
    const state = this.entityStates.get(entityId);
    if (!state) return html``;

    const name = state.attributes.friendly_name || entityId;
    const domain = entityId.split('.')[0];
    const isToggleable = ['light', 'switch', 'fan', 'input_boolean'].includes(domain);
    const icon = getEntityIcon(entityId, state);
    const iconColor = getEntityIconColor(entityId, state);

    return html`
      <div class="entity-item touch-target" @click=${isToggleable ? () => this.toggleEntity(entityId) : undefined}>
        <ha-icon 
          class="entity-icon ${state.state} ${state.state === 'unavailable' ? 'unavailable' : ''}"
          icon="${icon}"
          style="color: ${iconColor}"
        ></ha-icon>
        <span class="entity-name">${name}</span>
        <div class="entity-controls">
          ${isToggleable ? html`
            <ha-switch
              .checked=${state.state === 'on'}
              @change=${(e: Event) => {
                e.stopPropagation();
                this.toggleEntity(entityId);
              }}
              aria-label="Toggle ${name}"
            ></ha-switch>
          ` : html`
            <span class="entity-state">${state.state}</span>
          `}
        </div>
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

  private handleHeaderKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggleExpanded();
    }
  }

  private groupEntitiesByType(): Record<string, string[]> {
    const groups: Record<string, string[]> = {};
    
    for (const entityId of this.entityStates.keys()) {
      const domain = entityId.split('.')[0];
      
      // Group by domain with friendly names
      const groupName = this.getDomainGroupName(domain);
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(entityId);
    }
    
    // Sort entities within each group
    for (const [groupName, entities] of Object.entries(groups)) {
      groups[groupName] = entities.sort((a, b) => {
        const stateA = this.entityStates.get(a);
        const stateB = this.entityStates.get(b);
        const nameA = stateA?.attributes?.friendly_name || a;
        const nameB = stateB?.attributes?.friendly_name || b;
        return nameA.localeCompare(nameB);
      });
    }
    
    return groups;
  }

  private getDomainGroupName(domain: string): string {
    const domainNames: Record<string, string> = {
      'light': 'Lights',
      'switch': 'Switches',
      'fan': 'Fans',
      'climate': 'Climate',
      'cover': 'Covers',
      'lock': 'Locks',
      'sensor': 'Sensors',
      'binary_sensor': 'Binary Sensors',
      'media_player': 'Media',
      'camera': 'Cameras',
      'alarm_control_panel': 'Security'
    };
    
    return domainNames[domain] || domain.charAt(0).toUpperCase() + domain.slice(1);
  }

  private renderEntityGroup(type: string, entities: string[]): TemplateResult {
    if (entities.length === 0) return html``;
    
    const typeIcons: Record<string, string> = {
      'Lights': 'mdi:lightbulb',
      'Switches': 'mdi:light-switch',
      'Sensors': 'mdi:eye',
      'Climate': 'mdi:thermostat',
      'Media': 'mdi:television',
      'Covers': 'mdi:window-shutter',
      'Locks': 'mdi:lock',
      'Fans': 'mdi:fan',
      'Cameras': 'mdi:cctv',
      'Security': 'mdi:shield-home'
    };
    
    return html`
      <div class="entity-group">
        <div class="entity-group-header">
          <ha-icon icon=${typeIcons[type] || 'mdi:home'}></ha-icon>
          <span>${type}</span>
          <span class="count">(${entities.length})</span>
        </div>
        ${entities.map(entity => this.renderEntity(entity))}
      </div>
    `;
  }

  private renderSkeleton(): TemplateResult {
    return html`
      <ha-card>
        <div class="header">
          <div class="skeleton skeleton-text large" style="width: 120px;"></div>
          <div class="summary">
            <div class="skeleton skeleton-text" style="width: 40px;"></div>
            <div class="skeleton skeleton-text" style="width: 50px;"></div>
            <div class="skeleton skeleton-text" style="width: 45px;"></div>
          </div>
          <div class="skeleton skeleton-icon"></div>
        </div>
      </ha-card>
    `;
  }

  private async turnAllLightsOff(): Promise<void> {
    const lights = Array.from(this.entityStates.keys()).filter(id => 
      id.startsWith('light.') && this.entityStates.get(id)?.state === 'on'
    );

    for (const light of lights) {
      await this.turnOff(light);
    }
  }

  static styles = css`
    ${DashviewWidget.styles}
    ${skeletonStyles}
    ${touchStyles}
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
        border-radius: 8px;
        -webkit-tap-highlight-color: transparent;
        transition: background 150ms cubic-bezier(0.4, 0.0, 0.2, 1);
      }

      .header:hover {
        background: var(--secondary-background-color);
      }

      .header:focus {
        outline: 2px solid var(--primary-color);
        outline-offset: 2px;
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
        transition: transform 250ms cubic-bezier(0.4, 0.0, 0.2, 1);
        --mdc-icon-size: 24px;
      }

      .expand-icon.expanded {
        transform: rotate(180deg);
      }

      /* Enhanced content with smooth animations */
      .content {
        overflow: hidden;
        transition: max-height 250ms cubic-bezier(0.0, 0.0, 0.2, 1);
      }

      .content.collapsed {
        max-height: 0;
      }

      .content.expanded {
        max-height: 600px;
      }

      .entity-list {
        display: flex;
        flex-direction: column;
        gap: 2px;
        max-height: 400px;
        overflow-y: auto;
        scrollbar-width: thin;
        padding: 0 16px 16px;
      }

      .entity-group {
        margin-bottom: 16px;
      }

      .entity-group:last-child {
        margin-bottom: 0;
      }

      .entity-group-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 0;
        font-weight: 500;
        color: var(--secondary-text-color);
        font-size: 0.9em;
        border-bottom: 1px solid var(--divider-color);
        margin-bottom: 8px;
      }

      .entity-group-header ha-icon {
        --mdc-icon-size: 18px;
      }

      .count {
        opacity: 0.7;
        font-size: 0.85em;
      }

      .entity-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        border-radius: 8px;
        transition: all 150ms cubic-bezier(0.4, 0.0, 0.2, 1);
        min-height: 44px;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }

      .entity-item:hover {
        background: var(--secondary-background-color);
      }

      .entity-item:active {
        transform: scale(0.98);
      }

      .entity-icon {
        --mdc-icon-size: 24px;
        transition: color 150ms cubic-bezier(0.4, 0.0, 0.2, 1);
        flex-shrink: 0;
      }

      .entity-icon.unavailable {
        color: var(--disabled-text-color);
      }

      .entity-name {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 0.95em;
      }

      .entity-controls {
        display: flex;
        align-items: center;
        flex-shrink: 0;
      }

      .entity-state {
        color: var(--secondary-text-color);
        font-size: 0.9em;
        text-align: right;
        min-width: 60px;
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
        min-height: 44px;
      }

      mwc-button ha-icon {
        margin-right: 4px;
      }

      /* Mobile optimizations */
      @media (max-width: 768px) {
        .header {
          padding: 12px;
        }

        .summary {
          gap: 12px;
          font-size: 0.85em;
        }

        .entity-item {
          padding: 10px 12px;
        }

        .entity-name {
          font-size: 0.9em;
        }
      }

      /* Accessibility enhancements */
      @media (prefers-reduced-motion: reduce) {
        .header,
        .expand-icon,
        .entity-item,
        .entity-icon,
        .content {
          transition: none;
        }

        .entity-item:active {
          transform: none;
        }
      }

      /* Focus indicators */
      .entity-item:focus,
      ha-switch:focus {
        outline: 2px solid var(--primary-color);
        outline-offset: 2px;
      }
    `;
}