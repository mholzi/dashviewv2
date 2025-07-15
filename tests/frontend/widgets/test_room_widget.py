"""
Tests for the room widget component.
"""

import pytest
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime, timedelta
from custom_components.dashview_v2.frontend.src.widgets.room_widget import RoomWidget


class TestRoomWidget:
    """Test suite for RoomWidget."""
    
    @pytest.fixture
    def widget(self, mock_hass):
        """Create room widget instance."""
        widget = RoomWidget()
        widget.hass = mock_hass
        widget.widgetConfig = {
            "type": "room",
            "title": "Living Room",
            "entities": [
                "light.living_room",
                "sensor.living_room_temperature",
                "binary_sensor.living_room_motion"
            ]
        }
        widget.areaId = "living_room"
        widget.areaName = "Living Room"
        return widget
    
    def test_subscribed_entities_collapsed(self, widget):
        """Test subscribed entities when widget is collapsed."""
        widget.expanded = False
        widget.widgetConfig["entities"] = ["light.test"] * 15  # Many entities
        
        subscribed = widget.subscribedEntities()
        
        # Should only subscribe to key entities when collapsed with many entities
        assert len(subscribed) < 15
        assert all(any(key in e for key in ["motion", "door", "presence", "temperature", "humidity", "light."]) 
                  for e in subscribed)
    
    def test_subscribed_entities_expanded(self, widget):
        """Test subscribed entities when widget is expanded."""
        widget.expanded = True
        entities = ["light.test", "sensor.test", "switch.test"]
        widget.widgetConfig["entities"] = entities
        
        subscribed = widget.subscribedEntities()
        
        # Should subscribe to all entities when expanded
        assert subscribed == entities
    
    def test_update_summary(self, widget):
        """Test updating widget summary."""
        # Set up entity states
        widget.entityStates = {
            "light.living_room": Mock(
                entity_id="light.living_room",
                state="on",
                attributes={}
            ),
            "light.living_room_2": Mock(
                entity_id="light.living_room_2",
                state="off",
                attributes={}
            ),
            "sensor.living_room_temperature": Mock(
                entity_id="sensor.living_room_temperature",
                state="22.5",
                attributes={}
            ),
            "sensor.living_room_humidity": Mock(
                entity_id="sensor.living_room_humidity",
                state="45",
                attributes={}
            ),
            "binary_sensor.living_room_motion": Mock(
                entity_id="binary_sensor.living_room_motion",
                state="on",
                last_changed=datetime.now()
            )
        }
        
        widget.updateSummary()
        
        assert widget.lightCount == 2
        assert widget.lightsOn == 1
        assert widget.temperature == 22.5
        assert widget.humidity == 45
        assert widget.lastMotion is not None
    
    def test_render_summary(self, widget):
        """Test rendering summary information."""
        widget.lightCount = 3
        widget.lightsOn = 2
        widget.temperature = 21.5
        widget.humidity = 55
        widget.lastMotion = datetime.now() - timedelta(minutes=5)
        
        summary = widget.renderSummary()
        
        # Should have light status
        assert any("2/3" in str(s) for s in summary)
        
        # Should have temperature
        assert any("21.5°" in str(s) for s in summary)
        
        # Should have humidity
        assert any("55%" in str(s) for s in summary)
        
        # Should have motion time
        assert any("5m ago" in str(s) for s in summary)
    
    def test_get_sorted_entities(self, widget):
        """Test entity sorting by domain priority."""
        widget.entityStates = {
            "sensor.test": Mock(),
            "light.test": Mock(),
            "switch.test": Mock(),
            "climate.test": Mock(),
            "binary_sensor.test": Mock(),
        }
        
        sorted_entities = widget.getSortedEntities()
        
        # Check order - lights should come first
        assert sorted_entities[0] == "light.test"
        assert sorted_entities[1] == "switch.test"
        assert sorted_entities[-1] == "binary_sensor.test"
    
    @pytest.mark.asyncio
    async def test_turn_all_lights_off(self, widget, mock_hass):
        """Test turning all lights off."""
        widget.entityStates = {
            "light.living_room_1": Mock(
                entity_id="light.living_room_1",
                state="on"
            ),
            "light.living_room_2": Mock(
                entity_id="light.living_room_2",
                state="on"
            ),
            "light.living_room_3": Mock(
                entity_id="light.living_room_3",
                state="off"  # Already off
            ),
            "switch.living_room": Mock(
                entity_id="switch.living_room",
                state="on"  # Not a light
            )
        }
        
        # Mock turnOff method
        widget.turnOff = AsyncMock()
        
        await widget.turnAllLightsOff()
        
        # Should only turn off lights that are on
        assert widget.turnOff.call_count == 2
        widget.turnOff.assert_any_call("light.living_room_1")
        widget.turnOff.assert_any_call("light.living_room_2")
    
    def test_toggle_expanded(self, widget):
        """Test toggling expanded state."""
        widget.updateSubscriptions = Mock()
        
        # Initially collapsed
        widget.expanded = False
        
        widget.toggleExpanded()
        
        assert widget.expanded is True
        widget.updateSubscriptions.assert_called_once()
        
        # Toggle back
        widget.toggleExpanded()
        assert widget.expanded is False
    
    def test_render_entity(self, widget):
        """Test rendering individual entity."""
        state = Mock(
            entity_id="light.test",
            state="on",
            attributes={"friendly_name": "Test Light"}
        )
        widget.entityStates = {"light.test": state}
        
        rendered = widget.renderEntity("light.test")
        
        # Should render as string representation
        assert "Test Light" in str(rendered)
        assert "ha-switch" in str(rendered)  # Should have toggle
    
    def test_render_loading_state(self, widget):
        """Test rendering loading state."""
        widget.isLoading = True
        
        rendered = widget.render()
        
        assert "Loading room data" in str(rendered)
    
    def test_render_error_state(self, widget):
        """Test rendering error state."""
        widget.isLoading = False
        widget.error = "Failed to load room data"
        
        rendered = widget.render()
        
        assert "Failed to load room data" in str(rendered)