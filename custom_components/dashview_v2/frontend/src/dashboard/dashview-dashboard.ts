import { PropertyValues, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { DashviewBaseElement } from '@/core/base-element';
import { WebSocketConnection } from '@/core/websocket-connection';
import { dashviewStyles, dashviewTheme } from '@/styles/theme';
import { logger } from '@/utils/logger';
import type { HomeInfo } from '@/types';

@customElement('dashview-dashboard')
export class DashviewDashboard extends DashviewBaseElement {
  @state() private loading = true;
  @state() private error: string | null = null;
  @state() private homeInfo: HomeInfo | null = null;
  @state() private wsConnection: WebSocketConnection | null = null;

  static styles = [
    dashviewTheme,
    dashviewStyles,
    css`
      :host {
        display: block;
        height: 100%;
        width: 100%;
      }

      .welcome-header {
        text-align: center;
        margin-bottom: var(--dashview-spacing-xl);
      }

      .welcome-title {
        font-size: 2.5rem;
        font-weight: 300;
        color: var(--dashview-primary-text-color);
        margin: 0 0 var(--dashview-spacing-sm);
      }

      .welcome-subtitle {
        font-size: 1.2rem;
        color: var(--dashview-secondary-text-color);
        margin: 0;
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--dashview-spacing-md);
        margin-top: var(--dashview-spacing-xl);
      }

      .info-card {
        background: var(--dashview-card-background);
        border-radius: var(--dashview-border-radius);
        padding: var(--dashview-spacing-lg);
        text-align: center;
        box-shadow: var(--dashview-box-shadow);
        transition: transform 0.2s ease;
      }

      .info-card:hover {
        transform: translateY(-2px);
      }

      .info-value {
        font-size: 3rem;
        font-weight: 300;
        color: var(--primary-color);
        margin: 0;
      }

      .info-label {
        font-size: 1rem;
        color: var(--dashview-secondary-text-color);
        margin: var(--dashview-spacing-sm) 0 0;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .complexity-meter {
        width: 100%;
        height: 20px;
        background: var(--divider-color);
        border-radius: 10px;
        margin-top: var(--dashview-spacing-md);
        overflow: hidden;
      }

      .complexity-fill {
        height: 100%;
        background: linear-gradient(90deg, 
          var(--success-color) 0%, 
          var(--warning-color) 50%, 
          var(--error-color) 100%
        );
        transition: width 0.5s ease;
      }

      .areas-list {
        display: flex;
        flex-wrap: wrap;
        gap: var(--dashview-spacing-sm);
        margin-top: var(--dashview-spacing-md);
      }

      .area-tag {
        background: var(--primary-color);
        color: var(--text-primary-color, white);
        padding: var(--dashview-spacing-xs) var(--dashview-spacing-sm);
        border-radius: var(--dashview-border-radius);
        font-size: 0.9rem;
      }

      .loading-spinner {
        animation: spin 1s linear infinite;
        width: 48px;
        height: 48px;
        border: 3px solid var(--divider-color);
        border-top-color: var(--primary-color);
        border-radius: 50%;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `,
  ];

  protected async firstUpdated(changedProps: PropertyValues): Promise<void> {
    super.firstUpdated(changedProps);
    await this.initializeDashboard();
  }

  private async initializeDashboard(): Promise<void> {
    try {
      logger.info('Initializing Dashview dashboard');
      
      if (!this.hass) {
        throw new Error('Home Assistant connection not available');
      }

      this.wsConnection = new WebSocketConnection(this.hass);
      await this.loadHomeInfo();
      
      logger.info('Dashboard initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize dashboard:', error);
      this.error = error instanceof Error ? error.message : 'Failed to initialize dashboard';
      this.loading = false;
    }
  }

  private async loadHomeInfo(): Promise<void> {
    if (!this.wsConnection) return;

    try {
      this.loading = true;
      this.error = null;
      
      logger.debug('Loading home information');
      this.homeInfo = await this.wsConnection.getHomeInfo();
      
      logger.info('Home info loaded:', this.homeInfo);
      this.loading = false;
    } catch (error) {
      logger.error('Failed to load home info:', error);
      this.error = 'Failed to load home information';
      this.loading = false;
    }
  }

  protected render() {
    if (this.loading) {
      return html`
        <div class="dashview-container">
          <div class="dashview-loading">
            <div class="loading-spinner"></div>
          </div>
        </div>
      `;
    }

    if (this.error) {
      return html`
        <div class="dashview-container">
          <div class="dashview-error">
            <h2>Error</h2>
            <p>${this.error}</p>
            <button @click=${this.loadHomeInfo}>Retry</button>
          </div>
        </div>
      `;
    }

    return html`
      <div class="dashview-container">
        <div class="dashview-content">
          <div class="welcome-header">
            <h1 class="welcome-title">Welcome to Dashview V2</h1>
            <p class="welcome-subtitle">
              Your intelligent home dashboard for ${this.homeInfo?.entityCount || 0} entities
            </p>
          </div>

          ${this.homeInfo ? this.renderHomeInfo() : this.renderNoData()}
        </div>
      </div>
    `;
  }

  private renderHomeInfo() {
    if (!this.homeInfo) return null;

    const complexityPercentage = Math.min(100, this.homeInfo.complexityScore * 10);

    return html`
      <div class="info-grid">
        <div class="info-card">
          <p class="info-value">${this.homeInfo.roomCount}</p>
          <p class="info-label">Rooms</p>
        </div>

        <div class="info-card">
          <p class="info-value">${this.homeInfo.entityCount}</p>
          <p class="info-label">Entities</p>
        </div>

        <div class="info-card">
          <p class="info-value">${this.homeInfo.areas.length}</p>
          <p class="info-label">Areas</p>
        </div>

        <div class="info-card">
          <p class="info-value">${this.homeInfo.complexityScore}/10</p>
          <p class="info-label">Complexity Score</p>
          <div class="complexity-meter">
            <div class="complexity-fill" style="width: ${complexityPercentage}%"></div>
          </div>
        </div>
      </div>

      ${this.homeInfo.areas.length > 0 ? html`
        <div class="dashview-card">
          <h3>Detected Areas</h3>
          <div class="areas-list">
            ${this.homeInfo.areas.map(area => html`
              <span class="area-tag">${area}</span>
            `)}
          </div>
        </div>
      ` : ''}
    `;
  }

  private renderNoData() {
    return html`
      <div class="dashview-card">
        <p>No home information available. Make sure your Home Assistant is configured with areas and entities.</p>
      </div>
    `;
  }
}