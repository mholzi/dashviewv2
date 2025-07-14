"""Home complexity analyzer for Dashview V2."""

import logging
from typing import Dict, List, Set

from homeassistant.core import HomeAssistant
from homeassistant.helpers import area_registry, device_registry, entity_registry

_LOGGER = logging.getLogger(__name__)


class HomeComplexityAnalyzer:
    """Analyzes home complexity for intelligent dashboard configuration."""
    
    def __init__(self, hass: HomeAssistant):
        """Initialize the analyzer."""
        self.hass = hass
        self._area_reg = area_registry.async_get(hass)
        self._device_reg = device_registry.async_get(hass)
        self._entity_reg = entity_registry.async_get(hass)
    
    async def calculate_complexity_score(self) -> int:
        """
        Calculate home complexity score (1-10).
        
        Factors:
        - Number of entities
        - Number of areas/rooms
        - Number of devices
        - Entity type diversity
        - Automation count
        """
        score = 0
        
        # Entity count factor (0-3 points)
        entity_count = len(self._entity_reg.entities)
        if entity_count < 50:
            score += 1
        elif entity_count < 150:
            score += 2
        else:
            score += 3
        
        # Area count factor (0-2 points)
        area_count = len(self._area_reg.areas)
        if area_count < 5:
            score += 1
        elif area_count >= 5:
            score += 2
        
        # Device count factor (0-2 points)
        device_count = len(self._device_reg.devices)
        if device_count < 20:
            score += 1
        elif device_count >= 20:
            score += 2
        
        # Entity diversity factor (0-3 points)
        entity_domains = self._get_entity_domains()
        domain_count = len(entity_domains)
        if domain_count < 10:
            score += 1
        elif domain_count < 20:
            score += 2
        else:
            score += 3
        
        # Cap at 10
        return min(score, 10)
    
    def _get_entity_domains(self) -> Set[str]:
        """Get unique entity domains."""
        domains = set()
        for entity in self._entity_reg.entities.values():
            domain = entity.entity_id.split('.')[0]
            domains.add(domain)
        return domains
    
    async def detect_areas(self) -> List[Dict[str, any]]:
        """Detect and categorize areas in the home."""
        areas = []
        
        for area_id, area in self._area_reg.areas.items():
            # Count entities in this area
            area_entities = [
                entity for entity in self._entity_reg.entities.values()
                if entity.area_id == area_id
            ]
            
            # Count devices in this area
            area_devices = [
                device for device in self._device_reg.devices.values()
                if device.area_id == area_id
            ]
            
            areas.append({
                "id": area_id,
                "name": area.name,
                "entity_count": len(area_entities),
                "device_count": len(area_devices),
            })
        
        return areas
    
    async def categorize_entities(self) -> Dict[str, List[str]]:
        """Categorize entities by type."""
        categories = {
            "lights": [],
            "switches": [],
            "sensors": [],
            "climate": [],
            "media": [],
            "security": [],
            "other": [],
        }
        
        for entity in self._entity_reg.entities.values():
            entity_id = entity.entity_id
            domain = entity_id.split('.')[0]
            
            if domain == "light":
                categories["lights"].append(entity_id)
            elif domain == "switch":
                categories["switches"].append(entity_id)
            elif domain in ["sensor", "binary_sensor"]:
                categories["sensors"].append(entity_id)
            elif domain == "climate":
                categories["climate"].append(entity_id)
            elif domain in ["media_player", "remote"]:
                categories["media"].append(entity_id)
            elif domain in ["lock", "alarm_control_panel", "camera"]:
                categories["security"].append(entity_id)
            else:
                categories["other"].append(entity_id)
        
        return categories