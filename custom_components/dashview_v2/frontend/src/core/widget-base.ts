/**
 * Base class for all Dashview widgets.
 * Provides lifecycle management, state handling, and visibility tracking.
 */

import { PropertyValues, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { DashviewBaseElement } from './base-element';
import { StateDiff, StateManager } from './state-manager';
import { SubscriptionManager } from './subscription-manager';
import { HapticFeedback } from '../utils/gestures';
import { ANIMATION_DURATION, EASING } from '../styles/animations';
import type { HomeAssistant } from '../types';

export interface WidgetConfig {
  type: 'room' | 'device-group' | 'climate' | 'quick-controls';
  entities: string[];
  title?: string;
  layout?: {
    gridColumn?: string;
    gridRow?: string;
  };
}

export abstract class DashviewWidget extends DashviewBaseElement {
  @property({ type: Object }) widgetConfig!: WidgetConfig;
  @state() protected entityStates: Map<string, any> = new Map();
  @state() protected isVisible = false;
  @state() protected isLoading = true;
  @state() protected error: string | null = null;

  private stateManager?: StateManager;
  private subscriptionManager?: SubscriptionManager;
  private intersectionObserver?: IntersectionObserver;
  private stateUnsubscribers: (() => void)[] = [];
  private keyboardHandlers: Map<string, (event: KeyboardEvent) => void> = new Map();
  private animationFrameId?: number;

  /**
   * Get the list of entity IDs this widget wants to subscribe to.
   * Can be overridden by subclasses for dynamic subscriptions.
   */
  protected subscribedEntities(): string[] {
    return this.widgetConfig?.entities || [];
  }

  /**
   * Called when widget configuration is set.
   * Subclasses should override to validate their specific config.
   */
  setConfig(config: WidgetConfig): void {
    if (!config) {
      throw new Error('Invalid configuration');
    }
    
    const errors = this.validateConfig(config);
    if (errors.length > 0) {
      throw new Error(`Configuration errors: ${errors.join(', ')}`);
    }

    this.widgetConfig = config;
  }

  /**
   * Validate widget configuration.
   * Returns array of error messages, empty if valid.
   */
  protected validateConfig(config: WidgetConfig): string[] {
    const errors: string[] = [];

    if (!config.type) {
      errors.push('Widget type is required');
    }

    if (!config.entities || !Array.isArray(config.entities)) {
      errors.push('Entities must be an array');
    }

    return errors;
  }

  /**
   * Get default configuration for this widget type.
   * Subclasses should override to provide sensible defaults.
   */
  protected abstract getDefaultConfig(): Partial<WidgetConfig>;

  /**
   * Called when entity state changes.
   * Subclasses can override to handle state changes.
   */
  protected onStateChanged(
    entityId: string,
    newState: any,
    oldState: any
  ): void {
    // Default implementation updates the local state map
    if (newState) {
      this.entityStates.set(entityId, newState);
    } else {
      this.entityStates.delete(entityId);
    }
  }

  /**
   * Lifecycle: Called when element is added to DOM.
   */
  connectedCallback(): void {
    super.connectedCallback();
    this.setupVisibilityObserver();
    this.setupKeyboardHandlers();
  }

  /**
   * Lifecycle: Called after first update.
   */
  protected firstUpdated(changedProps: PropertyValues): void {
    super.firstUpdated(changedProps);
    this.initializeWidget();
  }

  /**
   * Lifecycle: Called when element is removed from DOM.
   */
  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.cleanup();
  }

  /**
   * Initialize the widget.
   */
  private async initializeWidget(): Promise<void> {
    try {
      this.isLoading = true;
      this.error = null;

      // Get managers from dashboard context
      this.stateManager = this.getStateManager();
      this.subscriptionManager = this.getSubscriptionManager();

      if (!this.stateManager || !this.subscriptionManager) {
        throw new Error('State or subscription manager not available');
      }

      // Load initial entity states
      await this.loadInitialStates();

      // Subscribe to state changes
      this.subscribeToStateChanges();

      this.isLoading = false;
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Unknown error';
      this.isLoading = false;
      this.handleError(error as Error, 'Widget initialization');
    }
  }

  /**
   * Get state manager from dashboard context.
   * This should be provided by the parent dashboard.
   */
  private getStateManager(): StateManager | undefined {
    // Try to get from parent dashboard element
    const dashboard = this.closest('dashview-dashboard');
    return (dashboard as any)?.stateManager;
  }

  /**
   * Get subscription manager from dashboard context.
   */
  private getSubscriptionManager(): SubscriptionManager | undefined {
    const dashboard = this.closest('dashview-dashboard');
    return (dashboard as any)?.subscriptionManager;
  }

  /**
   * Load initial states for all entities.
   */
  private async loadInitialStates(): Promise<void> {
    const entities = this.subscribedEntities();
    
    for (const entityId of entities) {
      const state = this.hass.states[entityId];
      if (state) {
        this.entityStates.set(entityId, state);
      }
    }
  }

  /**
   * Subscribe to state changes for our entities.
   */
  private subscribeToStateChanges(): void {
    if (!this.stateManager) return;

    const entities = this.subscribedEntities();
    
    for (const entityId of entities) {
      const unsubscribe = this.stateManager.subscribeToEntity(
        entityId,
        (diff: StateDiff) => {
          this.onStateChanged(
            diff.entityId,
            diff.newState,
            diff.oldState
          );
        }
      );
      this.stateUnsubscribers.push(unsubscribe);
    }
  }

  /**
   * Setup intersection observer for visibility tracking.
   */
  private setupVisibilityObserver(): void {
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target === this) {
            this.handleVisibilityChange(entry.isIntersecting);
          }
        }
      },
      {
        root: null,
        rootMargin: '50px',  // Start loading slightly before visible
        threshold: 0.01,
      }
    );

    this.intersectionObserver.observe(this);
  }

  /**
   * Handle visibility changes.
   */
  private handleVisibilityChange(isVisible: boolean): void {
    if (this.isVisible === isVisible) return;

    this.isVisible = isVisible;

    if (isVisible) {
      this.onBecameVisible();
    } else {
      this.onBecameHidden();
    }

    // Update subscriptions based on visibility
    this.updateSubscriptions();
  }

  /**
   * Called when widget becomes visible.
   * Subclasses can override for custom behavior.
   */
  protected onBecameVisible(): void {
    // Default: no action
  }

  /**
   * Called when widget becomes hidden.
   * Subclasses can override for custom behavior.
   */
  protected onBecameHidden(): void {
    // Default: no action
  }

  /**
   * Update subscriptions based on current visibility.
   */
  private updateSubscriptions(): void {
    if (!this.subscriptionManager) return;

    const entities = this.subscribedEntities();
    
    if (this.isVisible) {
      // Widget is visible, ensure we're subscribed
      const visibleEntities = this.subscriptionManager.getVisibleEntities();
      const allVisible = new Set([...visibleEntities, ...entities]);
      this.subscriptionManager.updateVisibleEntities(Array.from(allVisible));
    } else {
      // Widget is hidden, we could unsubscribe
      // But this is handled globally by the dashboard
    }
  }

  /**
   * Clean up resources.
   */
  private cleanup(): void {
    // Unsubscribe from state changes
    for (const unsubscribe of this.stateUnsubscribers) {
      unsubscribe();
    }
    this.stateUnsubscribers = [];

    // Clean up intersection observer
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = undefined;
    }

    // Clean up keyboard handlers
    this.removeKeyboardHandlers();

    // Cancel any pending animation frames
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    // Clear state
    this.entityStates.clear();
  }

  /**
   * Helper to call Home Assistant service.
   */
  protected async callService(
    domain: string,
    service: string,
    data?: any
  ): Promise<void> {
    try {
      await this.hass.callService(domain, service, data);
    } catch (error) {
      this.handleError(error as Error, `Service call ${domain}.${service}`);
      throw error;
    }
  }

  /**
   * Helper to toggle an entity.
   */
  protected async toggleEntity(entityId: string): Promise<void> {
    const domain = entityId.split('.')[0];
    await this.callService(domain, 'toggle', { entity_id: entityId });
  }

  /**
   * Helper to turn on an entity.
   */
  protected async turnOn(entityId: string, data?: any): Promise<void> {
    const domain = entityId.split('.')[0];
    await this.callService(domain, 'turn_on', { entity_id: entityId, ...data });
  }

  /**
   * Helper to turn off an entity.
   */
  protected async turnOff(entityId: string): Promise<void> {
    const domain = entityId.split('.')[0];
    await this.callService(domain, 'turn_off', { entity_id: entityId });
  }

  /**
   * Trigger haptic feedback with the specified intensity.
   */
  protected triggerHapticFeedback(intensity: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'selection'): void {
    HapticFeedback[intensity]();
  }

  /**
   * Animate an element with the specified animation.
   */
  protected animateElement(element: HTMLElement, animation: string, duration?: string): Promise<void> {
    return new Promise((resolve) => {
      const animationDuration = duration || ANIMATION_DURATION.normal;
      
      element.style.animation = `${animation} ${animationDuration} ${EASING.standard}`;
      
      const handleAnimationEnd = () => {
        element.style.animation = '';
        element.removeEventListener('animationend', handleAnimationEnd);
        resolve();
      };
      
      element.addEventListener('animationend', handleAnimationEnd);
    });
  }

  /**
   * Focus management helper.
   */
  protected focusElement(element: HTMLElement, options?: FocusOptions): void {
    element.focus(options);
  }

  /**
   * Set up keyboard event handlers for accessibility.
   */
  private setupKeyboardHandlers(): void {
    // Default keyboard handlers
    this.addKeyboardHandler('Escape', this.handleEscapeKey.bind(this));
    this.addKeyboardHandler('Tab', this.handleTabKey.bind(this));
    
    this.addEventListener('keydown', this.handleKeydown.bind(this));
  }

  /**
   * Remove keyboard event handlers.
   */
  private removeKeyboardHandlers(): void {
    this.keyboardHandlers.clear();
    this.removeEventListener('keydown', this.handleKeydown.bind(this));
  }

  /**
   * Add a keyboard event handler.
   */
  protected addKeyboardHandler(key: string, handler: (event: KeyboardEvent) => void): void {
    this.keyboardHandlers.set(key, handler);
  }

  /**
   * Handle keyboard events.
   */
  private handleKeydown(event: KeyboardEvent): void {
    const handler = this.keyboardHandlers.get(event.key);
    if (handler) {
      handler(event);
    }
  }

  /**
   * Handle Escape key (default: blur active element).
   */
  protected handleEscapeKey(_event: KeyboardEvent): void {
    const activeElement = this.shadowRoot?.activeElement as HTMLElement;
    if (activeElement) {
      activeElement.blur();
    }
  }

  /**
   * Handle Tab key for focus management.
   */
  protected handleTabKey(_event: KeyboardEvent): void {
    // Default behavior - could be overridden by subclasses
  }

  /**
   * Get all focusable elements within the widget.
   */
  protected getFocusableElements(): HTMLElement[] {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      'ha-icon-button:not([disabled])',
      'mwc-button:not([disabled])',
      'ha-switch:not([disabled])'
    ].join(', ');

    const elements = this.shadowRoot?.querySelectorAll(focusableSelectors) || [];
    return Array.from(elements) as HTMLElement[];
  }

  /**
   * Base styles for all widgets.
   */
  static styles = css`
    :host {
      display: block;
      position: relative;
    }

    .widget-container {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .widget-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--primary-text-color);
    }

    .widget-error {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--error-color, #f44336);
      padding: 16px;
      text-align: center;
    }
  `;
}