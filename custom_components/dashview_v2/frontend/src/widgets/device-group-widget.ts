/**
 * Device group widget for Dashview V2.
 * Groups and displays devices by type (switches, sensors, etc).
 */

import { PropertyValues, TemplateResult, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { DashviewWidget, WidgetConfig } from '../core/widget-base';

interface DeviceGroupWidgetConfig extends WidgetConfig {
  type: 'device-group';
  deviceType: 'switch' | 'sensor' | 'binary_sensor' | 'cover' | 'fan';
  groupName?: string;
  showOffline?: boolean;
  showGroupControls?: boolean;
}

interface GroupedEntity {
  entityId: string;
  name: string;
  state: string;
  icon?: string;
  lastChanged?: Date;
  isToggleable: boolean;
  isOnline: boolean;
}

@customElement('dashview-device-group-widget')
export class DeviceGroupWidget extends DashviewWidget {
  @property({ type: String }) deviceType: string = 'switch';
  @property({ type: String }) groupName?: string;
  @state() private expanded = false;
  @state() private groupedEntities: GroupedEntity[] = [];
  @state() private onlineCount = 0;
  @state() private activeCount = 0;

  protected subscribedEntities(): string[] {
    // Subscribe to all entities when expanded, or just active ones when collapsed
    const entities = this.widgetConfig?.entities || [];
    
    if (this.expanded) {
      return entities;
    }
    
    // When collapsed, only subscribe to active entities
    return entities.filter(id => {
      const state = this.entityStates.get(id);
      return state && state.state !== 'unavailable' && state.state !== 'unknown';
    });
  }

  protected getDefaultConfig(): Partial<DeviceGroupWidgetConfig> {
    return {
      type: 'device-group',
      deviceType: 'switch',
      entities: [],
      showOffline: false,
      showGroupControls: true,
    };
  }

  protected firstUpdated(changedProps: PropertyValues): void {
    super.firstUpdated(changedProps);
    this.updateGroupedEntities();
  }

  protected onStateChanged(entityId: string, newState: any, oldState: any): void {
    super.onStateChanged(entityId, newState, oldState);
    this.updateGroupedEntities();
  }

  private updateGroupedEntities(): void {
    const grouped: GroupedEntity[] = [];
    let onlineCount = 0;
    let activeCount = 0;

    for (const [entityId, state] of this.entityStates) {
      const isOnline = state.state !== 'unavailable' && state.state !== 'unknown';
      const isToggleable = this.isToggleableEntity(entityId);
      const isActive = isToggleable ? state.state === 'on' : isOnline;

      if (isOnline) onlineCount++;
      if (isActive) activeCount++;

      grouped.push({
        entityId,
        name: state.attributes.friendly_name || entityId.split('.')[1].replace(/_/g, ' '),
        state: state.state,
        icon: state.attributes.icon || this.getDefaultIcon(entityId),
        lastChanged: state.last_changed ? new Date(state.last_changed) : undefined,
        isToggleable,
        isOnline,
      });
    }

    // Sort by online status, then by state, then by name
    grouped.sort((a, b) => {
      if (a.isOnline !== b.isOnline) return b.isOnline ? 1 : -1;
      if (a.state !== b.state) {
        if (a.state === 'on') return -1;
        if (b.state === 'on') return 1;
      }
      return a.name.localeCompare(b.name);
    });

    this.groupedEntities = grouped;
    this.onlineCount = onlineCount;
    this.activeCount = activeCount;
  }

  private isToggleableEntity(entityId: string): boolean {
    const domain = entityId.split('.')[0];
    return ['switch', 'light', 'fan', 'input_boolean', 'cover'].includes(domain);
  }

  private getDefaultIcon(entityId: string): string {
    const domain = entityId.split('.')[0];
    const iconMap: Record<string, string> = {
      'switch': 'mdi:toggle-switch',
      'sensor': 'mdi:eye',
      'binary_sensor': 'mdi:radiobox-blank',
      'cover': 'mdi:window-shutter',
      'fan': 'mdi:fan',
      'light': 'mdi:lightbulb',
    };
    return iconMap[domain] || 'mdi:devices';
  }

  protected render(): TemplateResult {
    const title = this.groupName || 
                  this.widgetConfig?.title || 
                  `${this.deviceType.charAt(0).toUpperCase() + this.deviceType.slice(1)}s`;

    if (this.isLoading) {
      return html`
        <div class="widget-loading">
          Loading devices...
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

    const config = this.widgetConfig as DeviceGroupWidgetConfig;
    const showOffline = config?.showOffline ?? false;
    const filteredEntities = showOffline ? 
      this.groupedEntities : 
      this.groupedEntities.filter(e => e.isOnline);

    return html`
      <ha-card>
        <div class="header" @click=${this.toggleExpanded}>
          <div class="header-content">
            <h2>${title}</h2>
            <div class="device-count">
              ${this.activeCount}/${this.onlineCount}
            </div>
          </div>
          <ha-icon
            class="expand-icon ${this.expanded ? 'expanded' : ''}"
            icon="mdi:chevron-down"
          ></ha-icon>
        </div>

        ${this.expanded ? html`
          <div class="entities">
            ${filteredEntities.length === 0 ? html`
              <div class="empty-state">
                No ${showOffline ? '' : 'online'} devices found
              </div>
            ` : filteredEntities.map(entity => this.renderEntity(entity))}
          </div>
        ` : ''}

        ${this.renderActions()}
      </ha-card>
    `;
  }

  private renderEntity(entity: GroupedEntity): TemplateResult {
    const stateDisplay = this.getStateDisplay(entity);
    const stateClass = entity.isOnline ? '' : 'offline';

    return html`
      <div class="entity-row ${stateClass}">
        <ha-icon 
          icon="${entity.icon}"
          class="entity-icon ${entity.state === 'on' ? 'active' : ''}"
        ></ha-icon>
        <span class="entity-name">${entity.name}</span>
        ${entity.isToggleable && entity.isOnline ? html`
          <ha-switch
            .checked=${entity.state === 'on'}
            @change=${() => this.toggleEntity(entity.entityId)}
          ></ha-switch>
        ` : html`
          <span class="entity-state">${stateDisplay}</span>
        `}
      </div>
    `;
  }

  private getStateDisplay(entity: GroupedEntity): string {
    if (!entity.isOnline) return 'Offline';
    
    // For sensors, show the value with unit
    if (entity.entityId.includes('sensor')) {
      const state = this.entityStates.get(entity.entityId);
      const unit = state?.attributes?.unit_of_measurement || '';
      return `${entity.state}${unit ? ' ' + unit : ''}`;
    }
    
    // For binary sensors, show more descriptive text
    if (entity.entityId.includes('binary_sensor')) {
      return entity.state === 'on' ? 'Detected' : 'Clear';
    }
    
    return entity.state;
  }

  private renderActions(): TemplateResult {
    const config = this.widgetConfig as DeviceGroupWidgetConfig;
    const showGroupControls = config?.showGroupControls ?? true;
    
    if (!showGroupControls || !this.hasToggleableEntities()) {
      return html``;
    }

    const hasActiveDevices = this.groupedEntities.some(e => 
      e.isToggleable && e.isOnline && e.state === 'on'
    );

    return html`
      <div class="actions">
        ${hasActiveDevices ? html`
          <mwc-button @click=${this.turnAllOff}>
            <ha-icon icon="mdi:power-off"></ha-icon>
            All Off
          </mwc-button>
        ` : ''}
        <mwc-button @click=${this.turnAllOn}>
          <ha-icon icon="mdi:power-on"></ha-icon>
          All On
        </mwc-button>
      </div>
    `;
  }

  private hasToggleableEntities(): boolean {
    return this.groupedEntities.some(e => e.isToggleable && e.isOnline);
  }

  private toggleExpanded(): void {
    this.expanded = !this.expanded;
    
    // Update subscriptions when expanding/collapsing
    if (this.expanded) {
      this.updateSubscriptions();
    }
  }

  private async turnAllOff(): Promise<void> {
    const toggleable = this.groupedEntities.filter(e => 
      e.isToggleable && e.isOnline && e.state === 'on'
    );

    for (const entity of toggleable) {
      await this.turnOff(entity.entityId);
    }
  }

  private async turnAllOn(): Promise<void> {
    const toggleable = this.groupedEntities.filter(e => 
      e.isToggleable && e.isOnline && e.state === 'off'
    );

    for (const entity of toggleable) {
      await this.turnOn(entity.entityId);
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
        justify-content: space-between;
        background: linear-gradient(to bottom, rgba(var(--rgb-primary-color), 0.05), transparent);
      }

      .header-content {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .header h2 {
        margin: 0;
        font-size: 1.2em;
        font-weight: 500;
      }

      .device-count {
        background: var(--primary-color);
        color: var(--text-primary-color, white);
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.8em;
        font-weight: 500;
      }

      .expand-icon {
        transition: transform 0.3s ease;
        color: var(--secondary-text-color);
      }

      .expand-icon.expanded {
        transform: rotate(180deg);
      }

      .entities {
        flex: 1;
        overflow-y: auto;
        padding: 0 16px;
        max-height: 400px;
      }

      .entity-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 0;
        border-bottom: 1px solid var(--divider-color);
        transition: opacity 0.2s ease;
      }

      .entity-row:last-child {
        border-bottom: none;
      }

      .entity-row.offline {
        opacity: 0.5;
      }

      .entity-icon {
        --mdc-icon-size: 20px;
        color: var(--secondary-text-color);
        transition: color 0.2s ease;
      }

      .entity-icon.active {
        color: var(--primary-color);
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
        min-width: 60px;
        text-align: right;
      }

      .empty-state {
        padding: 32px;
        text-align: center;
        color: var(--secondary-text-color);
        font-style: italic;
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