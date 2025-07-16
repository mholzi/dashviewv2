/**
 * Panel wrapper for Home Assistant integration.
 * This file creates the panel class that Home Assistant expects.
 */

import './dashboard/dashview-dashboard';
import { LogLevel, logger } from './utils/logger';

// Set up logger based on environment
if (process.env.NODE_ENV === 'development') {
  logger.setLevel(LogLevel.DEBUG);
}

// Export version for debugging
export const DASHVIEW_VERSION = '0.2.5';

/**
 * Home Assistant Panel class for Dashview V2.
 * This is the main entry point that Home Assistant will instantiate.
 */
export class DashviewV2Panel {
  private element: HTMLElement | null = null;
  private dashboard: any = null;
  
  constructor(
    private hass: any,
    private narrow: boolean,
    private route: any,
    private panel: any
  ) {
    logger.info(`Dashview V2 Panel v${DASHVIEW_VERSION} initializing`);
  }

  /**
   * Called by Home Assistant to render the panel.
   * Returns the DOM element to be displayed.
   */
  public render(): HTMLElement {
    if (!this.element) {
      this.createElement();
    }
    
    // Update hass object if it changed
    if (this.dashboard && this.hass) {
      this.dashboard.hass = this.hass;
    }
    
    return this.element!;
  }

  /**
   * Create the panel DOM element with dashview-dashboard.
   */
  private createElement(): void {
    // Create container
    this.element = document.createElement('div');
    this.element.style.cssText = `
      height: 100vh;
      width: 100%;
      display: flex;
      flex-direction: column;
      background: var(--primary-background-color);
    `;

    // Create dashboard element
    this.dashboard = document.createElement('dashview-dashboard');
    this.dashboard.hass = this.hass;
    this.dashboard.narrow = this.narrow;
    this.dashboard.route = this.route;
    this.dashboard.panel = this.panel;

    // Style the dashboard to fill the container
    this.dashboard.style.cssText = `
      flex: 1;
      width: 100%;
      height: 100%;
    `;

    // Add dashboard to container
    this.element.appendChild(this.dashboard);

    logger.info('Panel element created with dashview-dashboard');
  }

  /**
   * Called by Home Assistant when the panel is updated.
   */
  public update(hass: any, narrow: boolean, route: any): void {
    this.hass = hass;
    this.narrow = narrow;
    this.route = route;

    if (this.dashboard) {
      this.dashboard.hass = hass;
      this.dashboard.narrow = narrow;
      this.dashboard.route = route;
    }
  }

  /**
   * Called by Home Assistant when the panel is destroyed.
   */
  public destroy(): void {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
    this.dashboard = null;
    logger.info('Panel destroyed');
  }
}

// Verify dashboard element is registered
const dashboardElement = customElements.get('dashview-dashboard');
if (dashboardElement) {
  logger.info('Dashview V2 dashboard element registered successfully');
} else {
  logger.error('Failed to register dashview-dashboard element');
}

// Set up global error handler for debugging
window.addEventListener('error', (event) => {
  logger.error('Global error:', event.error);
});

// Set up unhandled rejection handler
window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection:', event.reason);
});

// Log initialization
logger.info(`Dashview V2 Panel v${DASHVIEW_VERSION} initialized`);