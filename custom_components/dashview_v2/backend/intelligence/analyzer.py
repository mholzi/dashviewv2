"""Home complexity analyzer for Dashview V2."""

import logging
from typing import Dict, List, Set, Optional, Any
from dataclasses import dataclass

from homeassistant.core import HomeAssistant
from homeassistant.helpers import area_registry, device_registry, entity_registry

_LOGGER = logging.getLogger(__name__)


@dataclass
class AreaInfo:
    """Information about a home area."""
    area_id: str
    name: str
    entities: List[str]
    device_count: int
    last_activity: Optional[float] = None


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
    
    async def analyze_areas(self) -> Dict[str, AreaInfo]:
        """
        Analyze all areas and their entities.
        
        Returns:
            Dictionary mapping area_id to AreaInfo objects
        """
        areas = {}
        
        # First, get all areas from the registry
        for area_id, area in self._area_reg.areas.items():
            area_entities = []
            device_count = 0
            
            # Get entities assigned to this area
            for entity in self._entity_reg.entities.values():
                if entity.area_id == area_id:
                    area_entities.append(entity.entity_id)
            
            # Get devices in this area
            for device in self._device_reg.devices.values():
                if device.area_id == area_id:
                    device_count += 1
                    # Also get entities from devices in this area
                    for entity in self._entity_reg.entities.values():
                        if entity.device_id == device.id and entity.entity_id not in area_entities:
                            area_entities.append(entity.entity_id)
            
            areas[area_id] = AreaInfo(
                area_id=area_id,
                name=area.name,
                entities=area_entities,
                device_count=device_count
            )
        
        # Handle unassigned entities
        unassigned_entities = await self.find_unassigned_entities()
        if unassigned_entities:
            areas["unassigned"] = AreaInfo(
                area_id="unassigned",
                name="Unassigned Devices",
                entities=unassigned_entities,
                device_count=len(set(
                    self._entity_reg.entities[entity_id].device_id 
                    for entity_id in unassigned_entities 
                    if entity_id in self._entity_reg.entities and 
                    self._entity_reg.entities[entity_id].device_id
                ))
            )
        
        return areas
    
    async def group_entities_by_area(self) -> Dict[str, List[str]]:
        """
        Group all entities by their assigned area.
        
        Returns:
            Dictionary mapping area_id to list of entity_ids
        """
        grouped = {}
        
        # Group by assigned areas
        for entity_id, entity in self._entity_reg.entities.items():
            area_id = entity.area_id
            
            # If entity has no area but has a device, use device's area
            if not area_id and entity.device_id:
                device = self._device_reg.devices.get(entity.device_id)
                if device:
                    area_id = device.area_id
            
            # Use area_id or "unassigned"
            area_key = area_id if area_id else "unassigned"
            
            if area_key not in grouped:
                grouped[area_key] = []
            grouped[area_key].append(entity_id)
        
        return grouped
    
    async def find_unassigned_entities(self) -> List[str]:
        """
        Find all entities without an assigned area.
        
        Returns:
            List of entity_ids that have no area assignment
        """
        unassigned = []
        
        for entity_id, entity in self._entity_reg.entities.items():
            # Check if entity has direct area assignment
            if entity.area_id:
                continue
            
            # Check if entity's device has area assignment
            if entity.device_id:
                device = self._device_reg.devices.get(entity.device_id)
                if device and device.area_id:
                    continue
            
            # Entity has no area assignment
            unassigned.append(entity_id)
        
        return unassigned
    
    async def get_home_complexity(self) -> Dict[str, Any]:
        """
        Get comprehensive home complexity analysis.
        
        Returns:
            Dictionary with complexity score and detailed breakdown
        """
        complexity_score = await self.calculate_complexity_score()
        areas = await self.analyze_areas()
        entity_groups = await self.group_entities_by_area()
        categories = await self.categorize_entities()
        
        return {
            "complexity_score": complexity_score,
            "total_entities": len(self._entity_reg.entities),
            "total_areas": len(self._area_reg.areas),
            "total_devices": len(self._device_reg.devices),
            "areas": {
                area_id: {
                    "name": area_info.name,
                    "entity_count": len(area_info.entities),
                    "device_count": area_info.device_count,
                    "entities": area_info.entities
                }
                for area_id, area_info in areas.items()
            },
            "entity_categories": {
                category: len(entities)
                for category, entities in categories.items()
            },
            "unassigned_entity_count": len(entity_groups.get("unassigned", []))
        }