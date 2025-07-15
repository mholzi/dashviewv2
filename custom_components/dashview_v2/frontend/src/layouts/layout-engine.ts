/**
 * Layout engine for Dashview V2.
 * Handles layout selection, widget organization, and overflow management.
 */

import { BaseLayout, Breakpoint, WidgetPosition } from './base-layout';
import { StandardLayout } from './standard-layout';
import { WidgetConfig } from '../core/widget-base';
import { Logger } from '../utils/logger';

const logger = new Logger('LayoutEngine');

export interface AreaInfo {
  areaId: string;
  name: string;
  entities: string[];
  entityCount: number;
  deviceCount: number;
}

export interface LayoutEngineConfig {
  maxWidgetsPerArea: number;
  prioritizeByUsage: boolean;
}

export class LayoutEngine {
  private layouts: Map<string, BaseLayout>;
  private currentLayout: BaseLayout | null = null;
  private config: Required<LayoutEngineConfig>;

  constructor(config: Partial<LayoutEngineConfig> = {}) {
    this.config = {
      maxWidgetsPerArea: config.maxWidgetsPerArea ?? 2,
      prioritizeByUsage: config.prioritizeByUsage ?? true,
    };

    // Initialize available layouts
    this.layouts = new Map();
    this.registerLayout('standard', new StandardLayout());
    
    // Future layouts can be registered here:
    // this.registerLayout('compact', new CompactLayout());
    // this.registerLayout('complex', new ComplexLayout());
    // this.registerLayout('estate', new EstateLayout());
  }

  /**
   * Register a layout.
   */
  registerLayout(name: string, layout: BaseLayout): void {
    this.layouts.set(name, layout);
    logger.info(`Registered layout: ${name}`);
  }

  /**
   * Select optimal layout based on complexity score.
   */
  selectLayout(complexityScore: number, areaCount: number): BaseLayout {
    // For now, we only have StandardLayout
    // In the future, this will select based on complexity
    
    let selectedLayout: BaseLayout | undefined;
    let selectedName = '';

    // Find suitable layout for area count
    for (const [name, layout] of this.layouts) {
      if (layout.isSuitableForAreaCount(areaCount)) {
        selectedLayout = layout;
        selectedName = name;
        break;
      }
    }

    // Fallback to standard if no suitable layout found
    if (!selectedLayout) {
      selectedLayout = this.layouts.get('standard')!;
      selectedName = 'standard';
      logger.warn(
        `No suitable layout for ${areaCount} areas, using standard layout`
      );
    }

    this.currentLayout = selectedLayout;
    logger.info(
      `Selected ${selectedName} layout for complexity ${complexityScore} and ${areaCount} areas`
    );

    return selectedLayout;
  }

  /**
   * Organize widgets based on areas and layout.
   */
  organizeWidgets(areas: AreaInfo[]): WidgetConfig[] {
    const widgets: WidgetConfig[] = [];

    // Sort areas by entity count and priority
    const sortedAreas = this.sortAreasByPriority(areas);

    // Create room widgets for each area
    for (const area of sortedAreas) {
      if (area.entityCount === 0) continue;

      const roomWidget: WidgetConfig = {
        type: 'room',
        entities: area.entities,
        title: area.name,
      };
      widgets.push(roomWidget);
    }

    // Create device group widgets
    const deviceGroups = this.createDeviceGroups(areas);
    widgets.push(...deviceGroups);

    // Create climate widget if climate entities exist
    const climateWidget = this.createClimateWidget(areas);
    if (climateWidget) {
      widgets.push(climateWidget);
    }

    // Create quick controls widget
    const quickControls = this.createQuickControlsWidget(areas);
    if (quickControls) {
      widgets.push(quickControls);
    }

    logger.info(`Organized ${widgets.length} widgets from ${areas.length} areas`);
    return widgets;
  }

