/**
 * Climate widget for Dashview V2.
 * Controls HVAC systems, thermostats, and climate entities.
 */

import { PropertyValues, TemplateResult, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { DashviewWidget, WidgetConfig } from '../core/widget-base';
import { skeletonStyles, touchStyles } from '../styles/animations';

interface ClimateWidgetConfig extends WidgetConfig {
  type: 'climate';
  climateEntityId: string;
  showHumidity?: boolean;
  showPresets?: boolean;
  temperatureStep?: number;
}

type HvacMode = 'off' | 'heat' | 'cool' | 'heat_cool' | 'auto' | 'dry' | 'fan_only';
type PresetMode = 'eco' | 'away' | 'boost' | 'comfort' | 'home' | 'sleep' | 'activity';

@customElement('dashview-climate-widget')
export class ClimateWidget extends DashviewWidget {
  @property({ type: String }) climateEntityId?: string;
  @state() private currentTemp?: number;
  @state() private targetTemp?: number;
  @state() private targetTempLow?: number;
  @state() private targetTempHigh?: number;
  @state() private humidity?: number;
  @state() private hvacMode: HvacMode = 'off';
  @state() private presetMode?: PresetMode;
  @state() private availableModes: HvacMode[] = [];
  @state() private availablePresets: PresetMode[] = [];
  @state() private isAdjusting = false;
  @state() private showTempDial = true;

  protected subscribedEntities(): string[] {
    const entities: string[] = [];
    
    // Primary climate entity
    const climateId = this.climateEntityId || this.widgetConfig?.entities?.[0];
    if (climateId) {
      entities.push(climateId);
    }
    
    // Related humidity sensor if any
    const humidityEntity = this.widgetConfig?.entities?.find(e => 
      e.includes('humidity') && !e.includes('climate')
    );
    if (humidityEntity) {
      entities.push(humidityEntity);
    }
    
    return entities;
  }

  protected getDefaultConfig(): Partial<ClimateWidgetConfig> {
    return {
      type: 'climate',
      entities: [],
      showHumidity: true,
      showPresets: true,
      temperatureStep: 0.5,
    };
  }

  protected firstUpdated(changedProps: PropertyValues): void {
    super.firstUpdated(changedProps);
    this.updateClimateState();
  }

  protected onStateChanged(entityId: string, newState: any, oldState: any): void {
    super.onStateChanged(entityId, newState, oldState);
    this.updateClimateState();
  }

  private updateClimateState(): void {
    const climateId = this.climateEntityId || this.widgetConfig?.entities?.[0];
    if (!climateId) return;

    const climateState = this.entityStates.get(climateId);
    if (!climateState) return;

    // Update temperature values
    this.currentTemp = climateState.attributes.current_temperature;
    this.hvacMode = climateState.state as HvacMode;
    this.presetMode = climateState.attributes.preset_mode as PresetMode;
    
    // Handle different temperature control modes
    if (climateState.attributes.target_temp_low && climateState.attributes.target_temp_high) {
      this.targetTempLow = climateState.attributes.target_temp_low;
      this.targetTempHigh = climateState.attributes.target_temp_high;
      this.targetTemp = undefined;
    } else {
      this.targetTemp = climateState.attributes.temperature;
      this.targetTempLow = undefined;
      this.targetTempHigh = undefined;
    }

    // Available modes
    this.availableModes = climateState.attributes.hvac_modes || [];
    this.availablePresets = climateState.attributes.preset_modes || [];

    // Check for humidity sensor
    const humidityEntity = this.widgetConfig?.entities?.find(e => 
      e.includes('humidity') && !e.includes('climate')
    );
    if (humidityEntity) {
      const humidityState = this.entityStates.get(humidityEntity);
      if (humidityState && humidityState.state !== 'unavailable') {
        this.humidity = parseFloat(humidityState.state);
      }
    }
  }

  protected render(): TemplateResult {
    const climateId = this.climateEntityId || this.widgetConfig?.entities?.[0];
    const title = this.widgetConfig?.title || 'Climate Control';

    if (this.isLoading) {
      return this.renderSkeleton();
    }

    if (this.error || !climateId) {
      return html`
        <div class="widget-error">
          ${this.error || 'No climate entity configured'}
        </div>
      `;
    }

    return html`
      <ha-card>
        <div class="header">
          <h2>${title}</h2>
          <div class="hvac-mode ${this.hvacMode}">
            ${this.hvacMode.toUpperCase()}
          </div>
        </div>

        <div class="temperature-display">
          ${this.showTempDial ? this.renderTemperatureDial() : this.renderTemperatureDisplay()}
        </div>

        ${this.renderTemperatureControls()}
        ${this.renderModeSelector()}
        ${this.renderPresetSelector()}
        ${this.renderHumidity()}
      </ha-card>
    `;
  }

  private renderTemperatureDisplay(): TemplateResult {
    if (this.currentTemp === undefined) {
      return html`<span class="temp-unavailable">--</span>`;
    }

    return html`
      <div class="current-temp">
        <span class="temp-value">${this.currentTemp.toFixed(1)}</span>
        <span class="temp-unit">°C</span>
      </div>
      ${this.renderTargetTemp()}
    `;
  }

  private renderTemperatureDial(): TemplateResult {
    if (this.currentTemp === undefined) {
      return html`<div class="temp-dial-unavailable">Temperature Unavailable</div>`;
    }

    const minTemp = 10;
    const maxTemp = 35;
    const currentPercent = Math.max(0, Math.min(100, ((this.currentTemp - minTemp) / (maxTemp - minTemp)) * 100));
    const targetPercent = this.targetTemp ? Math.max(0, Math.min(100, ((this.targetTemp - minTemp) / (maxTemp - minTemp)) * 100)) : currentPercent;

    return html`
      <div class="temp-dial-container">
        <div class="temp-dial">
          <svg viewBox="0 0 200 200" class="dial-svg">
            <!-- Background circle -->
            <circle cx="100" cy="100" r="80" class="dial-bg" />
            <!-- Current temperature arc -->
            <circle 
              cx="100" 
              cy="100" 
              r="80" 
              class="dial-current"
              stroke-dasharray="${(currentPercent / 100) * 502.6} 502.6"
              transform="rotate(-90 100 100)"
            />
            <!-- Target temperature indicator -->
            ${this.targetTemp ? html`
              <circle 
                cx="100" 
                cy="100" 
                r="80" 
                class="dial-target"
                stroke-dasharray="3 502.6"
                stroke-dashoffset="${-((targetPercent / 100) * 502.6)}"
                transform="rotate(-90 100 100)"
              />
            ` : ''}
          </svg>
          <div class="dial-center">
            <div class="current-temp-dial">
              <span class="temp-value-dial">${this.currentTemp.toFixed(1)}</span>
              <span class="temp-unit-dial">°C</span>
            </div>
            ${this.targetTemp ? html`
              <div class="target-temp-dial">
                Target: ${this.targetTemp.toFixed(1)}°C
              </div>
            ` : ''}
          </div>
        </div>
        <div class="temp-trend">
          ${this.renderTemperatureTrend()}
        </div>
      </div>
    `;
  }

  private renderTemperatureTrend(): TemplateResult {
    // Placeholder for temperature trend mini-graph
    // In a real implementation, this would show historical data
    return html`
      <div class="trend-indicator">
        <ha-icon icon="mdi:trending-up" class="trend-icon"></ha-icon>
        <span class="trend-text">Trending up</span>
      </div>
    `;
  }

  private renderTargetTemp(): TemplateResult {
    if (this.hvacMode === 'off') {
      return html``;
    }

    if (this.targetTempLow !== undefined && this.targetTempHigh !== undefined) {
      return html`
        <div class="target-temp-range">
          <span class="target-label">Target:</span>
          <span class="target-value">${this.targetTempLow.toFixed(1)} - ${this.targetTempHigh.toFixed(1)}°C</span>
        </div>
      `;
    }

    if (this.targetTemp !== undefined) {
      return html`
        <div class="target-temp">
          <span class="target-label">Target:</span>
          <span class="target-value">${this.targetTemp.toFixed(1)}°C</span>
        </div>
      `;
    }

    return html``;
  }

  private renderTemperatureControls(): TemplateResult {
    if (this.hvacMode === 'off' || this.hvacMode === 'fan_only') {
      return html``;
    }

    const config = this.widgetConfig as ClimateWidgetConfig;
    const step = config?.temperatureStep || 0.5;

    if (this.targetTempLow !== undefined && this.targetTempHigh !== undefined) {
      return html`
        <div class="temp-controls-dual">
          <div class="temp-control">
            <span class="control-label">Cool to</span>
            <div class="control-buttons">
              <ha-icon-button
                icon="mdi:minus"
                @click=${() => this.adjustTargetTemp('low', -step)}
              ></ha-icon-button>
              <span class="control-value">${this.targetTempLow.toFixed(1)}°C</span>
              <ha-icon-button
                icon="mdi:plus"
                @click=${() => this.adjustTargetTemp('low', step)}
              ></ha-icon-button>
            </div>
          </div>
          <div class="temp-control">
            <span class="control-label">Heat to</span>
            <div class="control-buttons">
              <ha-icon-button
                icon="mdi:minus"
                @click=${() => this.adjustTargetTemp('high', -step)}
              ></ha-icon-button>
              <span class="control-value">${this.targetTempHigh.toFixed(1)}°C</span>
              <ha-icon-button
                icon="mdi:plus"
                @click=${() => this.adjustTargetTemp('high', step)}
              ></ha-icon-button>
            </div>
          </div>
        </div>
      `;
    }

    if (this.targetTemp !== undefined) {
      return html`
        <div class="temp-controls">
          <ha-icon-button
            icon="mdi:minus"
            @click=${() => this.adjustTargetTemp('single', -step)}
          ></ha-icon-button>
          <span class="control-value">${this.targetTemp.toFixed(1)}°C</span>
          <ha-icon-button
            icon="mdi:plus"
            @click=${() => this.adjustTargetTemp('single', step)}
          ></ha-icon-button>
        </div>
      `;
    }

    return html``;
  }

  private renderModeSelector(): TemplateResult {
    if (this.availableModes.length <= 1) {
      return html``;
    }

    const modeIcons: Record<HvacMode, string> = {
      'off': 'mdi:power',
      'heat': 'mdi:fire',
      'cool': 'mdi:snowflake',
      'heat_cool': 'mdi:autorenew',
      'auto': 'mdi:calendar-sync',
      'dry': 'mdi:water-percent',
      'fan_only': 'mdi:fan',
    };

    const modeColors: Record<HvacMode, string> = {
      'off': 'var(--secondary-text-color)',
      'heat': '#ff6b00',
      'cool': '#0288d1',
      'heat_cool': '#388e3c',
      'auto': '#388e3c',
      'dry': '#9c27b0',
      'fan_only': '#607d8b',
    };

    return html`
      <div class="mode-selector">
        ${this.availableModes.map(mode => html`
          <button
            class="mode-button touch-target ${mode === this.hvacMode ? 'active' : ''}"
            @click=${() => this.setHvacMode(mode)}
            aria-label="Set ${mode.replace('_', ' ')} mode"
            style="--mode-color: ${modeColors[mode]}"
          >
            <ha-icon icon="${modeIcons[mode]}"></ha-icon>
            <span>${mode.replace('_', ' ')}</span>
          </button>
        `)}
      </div>
    `;
  }

  private renderPresetSelector(): TemplateResult {
    const config = this.widgetConfig as ClimateWidgetConfig;
    if (!config?.showPresets || this.availablePresets.length === 0) {
      return html``;
    }

    const presetIcons: Record<string, string> = {
      'eco': 'mdi:leaf',
      'away': 'mdi:home-export-outline',
      'boost': 'mdi:rocket-launch',
      'comfort': 'mdi:sofa',
      'home': 'mdi:home',
      'sleep': 'mdi:sleep',
      'activity': 'mdi:run'
    };

    return html`
      <div class="preset-selector">
        <span class="preset-label">Presets:</span>
        <div class="preset-buttons">
          <button 
            class="preset-button touch-target ${!this.presetMode ? 'active' : ''}"
            @click=${() => this.setPresetMode(null)}
            aria-label="No preset"
          >
            <ha-icon icon="mdi:close"></ha-icon>
            <span>None</span>
          </button>
          ${this.availablePresets.map(preset => html`
            <button
              class="preset-button touch-target ${preset === this.presetMode ? 'active' : ''}"
              @click=${() => this.setPresetMode(preset)}
              aria-label="Set ${preset} preset"
            >
              <ha-icon icon="${presetIcons[preset] || 'mdi:cog'}"></ha-icon>
              <span>${preset}</span>
            </button>
          `)}
        </div>
      </div>
    `;
  }

  private renderHumidity(): TemplateResult {
    const config = this.widgetConfig as ClimateWidgetConfig;
    if (!config?.showHumidity || this.humidity === undefined) {
      return html``;
    }

    return html`
      <div class="humidity-display">
        <ha-icon icon="mdi:water-percent"></ha-icon>
        <span>Humidity: ${this.humidity.toFixed(0)}%</span>
      </div>
    `;
  }

  private async adjustTargetTemp(type: 'single' | 'low' | 'high', change: number): Promise<void> {
    if (this.isAdjusting) return;
    
    const climateId = this.climateEntityId || this.widgetConfig?.entities?.[0];
    if (!climateId) return;

    this.isAdjusting = true;

    try {
      const service_data: any = {};
      
      if (type === 'single' && this.targetTemp !== undefined) {
        service_data.temperature = Math.round((this.targetTemp + change) * 2) / 2;
      } else if (type === 'low' && this.targetTempLow !== undefined) {
        service_data.target_temp_low = Math.round((this.targetTempLow + change) * 2) / 2;
        service_data.target_temp_high = this.targetTempHigh;
      } else if (type === 'high' && this.targetTempHigh !== undefined) {
        service_data.target_temp_low = this.targetTempLow;
        service_data.target_temp_high = Math.round((this.targetTempHigh + change) * 2) / 2;
      }

      await this.hass.callService('climate', 'set_temperature', {
        entity_id: climateId,
        ...service_data
      });
    } catch (error) {
      console.error('Failed to adjust temperature:', error);
    } finally {
      this.isAdjusting = false;
    }
  }

  private async setHvacMode(mode: HvacMode): Promise<void> {
    const climateId = this.climateEntityId || this.widgetConfig?.entities?.[0];
    if (!climateId) return;

    try {
      await this.hass.callService('climate', 'set_hvac_mode', {
        entity_id: climateId,
        hvac_mode: mode
      });
    } catch (error) {
      console.error('Failed to set HVAC mode:', error);
    }
  }

  private async setPresetMode(preset: PresetMode | null): Promise<void> {
    const climateId = this.climateEntityId || this.widgetConfig?.entities?.[0];
    if (!climateId) return;

    try {
      await this.hass.callService('climate', 'set_preset_mode', {
        entity_id: climateId,
        preset_mode: preset
      });
    } catch (error) {
      console.error('Failed to set preset mode:', error);
    }
  }

  private renderSkeleton(): TemplateResult {
    return html`
      <ha-card>
        <div class="header">
          <div class="skeleton skeleton-text large" style="width: 140px;"></div>
          <div class="skeleton skeleton-button" style="width: 80px; height: 28px;"></div>
        </div>
        <div class="temperature-display">
          <div class="skeleton skeleton-card" style="height: 200px; margin: 16px;"></div>
        </div>
        <div class="mode-selector">
          <div class="skeleton skeleton-button" style="margin: 8px;"></div>
          <div class="skeleton skeleton-button" style="margin: 8px;"></div>
          <div class="skeleton skeleton-button" style="margin: 8px;"></div>
        </div>
      </ha-card>
    `;
  }

  static styles = css`
    ${DashviewWidget.styles}
    ${skeletonStyles}
    ${touchStyles}
      ha-card {
        height: 100%;
        min-height: 250px;
        display: flex;
        flex-direction: column;
      }

      .header {
        padding: 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .header h2 {
        margin: 0;
        font-size: 1.2em;
        font-weight: 500;
      }

      .hvac-mode {
        padding: 4px 12px;
        border-radius: 16px;
        font-size: 0.8em;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .hvac-mode.off {
        background: var(--secondary-background-color);
        color: var(--secondary-text-color);
      }

      .hvac-mode.heat {
        background: rgba(255, 152, 0, 0.2);
        color: #ff6b00;
      }

      .hvac-mode.cool {
        background: rgba(33, 150, 243, 0.2);
        color: #0288d1;
      }

      .hvac-mode.heat_cool,
      .hvac-mode.auto {
        background: rgba(76, 175, 80, 0.2);
        color: #388e3c;
      }

      .temperature-display {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 16px;
      }

      .current-temp {
        display: flex;
        align-items: baseline;
        gap: 4px;
      }

      .temp-value {
        font-size: 3.5em;
        font-weight: 300;
        color: var(--primary-color);
        line-height: 1;
      }

      .temp-unit {
        font-size: 1.5em;
        color: var(--secondary-text-color);
      }

      .temp-unavailable {
        font-size: 3em;
        color: var(--secondary-text-color);
      }

      .target-temp,
      .target-temp-range {
        margin-top: 8px;
        color: var(--secondary-text-color);
        font-size: 0.9em;
      }

      .target-label {
        opacity: 0.8;
        margin-right: 4px;
      }

      .temp-controls {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;
        padding: 16px;
        border-top: 1px solid var(--divider-color);
      }

      .temp-controls-dual {
        display: flex;
        gap: 24px;
        padding: 16px;
        border-top: 1px solid var(--divider-color);
      }

      .temp-control {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }

      .control-label {
        font-size: 0.85em;
        color: var(--secondary-text-color);
      }

      .control-buttons {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .control-value {
        font-size: 1.4em;
        min-width: 60px;
        text-align: center;
      }

      .mode-selector {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
        gap: 8px;
        padding: 16px;
        border-top: 1px solid var(--divider-color);
      }

      .mode-button {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        padding: 12px 8px;
        border: 2px solid var(--divider-color);
        border-radius: 12px;
        background: var(--card-background-color);
        cursor: pointer;
        transition: all 150ms cubic-bezier(0.4, 0.0, 0.2, 1);
        font-size: 0.75em;
        text-transform: capitalize;
        min-height: 44px;
        min-width: 44px;
      }

      .mode-button:hover {
        background: var(--secondary-background-color);
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }

      .mode-button.active {
        background: var(--mode-color, var(--primary-color));
        color: white;
        border-color: var(--mode-color, var(--primary-color));
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }

      .mode-button:active {
        transform: translateY(0) scale(0.95);
      }

      .mode-button ha-icon {
        --mdc-icon-size: 24px;
      }

      .preset-selector {
        padding: 12px 16px;
        border-top: 1px solid var(--divider-color);
      }

      .preset-label {
        color: var(--secondary-text-color);
        font-size: 0.9em;
        margin-bottom: 8px;
        display: block;
      }

      .preset-buttons {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .preset-button {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        padding: 8px 12px;
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        background: var(--card-background-color);
        cursor: pointer;
        transition: all 150ms cubic-bezier(0.4, 0.0, 0.2, 1);
        font-size: 0.7em;
        text-transform: capitalize;
        min-height: 44px;
        min-width: 44px;
      }

      .preset-button:hover {
        background: var(--secondary-background-color);
      }

      .preset-button.active {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
      }

      .preset-button ha-icon {
        --mdc-icon-size: 18px;
      }

      .humidity-display {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 12px 16px;
        border-top: 1px solid var(--divider-color);
        color: var(--secondary-text-color);
        font-size: 0.9em;
      }

      .humidity-display ha-icon {
        --mdc-icon-size: 18px;
      }

      ha-icon-button {
        --mdc-icon-button-size: 48px;
        --mdc-icon-size: 24px;
        min-height: 44px;
        min-width: 44px;
      }

      /* Temperature dial styles */
      .temp-dial-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
      }

      .temp-dial {
        position: relative;
        width: 200px;
        height: 200px;
      }

      .dial-svg {
        width: 100%;
        height: 100%;
      }

      .dial-bg {
        fill: none;
        stroke: var(--divider-color);
        stroke-width: 8;
      }

      .dial-current {
        fill: none;
        stroke: var(--primary-color);
        stroke-width: 8;
        stroke-linecap: round;
        transition: stroke-dasharray 350ms cubic-bezier(0.0, 0.0, 0.2, 1);
      }

      .dial-target {
        fill: none;
        stroke: var(--secondary-text-color);
        stroke-width: 4;
        stroke-linecap: round;
      }

      .dial-center {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
      }

      .current-temp-dial {
        display: flex;
        align-items: baseline;
        justify-content: center;
        gap: 4px;
      }

      .temp-value-dial {
        font-size: 2.5em;
        font-weight: 300;
        color: var(--primary-color);
        line-height: 1;
      }

      .temp-unit-dial {
        font-size: 1.2em;
        color: var(--secondary-text-color);
      }

      .target-temp-dial {
        margin-top: 8px;
        color: var(--secondary-text-color);
        font-size: 0.8em;
      }

      .temp-dial-unavailable {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 200px;
        color: var(--secondary-text-color);
        font-size: 1.1em;
      }

      .trend-indicator {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--secondary-text-color);
        font-size: 0.85em;
      }

      .trend-icon {
        --mdc-icon-size: 16px;
        color: var(--success-color, #4caf50);
      }

      /* Mobile optimizations */
      @media (max-width: 768px) {
        .temp-dial {
          width: 160px;
          height: 160px;
        }

        .temp-value-dial {
          font-size: 2em;
        }

        .temp-unit-dial {
          font-size: 1em;
        }

        .mode-selector {
          grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
        }

        .preset-buttons {
          justify-content: center;
        }
      }

      /* Accessibility */
      @media (prefers-reduced-motion: reduce) {
        .mode-button:hover {
          transform: none;
        }

        .mode-button:active {
          transform: scale(0.98);
        }

        .dial-current {
          transition: none;
        }
      }
    `;
}