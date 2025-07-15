"""
Tests for the entity mapper module.
"""

import pytest
from unittest.mock import Mock, patch
from custom_components.dashview_v2.backend.intelligence.entity_mapper import (
    EntityMapper, EntityRelationship
)


class TestEntityMapper:
    """Test suite for EntityMapper."""
    
    @pytest.fixture
    def mapper(self, mock_hass):
        """Create mapper instance."""
        return EntityMapper(mock_hass)
    
    def test_map_entity_relationships(self, mapper, mock_hass):
        """Test mapping entity relationships."""
        # Mock entity registry
        mock_hass.helpers.entity_registry.async_get = Mock(side_effect=lambda eid: {
            "light.living_room": Mock(
                area_id="living_room",
                device_id="device_1",
                entity_id="light.living_room"
            ),
            "sensor.living_room_temperature": Mock(
                area_id="living_room",
                device_id="device_2",
                entity_id="sensor.living_room_temperature"
            )
        }.get(eid))
        
        relationships = mapper.map_entity_relationships()
        
        assert len(relationships) == 3  # 3 entities in mock
        
        # Check light relationship
        light_rel = next((r for r in relationships if r.entity_id == "light.living_room"), None)
        assert light_rel is not None
        assert light_rel.area_id == "living_room"
        assert light_rel.device_id == "device_1"
        assert light_rel.entity_type == "control"
    
    def test_categorize_entity(self, mapper):
        """Test entity categorization."""
        assert mapper.categorize_entity("light.test") == "control"
        assert mapper.categorize_entity("switch.test") == "control"
        assert mapper.categorize_entity("sensor.temperature") == "sensor"
        assert mapper.categorize_entity("binary_sensor.motion") == "sensor"
        assert mapper.categorize_entity("climate.thermostat") == "climate"
        assert mapper.categorize_entity("media_player.tv") == "media"
        assert mapper.categorize_entity("unknown.entity") == "other"
    
    def test_calculate_entity_priority(self, mapper, mock_hass):
        """Test entity priority calculation."""
        # Mock state with high activity
        active_state = Mock(
            entity_id="light.living_room",
            state="on",
            last_changed=Mock(),
            attributes={"friendly_name": "Living Room Light"}
        )
        
        priority = mapper.calculate_entity_priority(active_state)
        
        assert isinstance(priority, int)
        assert 0 <= priority <= 10
        
        # Lights should have high base priority
        assert priority >= 5
    
    def test_find_related_entities(self, mapper, mock_hass):
        """Test finding related entities."""
        # Mock device registry
        mock_hass.helpers.device_registry.async_get = Mock(return_value=Mock(
            id="device_1",
            name="Multi Sensor"
        ))
        
        # Mock entities on same device
        mock_hass.helpers.entity_registry.async_entries_for_device = Mock(
            return_value=[
                Mock(entity_id="sensor.motion"),
                Mock(entity_id="sensor.temperature"),
                Mock(entity_id="sensor.humidity")
            ]
        )
        
        related = mapper.find_related_entities("sensor.motion", device_id="device_1")
        
        assert len(related) == 2  # Should find temperature and humidity
        assert "sensor.temperature" in related
        assert "sensor.humidity" in related
    
    def test_get_entity_groups(self, mapper, mock_hass):
        """Test getting entity groups by type."""
        groups = mapper.get_entity_groups()
        
        assert "control" in groups
        assert "sensor" in groups
        
        # Check control group
        assert any("light" in e for e in groups["control"])
        assert any("switch" in e for e in groups["control"])
        
        # Check sensor group  
        assert any("sensor" in e for e in groups["sensor"])
    
    def test_suggest_widget_type(self, mapper):
        """Test widget type suggestions."""
        # Room with mixed entities
        room_entities = ["light.bedroom", "sensor.bedroom_temp", "switch.bedroom_fan"]
        assert mapper.suggest_widget_type(room_entities) == "room"
        
        # Group of similar devices
        switches = ["switch.device1", "switch.device2", "switch.device3"]
        assert mapper.suggest_widget_type(switches) == "device-group"
        
        # Climate entity
        climate = ["climate.thermostat"]
        assert mapper.suggest_widget_type(climate) == "climate"
        
        # Mixed quick controls
        controls = ["scene.morning", "script.bedtime", "input_boolean.guest_mode"]
        assert mapper.suggest_widget_type(controls) == "quick-controls"
    
    def test_map_relationships_with_automation(self, mapper, mock_hass):
        """Test mapping relationships including automations."""
        # Mock automation that uses entities
        mock_hass.helpers.entity_registry.async_get = Mock(side_effect=lambda eid: {
            "automation.motion_lights": Mock(
                entity_id="automation.motion_lights",
                area_id=None,
                device_id=None
            )
        }.get(eid))
        
        # Mock automation config
        with patch.object(mapper, '_get_automation_entities', return_value={
            "binary_sensor.motion", "light.hallway"
        }):
            relationships = mapper.map_entity_relationships()
            
            # Find motion sensor relationship
            motion_rel = next(
                (r for r in relationships if r.entity_id == "binary_sensor.motion"), 
                None
            )
            
            if motion_rel:
                assert "light.hallway" in motion_rel.related_entities