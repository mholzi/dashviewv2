/**
 * Subscription manager for smart entity subscriptions.
 * Only subscribes to visible entities to optimize performance.
 */

import { WebSocketConnection } from './websocket-connection';
import { StateManager } from './state-manager';
import { Logger } from '../utils/logger';
import type { HomeAssistant } from '../types';

const logger = new Logger('SubscriptionManager');

export interface SubscriptionConfig {
  debounceDelay?: number;  // Milliseconds to debounce visibility changes
  maxSubscriptions?: number;  // Maximum concurrent subscriptions
}

export interface SubscriptionResult {
  subscribed: string[];
  unsubscribed: string[];
  failed: string[];
}

export class SubscriptionManager {
  private websocket: WebSocketConnection;
  private stateManager: StateManager;
  private visibleEntities: Set<string> = new Set();
  private subscribedEntities: Set<string> = new Set();
  private debounceTimer: number | null = null;
  private config: Required<SubscriptionConfig>;
  private unsubscribeHandler: (() => void) | null = null;

  constructor(
    websocket: WebSocketConnection,
    stateManager: StateManager,
    config: SubscriptionConfig = {}
  ) {
    this.websocket = websocket;
    this.stateManager = stateManager;
    this.config = {
      debounceDelay: config.debounceDelay ?? 300,
      maxSubscriptions: config.maxSubscriptions ?? 500,
    };
  }

  /**
   * Update the list of visible entities.
   * This will trigger subscription updates after debouncing.
   */
  updateVisibleEntities(entities: string[]): void {
    const newVisible = new Set(entities);
    
    // Check if there's actually a change
    const hasChanges = entities.length !== this.visibleEntities.size ||
      entities.some(id => !this.visibleEntities.has(id));
    
    if (!hasChanges) {
      return;
    }

    // Update visible set
    this.visibleEntities = newVisible;

    // Debounce the sync operation
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = window.setTimeout(() => {
      this.syncSubscriptions();
      this.debounceTimer = null;
    }, this.config.debounceDelay);
  }

  /**
   * Sync subscriptions with the backend.
   * Subscribes to newly visible entities and unsubscribes from hidden ones.
   */
  async syncSubscriptions(): Promise<void> {
    if (!this.websocket.isConnected()) {
      logger.warn('WebSocket not connected, skipping subscription sync');
      return;
    }

    try {
      // Limit subscriptions if needed
      const targetEntities = Array.from(this.visibleEntities).slice(0, this.config.maxSubscriptions);
      
      // Call backend to update subscriptions
      const result = await this.callUpdateSubscriptions(targetEntities);
      
      // Update local tracking
      this.subscribedEntities = new Set([
        ...this.subscribedEntities,
        ...result.subscribed
      ]);
      
      for (const entityId of result.unsubscribed) {
        this.subscribedEntities.delete(entityId);
      }

      logger.info(
        `Subscription sync complete: ${result.subscribed.length} added, ` +
        `${result.unsubscribed.length} removed, ${this.subscribedEntities.size} total`
      );

      // Log any failures
      if (result.failed.length > 0) {
        logger.warn(`Failed to subscribe to ${result.failed.length} entities:`, result.failed);
      }
    } catch (error) {
      logger.error('Failed to sync subscriptions:', error);
    }
  }

  /**
   * Call the backend WebSocket command to update subscriptions.
   */
  private async callUpdateSubscriptions(entities: string[]): Promise<SubscriptionResult> {
    const hass = (this.websocket as any).hass as HomeAssistant;
    
    const response = await hass.callWS<SubscriptionResult>({
      type: 'dashview_v2/update_subscriptions',
      entities: entities,
    });

    return response;
  }

  /**
   * Subscribe to specific entities immediately.
   */
  async subscribeToEntities(entities: string[]): Promise<SubscriptionResult> {
    const hass = (this.websocket as any).hass as HomeAssistant;
    
    const response = await hass.callWS<{
      success: boolean;
      subscribed: string[];
      failed: string[];
    }>({
      type: 'dashview_v2/subscribe_visible_entities',
      entities: entities,
    });

    // Update local tracking
    for (const entityId of response.subscribed) {
      this.subscribedEntities.add(entityId);
    }

    return {
      subscribed: response.subscribed,
      unsubscribed: [],
      failed: response.failed || [],
    };
  }

  /**
   * Unsubscribe from specific entities immediately.
   */
  async unsubscribeFromEntities(entities: string[]): Promise<SubscriptionResult> {
    const hass = (this.websocket as any).hass as HomeAssistant;
    
    const response = await hass.callWS<{
      success: boolean;
      unsubscribed: string[];
      failed: string[];
    }>({
      type: 'dashview_v2/unsubscribe_hidden_entities',
      entities: entities,
    });

    // Update local tracking
    for (const entityId of response.unsubscribed) {
      this.subscribedEntities.delete(entityId);
    }

    return {
      subscribed: [],
      unsubscribed: response.unsubscribed,
      failed: response.failed || [],
    };
  }

  /**
   * Start listening for state changes.
   * This sets up the WebSocket event listener for state updates.
   */
  async startListening(): Promise<void> {
    if (this.unsubscribeHandler) {
      logger.warn('Already listening for state changes');
      return;
    }

    try {
      // Set up WebSocket event listener
      this.unsubscribeHandler = await this.websocket.subscribeToStateChanges(
        (event) => {
          if (event.event_type === 'state_changed' && event.data) {
            const { entity_id, new_state } = event.data;
            
            // Only process if we're subscribed to this entity
            if (this.subscribedEntities.has(entity_id) && new_state) {
              this.stateManager.updateState(entity_id, new_state);
            }
          }
        }
      );

      logger.info('Started listening for state changes');
    } catch (error) {
      logger.error('Failed to start listening:', error);
      throw error;
    }
  }

  /**
   * Stop listening for state changes.
   */
  stopListening(): void {
    if (this.unsubscribeHandler) {
      this.unsubscribeHandler();
      this.unsubscribeHandler = null;
      logger.info('Stopped listening for state changes');
    }
  }

  /**
   * Get the current list of subscribed entities.
   */
  getSubscribedEntities(): string[] {
    return Array.from(this.subscribedEntities);
  }

  /**
   * Get the current list of visible entities.
   */
  getVisibleEntities(): string[] {
    return Array.from(this.visibleEntities);
  }

  /**
   * Check if an entity is currently subscribed.
   */
  isSubscribed(entityId: string): boolean {
    return this.subscribedEntities.has(entityId);
  }

  /**
   * Get subscription statistics.
   */
  getStats(): {
    visibleCount: number;
    subscribedCount: number;
    maxSubscriptions: number;
  } {
    return {
      visibleCount: this.visibleEntities.size,
      subscribedCount: this.subscribedEntities.size,
      maxSubscriptions: this.config.maxSubscriptions,
    };
  }

  /**
   * Clear all subscriptions and stop listening.
   */
  async clear(): Promise<void> {
    // Stop listening
    this.stopListening();

    // Clear debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    // Unsubscribe from all entities
    if (this.subscribedEntities.size > 0) {
      await this.unsubscribeFromEntities(Array.from(this.subscribedEntities));
    }

    // Clear sets
    this.visibleEntities.clear();
    this.subscribedEntities.clear();
    
    logger.info('Cleared all subscriptions');
  }
}