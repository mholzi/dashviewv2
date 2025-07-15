/**
 * Standard layout for 2-3 bedroom homes.
 * Optimized grid layout with room widgets in main area,
 * device groups in sidebar, climate in header, and quick controls in footer.
 */

import { BaseLayout, Breakpoint, GridArea, LayoutConfig, WidgetPosition } from './base-layout';
import { WidgetConfig } from '../core/widget-base';

export class StandardLayout extends BaseLayout {
  protected getLayoutConfig(): LayoutConfig {
    return {
      name: 'Standard',
      description: 'Optimized layout for 2-3 bedroom homes',
      minAreas: 2,
      maxAreas: 5,
      breakpoints: {
        mobile: 768,
        tablet: 1024,
        desktop: 1440,
        large: 1920,
      },
    };
  }

  generateGridTemplate(breakpoint: Breakpoint): string {
    switch (breakpoint) {
      case 'mobile':
        // Single column layout
        return `
          "header" auto
          "main" 1fr
          "sidebar" auto
          "footer" auto
          / 1fr
        `;
      
      case 'tablet':
        // Two column layout
        return `
          "header header" auto
          "main main" 1fr
          "sidebar sidebar" auto
          "footer footer" auto
          / 1fr 1fr
        `;
      
      case 'desktop':
        // Three column layout with sidebar
        return `
          "header header header" auto
          "main main sidebar" 1fr
          "footer footer footer" auto
          / 1fr 1fr minmax(280px, 0.5fr)
        `;
      
      case 'large':
        // Three column layout with larger sidebar
        return `
          "header header header" auto
          "main main sidebar" 1fr
          "footer footer footer" auto
          / 1fr 1fr minmax(320px, 0.6fr)
        `;
      
      default:
        return this.generateGridTemplate('desktop');
    }
  }

  getGridAreas(breakpoint: Breakpoint): GridArea[] {
    const areas: GridArea[] = [
      {
        name: 'header',
        gridArea: 'header',
        minWidgets: 0,
        maxWidgets: 2,
        widgetTypes: ['climate', 'quick-controls'],
      },
      {
        name: 'main',
        gridArea: 'main',
        minWidgets: 1,
        maxWidgets: 6,
        widgetTypes: ['room'],
      },
      {
        name: 'sidebar',
        gridArea: 'sidebar',
        minWidgets: 0,
        maxWidgets: 4,
        widgetTypes: ['device-group', 'quick-controls'],
      },
      {
        name: 'footer',
        gridArea: 'footer',
        minWidgets: 0,
        maxWidgets: 1,
        widgetTypes: ['quick-controls'],
      },
    ];

    // Adjust for mobile
    if (breakpoint === 'mobile') {
      // On mobile, everything stacks vertically
      areas.forEach(area => {
        if (area.name === 'main') {
          area.maxWidgets = 4; // Limit room widgets on mobile
        }
      });
    }

    return areas;
  }

  calculateWidgetPositions(
    widgets: WidgetConfig[],
    areaCount: number
  ): WidgetPosition[] {
    const positions: WidgetPosition[] = [];
    const sortedWidgets = this.sortWidgetsByPriority(widgets);
    const widgetsByType = this.groupWidgetsByType(sortedWidgets);
    
    // Place climate widgets in header
    const climateWidgets = widgetsByType.get('climate') || [];
    climateWidgets.slice(0, 1).forEach((widget, index) => {
      positions.push({
        widgetId: this.generateWidgetId(widget),
        gridArea: 'header',
        order: index,
      });
    });

    // Place room widgets in main area
    const roomWidgets = widgetsByType.get('room') || [];
    const mainColumns = this.currentBreakpoint === 'mobile' ? 1 : 2;
    const mainRows = Math.ceil(roomWidgets.length / mainColumns);
    
    roomWidgets.slice(0, 6).forEach((widget, index) => {
      const col = (index % mainColumns) + 1;
      const row = Math.floor(index / mainColumns) + 1;
      
      positions.push({
        widgetId: this.generateWidgetId(widget),
        gridArea: 'main',
        gridColumn: this.currentBreakpoint === 'mobile' 
          ? '1' 
          : `${col} / span 1`,
        gridRow: `${row} / span 1`,
        order: index,
      });
    });

    // Place device groups in sidebar
    const deviceGroups = widgetsByType.get('device-group') || [];
    deviceGroups.slice(0, 3).forEach((widget, index) => {
      positions.push({
        widgetId: this.generateWidgetId(widget),
        gridArea: 'sidebar',
        order: index,
      });
    });

    // Place quick controls
    const quickControls = widgetsByType.get('quick-controls') || [];
    if (quickControls.length > 0) {
      // First quick controls in footer
      positions.push({
        widgetId: this.generateWidgetId(quickControls[0]),
        gridArea: 'footer',
        order: 0,
      });
      
      // Additional quick controls in sidebar
      quickControls.slice(1, 3).forEach((widget, index) => {
        positions.push({
          widgetId: this.generateWidgetId(widget),
          gridArea: 'sidebar',
          order: deviceGroups.length + index,
        });
      });
    }

    return positions;
  }

  /**
   * Generate a unique widget ID.
   */
  private generateWidgetId(widget: WidgetConfig): string {
    // Use type and first entity as ID
    const firstEntity = widget.entities[0] || 'unknown';
    return `${widget.type}-${firstEntity.replace(/\./g, '_')}`;
  }

  /**
   * Get recommended widget configuration for area count.
   */
  getRecommendedWidgets(areaCount: number): {
    roomWidgets: number;
    deviceGroups: number;
    climateWidgets: number;
    quickControls: number;
  } {
    // Base recommendations
    const config = {
      roomWidgets: Math.min(areaCount, 4),
      deviceGroups: 2,
      climateWidgets: 1,
      quickControls: 1,
    };

    // Adjust based on area count
    if (areaCount <= 2) {
      // Small home: fewer widgets
      config.roomWidgets = areaCount;
      config.deviceGroups = 1;
    } else if (areaCount >= 4) {
      // Larger home: more widgets
      config.deviceGroups = 3;
      config.quickControls = 2;
    }

    // Adjust for breakpoint
    if (this.currentBreakpoint === 'mobile') {
      config.roomWidgets = Math.min(config.roomWidgets, 3);
      config.deviceGroups = Math.min(config.deviceGroups, 2);
    }

    return config;
  }

  /**
   * Get CSS for specific grid areas.
   */
  getAreaStyles(breakpoint?: Breakpoint): Record<string, string> {
    const bp = breakpoint || this.currentBreakpoint;
    
    const baseStyles = {
      header: `
        grid-area: header;
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        align-items: center;
      `,
      main: `
        grid-area: main;
        display: grid;
        gap: 16px;
        align-content: start;
      `,
      sidebar: `
        grid-area: sidebar;
        display: flex;
        flex-direction: column;
        gap: 16px;
      `,
      footer: `
        grid-area: footer;
        display: flex;
        justify-content: center;
        align-items: center;
      `,
    };

    // Adjust main grid for different breakpoints
    if (bp === 'mobile') {
      baseStyles.main += `
        grid-template-columns: 1fr;
      `;
    } else {
      baseStyles.main += `
        grid-template-columns: repeat(2, 1fr);
      `;
    }

    return baseStyles;
  }
}