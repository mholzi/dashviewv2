import './dashboard/dashview-dashboard';
import { LogLevel, logger } from './utils/logger';

// Set up logger based on environment
if (process.env.NODE_ENV === 'development') {
  logger.setLevel(LogLevel.DEBUG);
}

// Verify dashboard element is registered
const dashboardElement = customElements.get('dashview-dashboard');
if (dashboardElement) {
  logger.info('Dashview V2 dashboard registered successfully');
} else {
  logger.error('Failed to register dashview-dashboard element');
}

// Export version for debugging
export const DASHVIEW_VERSION = '0.2.0';

// Log initialization
logger.info(`Dashview V2 v${DASHVIEW_VERSION} initialized`);

// Set up global error handler for debugging
window.addEventListener('error', (event) => {
  logger.error('Global error:', event.error);
});

// Set up unhandled rejection handler
window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection:', event.reason);
});