/**
 * State management for Dashview V2 dashboard.
 * Handles efficient state updates with diffing and batching.
 */

import { HomeAssistant } from '../types';
import { Logger } from '../utils/logger';

const logger = new Logger('StateManager');

export interface StateUpdate {
  entityId: string;
  state: any;
  timestamp: number;
}

export interface StateDiff {
  type: 'added' | 'changed' | 'removed';
  entityId: string;
  oldState?: any;
  newState?: any;
  changedProps?: string[];
}

export interface StateManagerConfig {
  batchInterval?: number;  // Milliseconds to batch updates (default: 16ms for 60fps)
  maxBatchSize?: number;   // Maximum updates per batch (default: 100)
}

export class StateManager {
  private updateQueue: StateUpdate[] = [];
  private rafId: number | null = null;
  private lastState: Map<string, any> = new Map();
  private listeners: Map<string, Set<(diff: StateDiff) => void>> = new Map();
  private globalListeners: Set<(diffs: StateDiff[]) => void> = new Set();
  private config: Required<StateManagerConfig>;

  constructor(config: StateManagerConfig = {}) {
    this.config = {
      batchInterval: config.batchInterval ?? 16,  // 60fps
      maxBatchSize: config.maxBatchSize ?? 100,
    };
  }

  /**
   * Compute differences between old and new state.
   */
  computeStateDiff(entityId: string, newState: any): StateDiff | null {
    const oldState = this.lastState.get(entityId);
    
    if (!oldState) {
      return {
        type: 'added',
        entityId,
        newState,
      };
    }

    // Quick equality check
    if (oldState.state === newState.state && 
        JSON.stringify(oldState.attributes) === JSON.stringify(newState.attributes)) {
      return null;
    }

    // Find changed properties
    const changedProps = this.getChangedProps(oldState, newState);
    
    if (changedProps.length === 0) {
      return null;
    }

    return {
      type: 'changed',
      entityId,
      oldState,
      newState,
      changedProps,
    };
  }

  /**
   * Get list of changed properties between states.
   */
  private getChangedProps(oldState: any, newState: any): string[] {
    const changed: string[] = [];

    // Check main state
    if (oldState.state !== newState.state) {
      changed.push('state');
    }

    // Check attributes
    const oldAttrs = oldState.attributes || {};
    const newAttrs = newState.attributes || {};
    const allKeys = new Set([...Object.keys(oldAttrs), ...Object.keys(newAttrs)]);

    for (const key of allKeys) {
      if (JSON.stringify(oldAttrs[key]) !== JSON.stringify(newAttrs[key])) {
        changed.push(`attributes.${key}`);
      }
    }

    // Check last_changed and last_updated
    if (oldState.last_changed !== newState.last_changed) {
      changed.push('last_changed');
    }
    if (oldState.last_updated !== newState.last_updated) {
      changed.push('last_updated');
    }

    return changed;
  }

  /**
   * Batch state updates for efficient rendering.
   */
  batchUpdate(updates: StateUpdate[]): void {
    this.updateQueue.push(...updates);

    // If we have too many updates, process immediately
    if (this.updateQueue.length >= this.config.maxBatchSize) {
      this.processBatch();
      return;
    }

    // Otherwise, schedule processing
    if (!this.rafId) {
      this.rafId = requestAnimationFrame(() => {
        this.processBatch();
        this.rafId = null;
      });
    }
  }

  /**
   * Process a single state update immediately.
   */
  updateState(entityId: string, newState: any): void {
    this.batchUpdate([{
      entityId,
      state: newState,
      timestamp: Date.now(),
    }]);
  }

  /**
   * Process all batched updates.
   */
  private processBatch(): void {
    if (this.updateQueue.length === 0) {
      return;
    }

    const startTime = performance.now();
    const updateMap = new Map<string, StateUpdate>();
    const diffs: StateDiff[] = [];

    // Deduplicate updates (keep latest for each entity)
    for (const update of this.updateQueue) {
      updateMap.set(update.entityId, update);
    }

    // Process each unique update
    for (const [entityId, update] of updateMap) {
      const diff = this.computeStateDiff(entityId, update.state);
      
      if (diff) {
        diffs.push(diff);
        this.lastState.set(entityId, update.state);
        
        // Notify entity-specific listeners
        const entityListeners = this.listeners.get(entityId);
        if (entityListeners) {
          for (const listener of entityListeners) {
            try {
              listener(diff);
            } catch (error) {
              logger.error(`Error in entity listener for ${entityId}:`, error);
            }
          }
        }
      }
    }

    // Notify global listeners
    if (diffs.length > 0) {
      for (const listener of this.globalListeners) {
        try {
          listener(diffs);
        } catch (error) {
          logger.error('Error in global state listener:', error);
        }
      }
    }

    // Clear queue
    this.updateQueue = [];

    // Log performance
    const processingTime = performance.now() - startTime;
    if (processingTime > this.config.batchInterval) {
      logger.warn(
        `Batch processing took ${processingTime.toFixed(2)}ms for ${updateMap.size} updates`
      );
    }
  }

  /**
   * Subscribe to state changes for a specific entity.
   */
  subscribeToEntity(
    entityId: string, 
    callback: (diff: StateDiff) => void
  ): () => void {
    if (!this.listeners.has(entityId)) {
      this.listeners.set(entityId, new Set());
    }
    
    this.listeners.get(entityId)!.add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(entityId);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.listeners.delete(entityId);
        }
      }
    };
  }

  /**
   * Subscribe to all state changes.
   */
  subscribeToAll(callback: (diffs: StateDiff[]) => void): () => void {
    this.globalListeners.add(callback);

    // Return unsubscribe function
    return () => {
      this.globalListeners.delete(callback);
    };
  }

  /**
   * Get current state for an entity.
   */
  getState(entityId: string): any | undefined {
    return this.lastState.get(entityId);
  }

  /**
   * Get all current states.
   */
  getAllStates(): Map<string, any> {
    return new Map(this.lastState);
  }

  /**
   * Initialize state from Home Assistant.
   */
  initializeFromHass(hass: HomeAssistant): void {
    const updates: StateUpdate[] = [];
    
    for (const [entityId, state] of Object.entries(hass.states)) {
      updates.push({
        entityId,
        state,
        timestamp: Date.now(),
      });
    }

    this.batchUpdate(updates);
    logger.info(`Initialized state for ${updates.length} entities`);
  }

  /**
   * Clear all state and listeners.
   */
  clear(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    this.updateQueue = [];
    this.lastState.clear();
    this.listeners.clear();
    this.globalListeners.clear();
  }

  /**
   * Get statistics about the state manager.
   */
  getStats(): {
    entityCount: number;
    listenerCount: number;
    queueSize: number;
  } {
    return {
      entityCount: this.lastState.size,
      listenerCount: this.listeners.size + this.globalListeners.size,
      queueSize: this.updateQueue.length,
    };
  }
}