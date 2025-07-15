/**
 * Entity type to icon mapping utility.
 * Maps entity types and domains to Material Design Icons.
 */

export const ENTITY_ICONS: Record<string, string> = {
  // Lights
  'light': 'mdi:lightbulb',
  'light.ceiling': 'mdi:ceiling-light',
  'light.floor': 'mdi:floor-lamp',
  'light.desk': 'mdi:desk-lamp',
  'light.strip': 'mdi:led-strip-variant',
  'light.spot': 'mdi:spotlight-beam',
  
  // Climate
  'climate': 'mdi:thermostat',
  'temperature': 'mdi:thermometer',
  'humidity': 'mdi:water-percent',
  'air_quality': 'mdi:air-filter',
  
  // Security
  'lock': 'mdi:lock',
  'door': 'mdi:door',
  'window': 'mdi:window-closed',
  'motion': 'mdi:motion-sensor',
  'presence': 'mdi:home-account',
  'camera': 'mdi:cctv',
  'alarm': 'mdi:shield-home',
  
  // Media
  'media_player': 'mdi:television',
  'speaker': 'mdi:speaker',
  'remote': 'mdi:remote',
  
  // Switches & Controls
  'switch': 'mdi:light-switch',
  'fan': 'mdi:fan',
  'cover': 'mdi:window-shutter',
  'blind': 'mdi:blinds',
  'curtain': 'mdi:curtains',
  
  // Sensors
  'sensor': 'mdi:eye',
  'binary_sensor': 'mdi:radiobox-marked',
  'battery': 'mdi:battery',
  'power': 'mdi:flash',
  'energy': 'mdi:lightning-bolt',
  
  // Other devices
  'vacuum': 'mdi:robot-vacuum',
  'person': 'mdi:account',
  'device_tracker': 'mdi:cellphone',
  'sun': 'mdi:weather-sunny',
  'weather': 'mdi:weather-partly-cloudy',
  
  // Default
  'default': 'mdi:home-assistant'
};

export function getEntityIcon(entityId: string, state?: any): string {
  // Check custom icon first
  if (state?.attributes?.icon) {
    return state.attributes.icon;
  }
  
  // Check device class for more specific icons
  const deviceClass = state?.attributes?.device_class;
  if (deviceClass && ENTITY_ICONS[deviceClass]) {
    return ENTITY_ICONS[deviceClass];
  }
  
  // Match by entity ID patterns
  for (const [pattern, icon] of Object.entries(ENTITY_ICONS)) {
    if (entityId.includes(pattern)) {
      return icon;
    }
  }
  
  // Domain fallback
  const domain = entityId.split('.')[0];
  return ENTITY_ICONS[domain] || ENTITY_ICONS.default;
}

/**
 * Get icon color based on entity state and domain.
 */
export function getEntityIconColor(entityId: string, state?: any): string {
  const domain = entityId.split('.')[0];
  const isOn = state?.state === 'on';
  const isActive = ['playing', 'open', 'unlocked', 'home', 'detected'].includes(state?.state);
  const isUnavailable = state?.state === 'unavailable';
  
  if (isUnavailable) {
    return 'var(--disabled-text-color)';
  }
  
  // Domain-specific colors when active
  if (isOn || isActive) {
    switch (domain) {
      case 'light':
        return state?.attributes?.rgb_color 
          ? `rgb(${state.attributes.rgb_color.join(',')})` 
          : 'var(--primary-color)';
      case 'climate':
        const mode = state?.state;
        if (mode === 'heat') return '#ff6b00';
        if (mode === 'cool') return '#0288d1';
        if (mode === 'heat_cool' || mode === 'auto') return '#388e3c';
        return 'var(--primary-color)';
      case 'lock':
        return state?.state === 'locked' ? '#4caf50' : '#f44336';
      case 'alarm_control_panel':
        if (state?.state === 'armed_away') return '#f44336';
        if (state?.state === 'armed_home') return '#ff9800';
        if (state?.state === 'disarmed') return '#4caf50';
        return 'var(--primary-color)';
      default:
        return 'var(--primary-color)';
    }
  }
  
  return 'var(--secondary-text-color)';
}

/**
 * Get a mini icon for entity summaries.
 */
export function getMiniIcon(entityType: string): string {
  const miniIcons: Record<string, string> = {
    'lights': 'mdi:lightbulb',
    'temperature': 'mdi:thermometer',
    'humidity': 'mdi:water-percent',
    'motion': 'mdi:motion-sensor',
    'doors': 'mdi:door',
    'windows': 'mdi:window-closed',
    'media': 'mdi:television',
    'climate': 'mdi:thermostat'
  };
  
  return miniIcons[entityType] || 'mdi:circle';
}