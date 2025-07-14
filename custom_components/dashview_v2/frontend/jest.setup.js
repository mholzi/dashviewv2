// Clean up after each test to prevent memory leaks
afterEach(() => {
  // Clean up any DOM elements created during tests
  document.body.innerHTML = '';
  
  // Clear all mocks
  jest.clearAllMocks();
  
  // Reset all modules
  jest.resetModules();
});

// Mock console methods to avoid cluttering test output
global.console = {
  ...console,
  debug: jest.fn(),
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock customElements if not available
if (!global.customElements) {
  global.customElements = {
    define: jest.fn(),
    get: jest.fn(),
    whenDefined: jest.fn(),
  };
}

// Mock process.env
process.env.NODE_ENV = 'test';