  /**
   * Handle widget overflow for current layout.
   */
  handleOverflow(
    widgets: WidgetConfig[],
    layout: BaseLayout,
    breakpoint: Breakpoint
  ): {
    visible: WidgetConfig[];
    overflow: WidgetConfig[];
  } {
    const areas = layout.getGridAreas(breakpoint);
    const visible: WidgetConfig[] = [];
    const overflow: WidgetConfig[] = [];
    
    // Group widgets by type
    const widgetsByType = new Map<string, WidgetConfig[]>();
    for (const widget of widgets) {
      if (!widgetsByType.has(widget.type)) {
        widgetsByType.set(widget.type, []);
      }
      widgetsByType.get(widget.type)!.push(widget);
    }

    // Place widgets according to area constraints
    for (const area of areas) {
      let remainingSlots = area.maxWidgets || 999;
      
      for (const widgetType of area.widgetTypes || []) {
        const availableWidgets = widgetsByType.get(widgetType) || [];
        
        for (const widget of availableWidgets) {
          if (remainingSlots > 0 && !visible.includes(widget)) {
            visible.push(widget);
            remainingSlots--;
          } else if (!visible.includes(widget) && !overflow.includes(widget)) {
            overflow.push(widget);
          }
        }
      }
    }

    logger.info(
      `Layout overflow: ${visible.length} visible, ${overflow.length} overflow`
    );

    return { visible, overflow };
  }

  /**
   * Sort areas by priority.
   */
  private sortAreasByPriority(areas: AreaInfo[]): AreaInfo[] {
    return [...areas].sort((a, b) => {
      // Prioritize named areas over "unassigned"
      if (a.areaId === 'unassigned') return 1;
      if (b.areaId === 'unassigned') return -1;

      // Prioritize by entity count
      if (a.entityCount !== b.entityCount) {
        return b.entityCount - a.entityCount;
      }

      // Then by device count
      return b.deviceCount - a.deviceCount;
    });
  }

  /**
   * Create device group widgets.
   */
  private createDeviceGroups(areas: AreaInfo[]): WidgetConfig[] {
    const groups: WidgetConfig[] = [];
    const allEntities: string[] = [];

    // Collect all entities
    for (const area of areas) {
      allEntities.push(...area.entities);
    }

    // Group by domain
    const entityByDomain = new Map<string, string[]>();
    for (const entityId of allEntities) {
      const domain = entityId.split('.')[0];
      if (!entityByDomain.has(domain)) {
        entityByDomain.set(domain, []);
      }
      entityByDomain.get(domain)!.push(entityId);
    }

    // Create groups for specific domains
    const groupableDomains = ['light', 'switch', 'cover', 'fan'];
    
    for (const domain of groupableDomains) {
      const entities = entityByDomain.get(domain) || [];
      if (entities.length >= 3) {  // Only create group if enough entities
        groups.push({
          type: 'device-group',
          entities: entities,
          title: `All ${domain}s`,
        });
      }
    }

    return groups;
  }

  /**
   * Create climate widget.
   */
  private createClimateWidget(areas: AreaInfo[]): WidgetConfig | null {
    const climateEntities: string[] = [];

    for (const area of areas) {
      for (const entityId of area.entities) {
        if (entityId.startsWith('climate.') ||
            entityId.includes('temperature') ||
            entityId.includes('humidity')) {
          climateEntities.push(entityId);
        }
      }
    }

    if (climateEntities.length === 0) {
      return null;
    }

    return {
      type: 'climate',
      entities: climateEntities,
      title: 'Climate Control',
    };
  }

  /**
   * Create quick controls widget.
   */
  private createQuickControlsWidget(areas: AreaInfo[]): WidgetConfig | null {
    const quickEntities: string[] = [];

    // Find most important entities (scenes, main lights, etc.)
    for (const area of areas) {
      for (const entityId of area.entities) {
        if (entityId.startsWith('scene.') ||
            entityId.includes('main') ||
            entityId.includes('all')) {
          quickEntities.push(entityId);
        }
      }
    }

    // Limit to reasonable number
    const limitedEntities = quickEntities.slice(0, 8);

    if (limitedEntities.length === 0) {
      return null;
    }

    return {
      type: 'quick-controls',
      entities: limitedEntities,
      title: 'Quick Controls',
    };
  }

  /**
   * Get current layout.
   */
  getCurrentLayout(): BaseLayout | null {
    return this.currentLayout;
  }

  /**
   * Calculate widget positions for current layout.
   */
  calculatePositions(
    widgets: WidgetConfig[],
    areaCount: number
  ): WidgetPosition[] {
    if (!this.currentLayout) {
      logger.error('No layout selected');
      return [];
    }

    return this.currentLayout.calculateWidgetPositions(widgets, areaCount);
  }

  /**
   * Update container width and check for breakpoint changes.
   */
  updateContainerWidth(width: number): boolean {
    if (!this.currentLayout) {
      return false;
    }

    return this.currentLayout.updateContainerWidth(width);
  }
}