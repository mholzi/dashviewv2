/**
 * Home Assistant Panel Entry Point
 * This file creates the proper panel structure that Home Assistant expects
 */

import './dashboard/dashview-dashboard';
import { LogLevel, logger } from './utils/logger';

// Set up logger based on environment
if (process.env.NODE_ENV === 'development') {
  logger.setLevel(LogLevel.DEBUG);
}

// Export version for debugging
export const DASHVIEW_VERSION = '0.2.6';

/**
 * Create Home Assistant panel function
 * This is the function that Home Assistant will call to create the panel
 */
function createDashviewPanel(hass: any, narrow: boolean, route: any, panel: any) {
  logger.info(`Creating Dashview V2 Panel v${DASHVIEW_VERSION}`);
  
  // Create container element
  const container = document.createElement('div');
  container.style.cssText = `
    height: 100vh;
    width: 100%;
    display: flex;
    flex-direction: column;
    background: var(--primary-background-color);
  `;

  // Create dashboard element
  const dashboard = document.createElement('dashview-dashboard');
  dashboard.hass = hass;
  dashboard.narrow = narrow;
  dashboard.route = route;
  dashboard.panel = panel;

  // Style the dashboard to fill the container
  dashboard.style.cssText = `
    flex: 1;
    width: 100%;
    height: 100%;
  `;

  // Add dashboard to container
  container.appendChild(dashboard);

  // Return object with required methods
  return {
    render: () => container,
    
    update: (newHass: any, newNarrow: boolean, newRoute: any) => {
      dashboard.hass = newHass;
      dashboard.narrow = newNarrow;
      dashboard.route = newRoute;
    },
    
    destroy: () => {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    }
  };
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
logger.info(`Dashview V2 Panel Entry v${DASHVIEW_VERSION} initialized`);

// Export the panel creation function as default
export default createDashviewPanel;