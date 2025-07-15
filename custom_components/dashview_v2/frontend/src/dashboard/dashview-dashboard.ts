import { PropertyValues, css, html, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { DashviewBaseElement } from '@/core/base-element';
import { WebSocketConnection } from '@/core/websocket-connection';
import { StateManager } from '@/core/state-manager';
import { SubscriptionManager } from '@/core/subscription-manager';
import { LayoutEngine, AreaInfo } from '@/layouts/layout-engine';
import { BaseLayout, Breakpoint } from '@/layouts/base-layout';
import { WidgetConfig } from '@/core/widget-base';
import { dashviewStyles, dashviewTheme } from '@/styles/theme';
import { logger } from '@/utils/logger';
import type { HomeInfo } from '@/types';

// Import widgets
import '../widgets/room-widget';
import '../widgets/device-group-widget';
import '../widgets/climate-widget';
import '../widgets/quick-controls-widget';

@customElement('dashview-dashboard')
export class DashviewDashboard extends DashviewBaseElement {
  // Public getters for child components
  get stateManager(): StateManager | null {
    return this._stateManager;
  }

  get subscriptionManager(): SubscriptionManager | null {
    return this._subscriptionManager;
  }

  // Private state
  private _stateManager: StateManager | null = null;
  private _subscriptionManager: SubscriptionManager | null = null;
  @state() private loading = true;
  @state() private error: string | null = null;
  @state() private homeInfo: HomeInfo | null = null;
  @state() private wsConnection: WebSocketConnection | null = null;
  @state() private layoutEngine: LayoutEngine | null = null;
  @state() private currentLayout: BaseLayout | null = null;
  @state() private widgets: WidgetConfig[] = [];
  @state() private currentBreakpoint: Breakpoint = 'desktop';
  @state() private areas: Map<string, AreaInfo> = new Map();

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

      /* Dashboard grid layout */
      .dashboard-grid {
        display: grid;
        height: 100%;
        width: 100%;
        overflow: auto;
      }

      .widget-container {
        position: relative;
        min-height: 200px;
      }

      /* Loading state for dashboard mode */
      .dashboard-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        flex-direction: column;
        gap: var(--dashview-spacing-md);
      }

      .dashboard-loading p {
        color: var(--dashview-secondary-text-color);
      }
    `,
  ];

  protected async firstUpdated(changedProps: PropertyValues): Promise<void> {
    super.firstUpdated(changedProps);
    await this.initializeDashboard();
    this.setupResizeObserver();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.cleanup();
  }

  private async initializeDashboard(): Promise<void> {
    try {
      logger.info('Initializing Dashview dashboard');
      
      if (!this.hass) {
        throw new Error('Home Assistant connection not available');
      }

      // Initialize core services
      this.wsConnection = new WebSocketConnection(this.hass);
      this._stateManager = new StateManager();
      this._subscriptionManager = new SubscriptionManager(this.wsConnection, this._stateManager);
      this.layoutEngine = new LayoutEngine();

      // Load home information
      await this.loadHomeInfo();
      
      // Analyze home and set up dashboard
      await this.analyzeHome();
      this.selectOptimalLayout();
      await this.initializeWidgets();

      // Start state management
      this._stateManager.initializeFromHass(this.hass);
      await this._subscriptionManager.startListening();
      
      logger.info('Dashboard initialized successfully');
      this.loading = false;
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
            <p>Loading your dashboard...</p>
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
            <button @click=${() => this.initializeDashboard()}>Retry</button>
          </div>
        </div>
      `;
    }

    // If we have widgets, show the dashboard view
    if (this.widgets.length > 0) {
      return this.renderDashboard();
    }

    // Otherwise show the welcome/info view
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

  /**
   * Analyze home complexity and areas.
   */
  private async analyzeHome(): Promise<void> {
    if (!this.homeInfo || !this.wsConnection) return;

    try {
      // Get detailed area information
      const areaData = await this.callWebSocket<Record<string, any>>('get_area_entities', {});
      
      // Convert to AreaInfo format
      for (const [areaId, data] of Object.entries(areaData)) {
        this.areas.set(areaId, {
          areaId,
          name: data.name,
          entities: data.entities || [],
          entityCount: data.entity_count || 0,
          deviceCount: data.device_count || 0,
        });
      }
      
      logger.info(`Analyzed ${this.areas.size} areas`);
    } catch (error) {
      logger.error('Failed to analyze home:', error);
    }
  }

  /**
   * Select optimal layout based on complexity score and area count.
   */
  private selectOptimalLayout(): void {
    if (!this.homeInfo || !this.layoutEngine) return;

    const complexityScore = this.homeInfo.complexityScore;
    const areaCount = this.areas.size;
    
    this.currentLayout = this.layoutEngine.selectLayout(complexityScore, areaCount);
    
    // Update breakpoint
    const containerWidth = this.offsetWidth || window.innerWidth;
    this.currentBreakpoint = this.currentLayout.getBreakpoint(containerWidth);
  }

  /**
   * Initialize widgets based on areas and layout.
   */
  private async initializeWidgets(): Promise<void> {
    if (!this.layoutEngine || !this.currentLayout) return;

    // Organize widgets from areas
    const areaInfos = Array.from(this.areas.values());
    this.widgets = this.layoutEngine.organizeWidgets(areaInfos);
    
    // Handle overflow
    const { visible } = this.layoutEngine.handleOverflow(
      this.widgets,
      this.currentLayout,
      this.currentBreakpoint
    );
    
    this.widgets = visible;
    
    logger.info(`Initialized ${this.widgets.length} widgets`);
    
    // Update subscriptions for visible entities
    await this.updateVisibleSubscriptions();
  }

  /**
   * Update subscriptions based on visible widgets.
   */
  private async updateVisibleSubscriptions(): Promise<void> {
    if (!this._subscriptionManager) return;

    const visibleEntities = new Set<string>();
    
    for (const widget of this.widgets) {
      for (const entity of widget.entities) {
        visibleEntities.add(entity);
      }
    }
    
    this._subscriptionManager.updateVisibleEntities(Array.from(visibleEntities));
  }

  /**
   * Set up resize observer for responsive behavior.
   */
  private setupResizeObserver(): void {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === this) {
          this.handleResize(entry.contentRect.width);
        }
      }
    });
    
    resizeObserver.observe(this);
  }

  /**
   * Handle container resize.
   */
  private handleResize(width: number): void {
    if (!this.currentLayout) return;

    const breakpointChanged = this.currentLayout.updateContainerWidth(width);
    
    if (breakpointChanged) {
      this.currentBreakpoint = this.currentLayout.getBreakpoint();
      this.requestUpdate();
    }
  }

  /**
   * Render the dashboard grid with widgets.
   */
  private renderDashboard(): TemplateResult {
    if (!this.currentLayout || this.widgets.length === 0) {
      return html`
        <div class="dashboard-loading">
          <p>Setting up your dashboard...</p>
        </div>
      `;
    }

    const gridCSS = this.currentLayout.generateGridCSS(this.currentBreakpoint);
    const positions = this.layoutEngine!.calculatePositions(this.widgets, this.areas.size);

    return html`
      <div class="dashboard-grid" style="${gridCSS}">
        ${positions.map(pos => {
          const widget = this.widgets.find(w => 
            this.getWidgetId(w) === pos.widgetId
          );
          
          if (!widget) return '';
          
          return this.renderWidget(widget, pos);
        })}
      </div>
    `;
  }

  /**
   * Render a single widget.
   */
  private renderWidget(widget: WidgetConfig, position: any): TemplateResult {
    const style = `
      grid-area: ${position.gridArea};
      ${position.gridColumn ? `grid-column: ${position.gridColumn};` : ''}
      ${position.gridRow ? `grid-row: ${position.gridRow};` : ''}
    `;

    switch (widget.type) {
      case 'room':
        const area = Array.from(this.areas.values()).find(a => 
          a.entities.some(e => widget.entities.includes(e))
        );
        
        return html`
          <div class="widget-container" style="${style}">
            <dashview-room-widget
              .hass=${this.hass}
              .widgetConfig=${widget}
              .areaId=${area?.areaId}
              .areaName=${area?.name || widget.title}
            ></dashview-room-widget>
          </div>
        `;
      
      // TODO: Add other widget types when implemented
      default:
        return html`
          <div class="widget-container" style="${style}">
            <div class="dashview-card">
              <p>Widget type '${widget.type}' not implemented yet</p>
            </div>
          </div>
        `;
    }
  }

  /**
   * Generate widget ID.
   */
  private getWidgetId(widget: WidgetConfig): string {
    const firstEntity = widget.entities[0] || 'unknown';
    return `${widget.type}-${firstEntity.replace(/\./g, '_')}`;
  }

  /**
   * Clean up resources.
   */
  private cleanup(): void {
    if (this._subscriptionManager) {
      this._subscriptionManager.clear();
    }
    
    if (this._stateManager) {
      this._stateManager.clear();
    }
  }
}