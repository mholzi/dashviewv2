import { DashviewBaseElement } from '@/core/base-element';
import type { HomeAssistant } from '@/types';

// Mock Lit Element
jest.mock('lit', () => ({
  LitElement: class {
    hass: any;
    config: any;
    shouldUpdate(): boolean { return true; }
    connectedCallback() {}
    disconnectedCallback() {}
  },
  PropertyValues: Map,
}));

jest.mock('lit/decorators.js', () => ({
  property: () => () => {},
  customElement: (name: string) => (target: any) => {
    customElements.define(name, target);
    return target;
  },
}));

describe('DashviewBaseElement', () => {
  let mockHass: Partial<HomeAssistant>;

  beforeEach(() => {
    // Create mock hass object
    mockHass = {
      callWS: jest.fn(),
      states: {},
      user: {
        name: 'Test User',
        id: 'test-id',
        is_admin: true,
      },
    };
  });

  describe('callWebSocket', () => {
    it('should call hass.callWS with correct parameters', async () => {
      const element = new DashviewBaseElement();
      element.hass = mockHass as HomeAssistant;
      
      const testData = { param: 'value' };
      const expectedResult = { success: true };
      (mockHass.callWS as jest.Mock).mockResolvedValue(expectedResult);

      const result = await (element as any).callWebSocket('test_command', testData);

      expect(mockHass.callWS).toHaveBeenCalledWith({
        type: 'dashview_v2/test_command',
        ...testData,
      });
      expect(result).toBe(expectedResult);
    });

    it('should throw error when hass is not available', async () => {
      const element = new DashviewBaseElement();
      element.hass = null as any;

      await expect((element as any).callWebSocket('test_command')).rejects.toThrow(
        'Home Assistant connection not available'
      );
    });

    it('should log and rethrow errors from WebSocket calls', async () => {
      const element = new DashviewBaseElement();
      element.hass = mockHass as HomeAssistant;
      
      const testError = new Error('WebSocket error');
      (mockHass.callWS as jest.Mock).mockRejectedValue(testError);
      const errorSpy = jest.spyOn(console, 'error');

      await expect((element as any).callWebSocket('test_command')).rejects.toThrow(
        'WebSocket error'
      );
      expect(errorSpy).toHaveBeenCalledWith(
        'WebSocket call failed for test_command:',
        testError
      );
    });
  });

  describe('handleError', () => {
    it('should log errors with context', () => {
      const element = new DashviewBaseElement();
      const errorSpy = jest.spyOn(console, 'error');
      const testError = new Error('Test error');

      (element as any).handleError(testError, 'test-context');

      expect(errorSpy).toHaveBeenCalledWith(
        '[Dashview V2] Error in test-context:',
        testError
      );
    });
  });
});