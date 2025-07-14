// Test for DashviewDashboard component

// Mock all Lit dependencies
jest.mock('lit', () => ({
  LitElement: class {
    hass: any;
    config: any;
    shadowRoot = { querySelector: jest.fn(), textContent: '' };
    requestUpdate() {}
    updateComplete = Promise.resolve();
  },
  html: (strings: TemplateStringsArray, ..._values: any[]) => strings.join(''),
  css: (strings: TemplateStringsArray) => strings.join(''),
  PropertyValues: Map,
}));

jest.mock('lit/decorators.js', () => ({
  property: () => () => {},
  customElement: (name: string) => (target: any) => {
    customElements.define(name, target);
    return target;
  },
  state: () => () => {},
}));

// Mock WebSocket connection
jest.mock('@/core/websocket-connection');

// Mock other dependencies
jest.mock('@/core/base-element', () => ({
  DashviewBaseElement: class {
    hass: any;
    config: any;
  },
}));

jest.mock('@/styles/theme', () => ({
  dashviewTheme: '',
  dashviewStyles: '',
}));

jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  },
}));

describe('DashviewDashboard', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
  });

  it('should create dashboard element', () => {
    // Import after mocks are set up
    const { DashviewDashboard } = require('@/dashboard/dashview-dashboard');
    const element = new DashviewDashboard();
    expect(element).toBeDefined();
  });

  it('should have correct custom element name', () => {
    const dashboardElement = customElements.get('dashview-dashboard');
    expect(dashboardElement).toBeDefined();
  });
});