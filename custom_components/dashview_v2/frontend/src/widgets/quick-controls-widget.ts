/**
 * Quick controls widget for Dashview V2.
 * Provides fast access to frequently used controls and scenes.
 */

import { PropertyValues, TemplateResult, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { DashviewWidget, WidgetConfig } from '../core/widget-base';

interface QuickControlConfig {
  entityId: string;
  label?: string;
  icon?: string;
  color?: string;
  confirmAction?: boolean;
  service?: {
    domain: string;
    service: string;
    data?: Record<string, any>;
  };
}

interface QuickControlsWidgetConfig extends WidgetConfig {
  type: 'quick-controls';
  controls: QuickControlConfig[];
  columns?: number;
  showLabels?: boolean;
  iconSize?: 'small' | 'medium' | 'large';
}

@customElement('dashview-quick-controls-widget')
export class QuickControlsWidget extends DashviewWidget {
  @state() private controlStates: Map<string, boolean> = new Map();
  @state() private executingControl: string | null = null;

  protected subscribedEntities(): string[] {
    const config = this.widgetConfig as QuickControlsWidgetConfig;
    if (!config?.controls) return [];
    
    // Subscribe to all control entities
    return config.controls
      .map(control => control.entityId)
      .filter(id => id && !id.startsWith('script.') && !id.startsWith('scene.'));
  }

  protected getDefaultConfig(): Partial<QuickControlsWidgetConfig> {
    return {
      type: 'quick-controls',
      controls: [],
      columns: 4,
      showLabels: true,
      iconSize: 'medium',
    };
  }

  protected firstUpdated(changedProps: PropertyValues): void {
    super.firstUpdated(changedProps);
    this.updateControlStates();
  }

  protected onStateChanged(entityId: string, newState: any, oldState: any): void {
    super.onStateChanged(entityId, newState, oldState);
    this.updateControlStates();
  }

  private updateControlStates(): void {
    const config = this.widgetConfig as QuickControlsWidgetConfig;
    if (!config?.controls) return;

    const newStates = new Map<string, boolean>();
    
    for (const control of config.controls) {
      const entityId = control.entityId;
      if (!entityId) continue;

      const state = this.entityStates.get(entityId);
      if (state) {
        // For toggleable entities, track on/off state
        const domain = entityId.split('.')[0];
        if (['light', 'switch', 'fan', 'input_boolean'].includes(domain)) {
          newStates.set(entityId, state.state === 'on');
        }
      }
    }

    this.controlStates = newStates;
  }

  protected render(): TemplateResult {
    const config = this.widgetConfig as QuickControlsWidgetConfig;
    const title = this.widgetConfig?.title || 'Quick Controls';

    if (this.isLoading) {
      return html`
        <div class="widget-loading">
          Loading controls...
        </div>
      `;
    }

    if (this.error || !config?.controls || config.controls.length === 0) {
      return html`
        <div class="widget-error">
          ${this.error || 'No controls configured'}
        </div>
      `;
    }

    const columns = config.columns || 4;
    const iconSize = config.iconSize || 'medium';

    return html`
      <ha-card>
        <div class="header">
          <h2>${title}</h2>
        </div>

        <div 
          class="controls-grid"
          style="grid-template-columns: repeat(${columns}, 1fr)"
        >
          ${config.controls.map(control => this.renderControl(control, iconSize))}
        </div>
      </ha-card>
    `;
  }

  private renderControl(control: QuickControlConfig, iconSize: string): TemplateResult {
    const config = this.widgetConfig as QuickControlsWidgetConfig;
    const showLabels = config?.showLabels ?? true;
    
    const entityId = control.entityId;
    const state = entityId ? this.entityStates.get(entityId) : null;
    const isActive = this.controlStates.get(entityId) || false;
    const isExecuting = this.executingControl === entityId;
    
    // Determine icon
    let icon = control.icon;
    if (!icon && state) {
      icon = state.attributes.icon || this.getDefaultIcon(entityId);
    }
    
    // Determine label
    let label = control.label;
    if (!label && state) {
      label = state.attributes.friendly_name || entityId.split('.')[1].replace(/_/g, ' ');
    }
    
    // Determine color
    let color = control.color || 'var(--primary-color)';
    if (isActive && !control.color) {
      color = this.getActiveColor(entityId);
    }

    const buttonClass = `control-button ${iconSize} ${isActive ? 'active' : ''} ${isExecuting ? 'executing' : ''}`;

    return html`
      <button
        class="${buttonClass}"
        style="--control-color: ${color}"
        @click=${() => this.handleControlClick(control)}
        ?disabled=${isExecuting}
      >
        ${isExecuting ? html`
          <div class="spinner"></div>
        ` : html`
          <ha-icon icon="${icon}"></ha-icon>
        `}
        ${showLabels && label ? html`
          <span class="control-label">${label}</span>
        ` : ''}
      </button>
    `;
  }

  private getDefaultIcon(entityId: string): string {
    const [domain, name] = entityId.split('.');
    
    // Domain-based icons
    const domainIcons: Record<string, string> = {
      'light': 'mdi:lightbulb',
      'switch': 'mdi:toggle-switch',
      'fan': 'mdi:fan',
      'scene': 'mdi:palette',
      'script': 'mdi:script-text',
      'automation': 'mdi:robot',
      'input_boolean': 'mdi:toggle-switch-outline',
    };
    
    // Name-based icons
    if (name.includes('morning')) return 'mdi:weather-sunset-up';
    if (name.includes('night') || name.includes('bedtime')) return 'mdi:weather-night';
    if (name.includes('away')) return 'mdi:home-export-outline';
    if (name.includes('home')) return 'mdi:home';
    if (name.includes('party')) return 'mdi:party-popper';
    if (name.includes('movie') || name.includes('tv')) return 'mdi:television';
    if (name.includes('dinner') || name.includes('dining')) return 'mdi:silverware-fork-knife';
    if (name.includes('reading')) return 'mdi:book-open-page-variant';
    
    return domainIcons[domain] || 'mdi:gesture-tap';
  }

  private getActiveColor(entityId: string): string {
    const [domain] = entityId.split('.');
    
    switch (domain) {
      case 'light':
        return 'var(--warning-color)';
      case 'fan':
        return 'var(--info-color)';
      case 'switch':
        return 'var(--success-color)';
      default:
        return 'var(--primary-color)';
    }
  }

  private async handleControlClick(control: QuickControlConfig): Promise<void> {
    if (this.executingControl) return;
    
    const entityId = control.entityId;
    if (!entityId) return;

    // Handle confirmation if required
    if (control.confirmAction) {
      const label = control.label || entityId.split('.')[1].replace(/_/g, ' ');
      if (!confirm(`Execute "${label}"?`)) {
        return;
      }
    }

    this.executingControl = entityId;

    try {
      // Custom service call
      if (control.service) {
        await this.hass.callService(
          control.service.domain,
          control.service.service,
          {
            entity_id: entityId,
            ...control.service.data
          }
        );
      } else {
        // Default behavior based on entity type
        const [domain] = entityId.split('.');
        
        switch (domain) {
          case 'scene':
            await this.hass.callService('scene', 'turn_on', { entity_id: entityId });
            break;
            
          case 'script':
            await this.hass.callService('script', 'turn_on', { entity_id: entityId });
            break;
            
          case 'automation':
            await this.hass.callService('automation', 'trigger', { entity_id: entityId });
            break;
            
          case 'light':
          case 'switch':
          case 'fan':
          case 'input_boolean':
            await this.toggleEntity(entityId);
            break;
            
          default:
            console.warn(`Unknown entity domain: ${domain}`);
        }
      }

      // Visual feedback for non-toggleable entities
      if (['scene', 'script'].includes(entityId.split('.')[0])) {
        // Keep spinner for a moment to show execution
        setTimeout(() => {
          this.executingControl = null;
        }, 1000);
        return;
      }
    } catch (error) {
      console.error(`Failed to execute control ${entityId}:`, error);
    }

    this.executingControl = null;
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
        border-bottom: 1px solid var(--divider-color);
      }

      .header h2 {
        margin: 0;
        font-size: 1.2em;
        font-weight: 500;
      }

      .controls-grid {
        display: grid;
        gap: 12px;
        padding: 16px;
        align-content: start;
      }

      .control-button {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 16px 8px;
        border: 2px solid var(--divider-color);
        border-radius: 12px;
        background: var(--card-background-color);
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
        overflow: hidden;
      }

      .control-button:hover {
        background: var(--secondary-background-color);
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }

      .control-button:active {
        transform: translateY(0);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .control-button.active {
        background: var(--control-color);
        color: var(--text-primary-color, white);
        border-color: var(--control-color);
      }

      .control-button.active ha-icon {
        color: var(--text-primary-color, white);
      }

      .control-button:disabled {
        cursor: not-allowed;
        opacity: 0.7;
      }

      .control-button.executing {
        pointer-events: none;
      }

      /* Icon sizes */
      .control-button.small {
        padding: 12px 8px;
      }

      .control-button.small ha-icon {
        --mdc-icon-size: 24px;
      }

      .control-button.medium ha-icon {
        --mdc-icon-size: 32px;
      }

      .control-button.large {
        padding: 20px 12px;
      }

      .control-button.large ha-icon {
        --mdc-icon-size: 40px;
      }

      .control-label {
        font-size: 0.75em;
        text-align: center;
        line-height: 1.2;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }

      .control-button.large .control-label {
        font-size: 0.85em;
      }

      /* Spinner animation */
      .spinner {
        width: 24px;
        height: 24px;
        border: 3px solid var(--divider-color);
        border-top-color: var(--primary-color);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      /* Responsive adjustments */
      @media (max-width: 480px) {
        .controls-grid {
          gap: 8px;
          padding: 12px;
        }

        .control-button {
          padding: 12px 6px;
        }

        .control-button.medium ha-icon {
          --mdc-icon-size: 28px;
        }

        .control-label {
          font-size: 0.7em;
        }
      }

      /* Pulse animation for scenes/scripts */
      @keyframes pulse {
        0% {
          opacity: 1;
        }
        50% {
          opacity: 0.6;
        }
        100% {
          opacity: 1;
        }
      }

      .control-button.executing ha-icon {
        animation: pulse 1s ease-in-out infinite;
      }
    `
  ];
}