"""Entity relationship mapper for Dashview V2."""

import logging
from typing import Dict, List, Set, Optional
from dataclasses import dataclass

from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry, entity_registry

_LOGGER = logging.getLogger(__name__)


@dataclass
class EntityRelationship:
    """Information about entity relationships."""
    entity_id: str
    area_id: Optional[str]
    device_id: Optional[str]
    related_entities: Set[str]
    entity_type: str
    priority: int  # 0-10 based on usage patterns


class EntityMapper:
    """Maps entity relationships and categorizes entities intelligently."""
    
    def __init__(self, hass: HomeAssistant):
        """Initialize the entity mapper."""
        self.hass = hass
        self._device_reg = device_registry.async_get(hass)
        self._entity_reg = entity_registry.async_get(hass)
    
    async def map_entity_relationships(self) -> Dict[str, EntityRelationship]:
        """
        Map relationships between entities.
        
        Returns:
            Dictionary mapping entity_id to EntityRelationship objects
        """
        relationships = {}
        
        for entity_id, entity in self._entity_reg.entities.items():
            related_entities = set()
            
            # Find entities from the same device
            if entity.device_id:
                for other_entity in self._entity_reg.entities.values():
                    if (other_entity.device_id == entity.device_id and 
                        other_entity.entity_id != entity_id):
                        related_entities.add(other_entity.entity_id)
            
            # Find entities with similar naming patterns (e.g., room prefixes)
            entity_name_parts = entity_id.split('.')
            if len(entity_name_parts) == 2:
                domain, name = entity_name_parts
                name_prefix = name.split('_')[0] if '_' in name else name
                
                for other_id in self._entity_reg.entities:
                    if other_id != entity_id and name_prefix in other_id:
                        related_entities.add(other_id)
            
            # Get area from entity or device
            area_id = entity.area_id
            if not area_id and entity.device_id:
                device = self._device_reg.devices.get(entity.device_id)
                if device:
                    area_id = device.area_id
            
            relationships[entity_id] = EntityRelationship(
                entity_id=entity_id,
                area_id=area_id,
                device_id=entity.device_id,
                related_entities=related_entities,
                entity_type=self.categorize_entity_type(entity_id),
                priority=self.calculate_entity_priority(entity_id)
            )
        
        return relationships
    
    def categorize_entity_type(self, entity_id: str) -> str:
        """
        Categorize entity by its type and function.
        
        Args:
            entity_id: The entity ID to categorize
            
        Returns:
            Category string (e.g., 'lighting', 'climate', 'security')
        """
        domain = entity_id.split('.')[0]
        name = entity_id.split('.')[1] if '.' in entity_id else ''
        
        # Domain-based categorization with name refinement
        if domain == 'light':
            return 'lighting'
        elif domain == 'switch':
            # Refine switches based on name
            if any(word in name.lower() for word in ['light', 'lamp', 'led']):
                return 'lighting'
            elif any(word in name.lower() for word in ['fan', 'vent']):
                return 'climate'
            elif any(word in name.lower() for word in ['plug', 'outlet', 'socket']):
                return 'power'
            return 'switch'
        elif domain == 'climate':
            return 'climate'
        elif domain in ['sensor', 'binary_sensor']:
            # Refine sensors based on name and attributes
            if any(word in name.lower() for word in ['temp', 'humidity', 'pressure']):
                return 'climate'
            elif any(word in name.lower() for word in ['motion', 'presence', 'occupancy']):
                return 'presence'
            elif any(word in name.lower() for word in ['door', 'window', 'lock']):
                return 'security'
            elif any(word in name.lower() for word in ['power', 'energy', 'current', 'voltage']):
                return 'energy'
            return 'sensor'
        elif domain in ['lock', 'alarm_control_panel', 'camera']:
            return 'security'
        elif domain in ['media_player', 'remote', 'tv']:
            return 'media'
        elif domain == 'cover':
            return 'cover'
        elif domain == 'fan':
            return 'climate'
        elif domain == 'vacuum':
            return 'cleaning'
        elif domain == 'scene':
            return 'scene'
        elif domain == 'script':
            return 'automation'
        elif domain == 'automation':
            return 'automation'
        elif domain == 'input_boolean':
            return 'control'
        elif domain == 'input_select':
            return 'control'
        elif domain == 'input_number':
            return 'control'
        else:
            return 'other'
    
    def calculate_entity_priority(self, entity_id: str) -> int:
        """
        Calculate entity priority based on domain and name patterns.
        
        Args:
            entity_id: The entity ID to calculate priority for
            
        Returns:
            Priority score 0-10 (10 being highest priority)
        """
        domain = entity_id.split('.')[0]
        name = entity_id.split('.')[1] if '.' in entity_id else ''
        
        # Start with base priority by domain
        priority_map = {
            'light': 8,
            'switch': 7,
            'climate': 8,
            'lock': 9,
            'alarm_control_panel': 10,
            'camera': 8,
            'media_player': 6,
            'scene': 7,
            'script': 5,
            'automation': 4,
            'sensor': 5,
            'binary_sensor': 6,
            'cover': 7,
            'fan': 6,
            'vacuum': 5,
        }
        
        base_priority = priority_map.get(domain, 3)
        
        # Boost priority for certain name patterns
        if any(word in name.lower() for word in ['main', 'primary', 'living', 'kitchen']):
            base_priority = min(10, base_priority + 1)
        
        # Boost priority for security-related entities
        if any(word in name.lower() for word in ['door', 'window', 'motion', 'alarm', 'security']):
            base_priority = min(10, base_priority + 1)
        
        # Lower priority for helper/utility entities
        if any(word in name.lower() for word in ['helper', 'utility', 'test', 'debug']):
            base_priority = max(0, base_priority - 2)
        
        return base_priority
    
    async def get_entity_groups_by_function(self) -> Dict[str, List[str]]:
        """
        Group entities by their functional type.
        
        Returns:
            Dictionary mapping function type to list of entity IDs
        """
        groups = {
            'lighting': [],
            'climate': [],
            'security': [],
            'media': [],
            'power': [],
            'presence': [],
            'energy': [],
            'cover': [],
            'scene': [],
            'automation': [],
            'control': [],
            'sensor': [],
            'other': []
        }
        
        for entity_id in self._entity_reg.entities:
            entity_type = self.categorize_entity_type(entity_id)
            if entity_type in groups:
                groups[entity_type].append(entity_id)
            else:
                groups['other'].append(entity_id)
        
        # Remove empty groups
        return {k: v for k, v in groups.items() if v}
    
    async def find_related_entities(self, entity_id: str, max_depth: int = 2) -> Set[str]:
        """
        Find entities related to a given entity.
        
        Args:
            entity_id: The entity to find relationships for
            max_depth: Maximum relationship depth to traverse
            
        Returns:
            Set of related entity IDs
        """
        if entity_id not in self._entity_reg.entities:
            return set()
        
        related = set()
        to_check = {entity_id}
        checked = set()
        current_depth = 0
        
        while to_check and current_depth < max_depth:
            next_check = set()
            
            for check_id in to_check:
                if check_id in checked:
                    continue
                
                checked.add(check_id)
                entity = self._entity_reg.entities.get(check_id)
                
                if not entity:
                    continue
                
                # Add entities from same device
                if entity.device_id:
                    for other_entity in self._entity_reg.entities.values():
                        if (other_entity.device_id == entity.device_id and 
                            other_entity.entity_id != check_id):
                            related.add(other_entity.entity_id)
                            if current_depth < max_depth - 1:
                                next_check.add(other_entity.entity_id)
                
                # Add entities with similar names
                name_parts = check_id.split('_')
                if len(name_parts) > 1:
                    prefix = name_parts[0]
                    for other_id in self._entity_reg.entities:
                        if other_id != check_id and prefix in other_id:
                            related.add(other_id)
            
            to_check = next_check
            current_depth += 1
        
        # Remove the original entity from results
        related.discard(entity_id)
        
        return related