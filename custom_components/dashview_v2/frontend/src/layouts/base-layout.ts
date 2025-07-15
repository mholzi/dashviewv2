/**
 * Base layout class for Dashview V2 dashboard layouts.
 * Provides grid system and responsive breakpoint handling.
 */

import { WidgetConfig } from '../core/widget-base';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop' | 'large';

export interface LayoutConfig {
  name: string;
  description: string;
  minAreas: number;
  maxAreas: number;
  breakpoints: {
    mobile: number;    // < 768px
    tablet: number;    // 768px - 1023px
    desktop: number;   // 1024px - 1439px
    large: number;     // >= 1440px
  };
}

export interface GridArea {
  name: string;
  gridArea: string;
  minWidgets?: number;
  maxWidgets?: number;
  widgetTypes?: string[];
}

export interface WidgetPosition {
  widgetId: string;
  gridArea: string;
  gridColumn?: string;
  gridRow?: string;
  order?: number;
}

export abstract class BaseLayout {
  protected config: LayoutConfig;
  protected currentBreakpoint: Breakpoint = 'desktop';
  protected containerWidth = 0;

  constructor() {
    this.config = this.getLayoutConfig();
  }

  /**
   * Get layout configuration.
   * Must be implemented by subclasses.
   */
  protected abstract getLayoutConfig(): LayoutConfig;

  /**
   * Generate CSS grid template for current breakpoint.
   */
  abstract generateGridTemplate(breakpoint: Breakpoint): string;

  /**
   * Calculate widget positions based on available widgets and areas.
   */
  abstract calculateWidgetPositions(
    widgets: WidgetConfig[],
    areaCount: number
  ): WidgetPosition[];

  /**
   * Get grid areas definition for current breakpoint.
   */
  abstract getGridAreas(breakpoint: Breakpoint): GridArea[];

  /**
   * Get current breakpoint based on container width.
   */
  getBreakpoint(width?: number): Breakpoint {
    const w = width || this.containerWidth;
    
    if (w < this.config.breakpoints.tablet) {
      return 'mobile';
    } else if (w < this.config.breakpoints.desktop) {
      return 'tablet';
    } else if (w < this.config.breakpoints.large) {
      return 'desktop';
    } else {
      return 'large';
    }
  }

  /**
   * Update container width and return if breakpoint changed.
   */
  updateContainerWidth(width: number): boolean {
    this.containerWidth = width;
    const newBreakpoint = this.getBreakpoint(width);
    
    if (newBreakpoint !== this.currentBreakpoint) {
      this.currentBreakpoint = newBreakpoint;
      return true;
    }
    
    return false;
  }

  /**
   * Get number of columns for current breakpoint.
   */
  getColumnCount(breakpoint?: Breakpoint): number {
    const bp = breakpoint || this.currentBreakpoint;
    
    switch (bp) {
      case 'mobile':
        return 4;
      case 'tablet':
        return 8;
      case 'desktop':
        return 12;
      case 'large':
        return 12;
      default:
        return 12;
    }
  }

  /**
   * Get grid gap size for current breakpoint.
   */
  getGridGap(breakpoint?: Breakpoint): string {
    const bp = breakpoint || this.currentBreakpoint;
    
    switch (bp) {
      case 'mobile':
        return '8px';
      case 'tablet':
        return '12px';
      case 'desktop':
        return '16px';
      case 'large':
        return '20px';
      default:
        return '16px';
    }
  }

  /**
   * Get container padding for current breakpoint.
   */
  getContainerPadding(breakpoint?: Breakpoint): string {
    const bp = breakpoint || this.currentBreakpoint;
    
    switch (bp) {
      case 'mobile':
        return '8px';
      case 'tablet':
        return '16px';
      case 'desktop':
        return '24px';
      case 'large':
        return '32px';
      default:
        return '24px';
    }
  }

  /**
   * Check if layout is suitable for given area count.
   */
  isSuitableForAreaCount(areaCount: number): boolean {
    return areaCount >= this.config.minAreas && 
           areaCount <= this.config.maxAreas;
  }

  /**
   * Sort widgets by priority for placement.
   */
  protected sortWidgetsByPriority(widgets: WidgetConfig[]): WidgetConfig[] {
    // Priority order: room > climate > device-group > quick-controls
    const priorityMap: Record<string, number> = {
      'room': 4,
      'climate': 3,
      'device-group': 2,
      'quick-controls': 1,
    };

    return [...widgets].sort((a, b) => {
      const priorityA = priorityMap[a.type] || 0;
      const priorityB = priorityMap[b.type] || 0;
      
      // Sort by priority first
      if (priorityA !== priorityB) {
        return priorityB - priorityA;
      }
      
      // Then by entity count
      return b.entities.length - a.entities.length;
    });
  }

  /**
   * Group widgets by type.
   */
  protected groupWidgetsByType(widgets: WidgetConfig[]): Map<string, WidgetConfig[]> {
    const groups = new Map<string, WidgetConfig[]>();
    
    for (const widget of widgets) {
      const type = widget.type;
      if (!groups.has(type)) {
        groups.set(type, []);
      }
      groups.get(type)!.push(widget);
    }
    
    return groups;
  }

  /**
   * Generate CSS for grid template.
   */
  generateGridCSS(breakpoint?: Breakpoint): string {
    const bp = breakpoint || this.currentBreakpoint;
    const template = this.generateGridTemplate(bp);
    const gap = this.getGridGap(bp);
    const padding = this.getContainerPadding(bp);
    
    return `
      display: grid;
      grid-template: ${template};
      gap: ${gap};
      padding: ${padding};
      width: 100%;
      height: 100%;
      box-sizing: border-box;
    `;
  }

  /**
   * Get layout metadata.
   */
  getMetadata(): {
    name: string;
    description: string;
    currentBreakpoint: Breakpoint;
    supportedAreaRange: [number, number];
  } {
    return {
      name: this.config.name,
      description: this.config.description,
      currentBreakpoint: this.currentBreakpoint,
      supportedAreaRange: [this.config.minAreas, this.config.maxAreas],
    };
  }
}