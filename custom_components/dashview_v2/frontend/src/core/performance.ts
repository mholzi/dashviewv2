/**
 * Performance monitoring utilities for Dashview V2.
 * Tracks rendering performance, memory usage, and optimization metrics.
 */

import { logger } from '../utils/logger';

interface PerformanceMetrics {
  renderTime: number;
  updateTime: number;
  memoryUsage: number;
  entityCount: number;
  widgetCount: number;
  subscriptionCount: number;
  frameRate: number;
}

interface PerformanceThreshold {
  warning: number;
  critical: number;
}

interface PerformanceConfig {
  enabled: boolean;
  sampleRate: number;
  reportInterval: number;
  thresholds: {
    renderTime: PerformanceThreshold;
    updateTime: PerformanceThreshold;
    memoryUsage: PerformanceThreshold;
    frameRate: PerformanceThreshold;
  };
}

class PerformanceMonitor {
  private config: PerformanceConfig;
  private metrics: PerformanceMetrics[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();
  private frameRateInterval?: number;
  private reportInterval?: number;
  private lastFrameTime = 0;
  private frameCount = 0;
  private currentFrameRate = 60;

  constructor() {
    this.config = {
      enabled: process.env.NODE_ENV === 'development',
      sampleRate: 0.1, // Sample 10% of operations
      reportInterval: 30000, // Report every 30 seconds
      thresholds: {
        renderTime: { warning: 16, critical: 33 }, // Target 60fps
        updateTime: { warning: 10, critical: 20 },
        memoryUsage: { warning: 50 * 1024 * 1024, critical: 100 * 1024 * 1024 }, // MB
        frameRate: { warning: 30, critical: 20 },
      },
    };
  }

  /**
   * Initialize performance monitoring.
   */
  init(config?: Partial<PerformanceConfig>): void {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    if (!this.config.enabled) {
      logger.debug('Performance monitoring disabled');
      return;
    }

    this.setupObservers();
    this.startFrameRateMonitoring();
    this.startReportingInterval();

    logger.info('Performance monitoring initialized');
  }

  /**
   * Measure render performance.
   */
  measureRender(componentName: string, callback: () => void): void {
    if (!this.shouldSample()) {
      callback();
      return;
    }

    const startTime = performance.now();
    callback();
    const endTime = performance.now();

    const renderTime = endTime - startTime;
    this.checkThreshold('renderTime', renderTime, componentName);

    logger.debug(`${componentName} rendered in ${renderTime.toFixed(2)}ms`);
  }

  /**
   * Measure async operation performance.
   */
  async measureAsync<T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    if (!this.shouldSample()) {
      return operation();
    }

    const startTime = performance.now();
    try {
      const result = await operation();
      const endTime = performance.now();

      const duration = endTime - startTime;
      this.checkThreshold('updateTime', duration, operationName);

      logger.debug(`${operationName} completed in ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      logger.error(`${operationName} failed after ${duration.toFixed(2)}ms`, error);
      throw error;
    }
  }

  /**
   * Track entity count.
   */
  trackEntityCount(count: number): void {
    if (!this.config.enabled) return;

    const lastMetric = this.getCurrentMetrics();
    lastMetric.entityCount = count;
  }

  /**
   * Track widget count.
   */
  trackWidgetCount(count: number): void {
    if (!this.config.enabled) return;

    const lastMetric = this.getCurrentMetrics();
    lastMetric.widgetCount = count;
  }

  /**
   * Track subscription count.
   */
  trackSubscriptionCount(count: number): void {
    if (!this.config.enabled) return;

    const lastMetric = this.getCurrentMetrics();
    lastMetric.subscriptionCount = count;
  }

  /**
   * Get current performance metrics.
   */
  getMetrics(): PerformanceMetrics {
    return this.getCurrentMetrics();
  }

  /**
   * Get performance report.
   */
  getReport(): {
    current: PerformanceMetrics;
    average: PerformanceMetrics;
    warnings: string[];
  } {
    const current = this.getCurrentMetrics();
    const average = this.calculateAverageMetrics();
    const warnings = this.checkAllThresholds(current);

    return { current, average, warnings };
  }

  /**
   * Mark for performance measurement.
   */
  mark(name: string): void {
    if (!this.config.enabled) return;
    performance.mark(name);
  }

  /**
   * Measure between marks.
   */
  measure(name: string, startMark: string, endMark?: string): number {
    if (!this.config.enabled) return 0;

    try {
      if (endMark) {
        performance.measure(name, startMark, endMark);
      } else {
        performance.measure(name, startMark);
      }

      const measures = performance.getEntriesByName(name);
      const duration = measures[measures.length - 1]?.duration || 0;

      // Clean up
      performance.clearMarks(startMark);
      if (endMark) performance.clearMarks(endMark);
      performance.clearMeasures(name);

      return duration;
    } catch (error) {
      logger.debug(`Failed to measure ${name}:`, error);
      return 0;
    }
  }

  /**
   * Clean up resources.
   */
  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();

    if (this.frameRateInterval) {
      cancelAnimationFrame(this.frameRateInterval);
    }

    if (this.reportInterval) {
      clearInterval(this.reportInterval);
    }
  }

  private setupObservers(): void {
    // Observe long tasks
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            logger.warn(`Long task detected: ${entry.duration.toFixed(2)}ms`);
          }
        });

        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.set('longtask', longTaskObserver);
      } catch (error) {
        logger.debug('Long task observer not supported');
      }
    }
  }

  private startFrameRateMonitoring(): void {
    const measureFrameRate = (timestamp: number) => {
      if (this.lastFrameTime) {
        const delta = timestamp - this.lastFrameTime;
        this.frameCount++;

        // Calculate FPS every second
        if (this.frameCount >= 60) {
          this.currentFrameRate = Math.round(1000 / (delta / this.frameCount));
          this.frameCount = 0;
          
          const metrics = this.getCurrentMetrics();
          metrics.frameRate = this.currentFrameRate;
          
          this.checkThreshold('frameRate', this.currentFrameRate, 'Frame Rate', true);
        }
      }

      this.lastFrameTime = timestamp;
      this.frameRateInterval = requestAnimationFrame(measureFrameRate);
    };

    this.frameRateInterval = requestAnimationFrame(measureFrameRate);
  }

  private startReportingInterval(): void {
    this.reportInterval = window.setInterval(() => {
      const report = this.getReport();
      
      logger.info('Performance Report', {
        current: report.current,
        average: report.average,
        warnings: report.warnings,
      });

      // Reset metrics after reporting
      this.metrics = [this.getCurrentMetrics()];
    }, this.config.reportInterval);
  }

  private shouldSample(): boolean {
    return this.config.enabled && Math.random() < this.config.sampleRate;
  }

  private getCurrentMetrics(): PerformanceMetrics {
    if (this.metrics.length === 0) {
      this.metrics.push({
        renderTime: 0,
        updateTime: 0,
        memoryUsage: this.getMemoryUsage(),
        entityCount: 0,
        widgetCount: 0,
        subscriptionCount: 0,
        frameRate: 60,
      });
    }

    return this.metrics[this.metrics.length - 1];
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  private calculateAverageMetrics(): PerformanceMetrics {
    if (this.metrics.length === 0) {
      return this.getCurrentMetrics();
    }

    const sum = this.metrics.reduce(
      (acc, metric) => ({
        renderTime: acc.renderTime + metric.renderTime,
        updateTime: acc.updateTime + metric.updateTime,
        memoryUsage: acc.memoryUsage + metric.memoryUsage,
        entityCount: acc.entityCount + metric.entityCount,
        widgetCount: acc.widgetCount + metric.widgetCount,
        subscriptionCount: acc.subscriptionCount + metric.subscriptionCount,
        frameRate: acc.frameRate + metric.frameRate,
      }),
      {
        renderTime: 0,
        updateTime: 0,
        memoryUsage: 0,
        entityCount: 0,
        widgetCount: 0,
        subscriptionCount: 0,
        frameRate: 0,
      }
    );

    const count = this.metrics.length;
    return {
      renderTime: sum.renderTime / count,
      updateTime: sum.updateTime / count,
      memoryUsage: sum.memoryUsage / count,
      entityCount: sum.entityCount / count,
      widgetCount: sum.widgetCount / count,
      subscriptionCount: sum.subscriptionCount / count,
      frameRate: sum.frameRate / count,
    };
  }

  private checkThreshold(
    metric: keyof PerformanceConfig['thresholds'],
    value: number,
    context: string,
    inverse = false
  ): void {
    const threshold = this.config.thresholds[metric];
    
    let isWarning: boolean;
    let isCritical: boolean;
    
    if (inverse) {
      // For metrics where lower is worse (like frame rate)
      isWarning = value < threshold.warning;
      isCritical = value < threshold.critical;
    } else {
      // For metrics where higher is worse (like render time)
      isWarning = value > threshold.warning;
      isCritical = value > threshold.critical;
    }

    if (isCritical) {
      logger.error(`Critical ${metric} threshold exceeded in ${context}: ${value}`);
    } else if (isWarning) {
      logger.warn(`Warning ${metric} threshold exceeded in ${context}: ${value}`);
    }
  }

  private checkAllThresholds(metrics: PerformanceMetrics): string[] {
    const warnings: string[] = [];

    // Check render time
    if (metrics.renderTime > this.config.thresholds.renderTime.critical) {
      warnings.push(`Critical render time: ${metrics.renderTime.toFixed(2)}ms`);
    } else if (metrics.renderTime > this.config.thresholds.renderTime.warning) {
      warnings.push(`High render time: ${metrics.renderTime.toFixed(2)}ms`);
    }

    // Check update time
    if (metrics.updateTime > this.config.thresholds.updateTime.critical) {
      warnings.push(`Critical update time: ${metrics.updateTime.toFixed(2)}ms`);
    } else if (metrics.updateTime > this.config.thresholds.updateTime.warning) {
      warnings.push(`High update time: ${metrics.updateTime.toFixed(2)}ms`);
    }

    // Check memory usage
    const memoryMB = metrics.memoryUsage / (1024 * 1024);
    if (metrics.memoryUsage > this.config.thresholds.memoryUsage.critical) {
      warnings.push(`Critical memory usage: ${memoryMB.toFixed(2)}MB`);
    } else if (metrics.memoryUsage > this.config.thresholds.memoryUsage.warning) {
      warnings.push(`High memory usage: ${memoryMB.toFixed(2)}MB`);
    }

    // Check frame rate
    if (metrics.frameRate < this.config.thresholds.frameRate.critical) {
      warnings.push(`Critical frame rate: ${metrics.frameRate}fps`);
    } else if (metrics.frameRate < this.config.thresholds.frameRate.warning) {
      warnings.push(`Low frame rate: ${metrics.frameRate}fps`);
    }

    return warnings;
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export decorators for easy use
export function measurePerformance(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const componentName = `${target.constructor.name}.${propertyKey}`;
    let result: any;

    performanceMonitor.measureRender(componentName, () => {
      result = originalMethod.apply(this, args);
    });

    return result;
  };

  return descriptor;
}

export function measureAsyncPerformance(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const operationName = `${target.constructor.name}.${propertyKey}`;
    return performanceMonitor.measureAsync(operationName, () => 
      originalMethod.apply(this, args)
    );
  };

  return descriptor;
}