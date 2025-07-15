"""
Tests for the frontend state manager.
"""

import pytest
from unittest.mock import Mock, patch
from custom_components.dashview_v2.frontend.src.core.state_manager import (
    StateManager, StateDiff, StateUpdate
)


class TestStateManager:
    """Test suite for StateManager."""
    
    @pytest.fixture
    def manager(self):
        """Create state manager instance."""
        return StateManager()
    
    def test_initialize_from_hass(self, manager, mock_hass):
        """Test initializing from Home Assistant."""
        manager.initializeFromHass(mock_hass)
        
        # Should have states for all entities
        assert manager.getEntityState("light.living_room") is not None
        assert manager.getEntityState("sensor.living_room_temperature") is not None
        assert manager.getEntityState("switch.bedroom_fan") is not None
    
    def test_update_entity_state(self, manager):
        """Test updating entity state."""
        initial_state = {
            "entity_id": "light.test",
            "state": "off",
            "attributes": {"brightness": 0}
        }
        
        manager.updateEntityState("light.test", initial_state)
        
        # Update state
        new_state = {
            "entity_id": "light.test",
            "state": "on",
            "attributes": {"brightness": 255}
        }
        
        manager.updateEntityState("light.test", new_state)
        
        current = manager.getEntityState("light.test")
        assert current["state"] == "on"
        assert current["attributes"]["brightness"] == 255
    
    def test_compute_state_diff(self, manager):
        """Test computing state differences."""
        old_state = {
            "entity_id": "light.test",
            "state": "off",
            "attributes": {"brightness": 0, "color_mode": "rgb"}
        }
        
        new_state = {
            "entity_id": "light.test",
            "state": "on",
            "attributes": {"brightness": 255, "color_mode": "rgb"}
        }
        
        diff = manager.computeStateDiff("light.test", new_state, old_state)
        
        assert diff is not None
        assert diff["entityId"] == "light.test"
        assert diff["changes"]["state"]["old"] == "off"
        assert diff["changes"]["state"]["new"] == "on"
        assert diff["changes"]["attributes"]["brightness"]["old"] == 0
        assert diff["changes"]["attributes"]["brightness"]["new"] == 255
        assert "color_mode" not in diff["changes"]["attributes"]  # Unchanged
    
    def test_compute_state_diff_no_changes(self, manager):
        """Test computing diff with no changes."""
        state = {
            "entity_id": "light.test",
            "state": "on",
            "attributes": {"brightness": 255}
        }
        
        diff = manager.computeStateDiff("light.test", state, state)
        assert diff is None  # No changes
    
    def test_batch_update(self, manager):
        """Test batch updating multiple entities."""
        updates = [
            {
                "entityId": "light.a",
                "newState": {"state": "on", "attributes": {}}
            },
            {
                "entityId": "light.b",
                "newState": {"state": "off", "attributes": {}}
            },
            {
                "entityId": "sensor.c",
                "newState": {"state": "23.5", "attributes": {"unit": "°C"}}
            }
        ]
        
        # Mock requestAnimationFrame
        with patch('window.requestAnimationFrame', side_effect=lambda cb: cb()):
            manager.batchUpdate(updates)
            
            assert manager.getEntityState("light.a")["state"] == "on"
            assert manager.getEntityState("light.b")["state"] == "off"
            assert manager.getEntityState("sensor.c")["state"] == "23.5"
    
    def test_subscribe_to_entity(self, manager):
        """Test subscribing to entity changes."""
        callback_called = False
        received_diff = None
        
        def callback(diff):
            nonlocal callback_called, received_diff
            callback_called = True
            received_diff = diff
        
        # Subscribe
        unsubscribe = manager.subscribeToEntity("light.test", callback)
        
        # Update state
        old_state = {"state": "off", "attributes": {}}
        new_state = {"state": "on", "attributes": {}}
        
        manager.updateEntityState("light.test", old_state)
        manager.updateEntityState("light.test", new_state)
        
        assert callback_called
        assert received_diff is not None
        assert received_diff["entityId"] == "light.test"
        
        # Unsubscribe
        callback_called = False
        unsubscribe()
        
        # Update again - callback should not be called
        manager.updateEntityState("light.test", {"state": "off", "attributes": {}})
        assert not callback_called
    
    def test_subscribe_to_all(self, manager):
        """Test subscribing to all entity changes."""
        changes = []
        
        def callback(entity_id, diff):
            changes.append((entity_id, diff))
        
        unsubscribe = manager.subscribeToAll(callback)
        
        # Update multiple entities
        manager.updateEntityState("light.a", {"state": "off", "attributes": {}})
        manager.updateEntityState("light.a", {"state": "on", "attributes": {}})
        manager.updateEntityState("sensor.b", {"state": "20", "attributes": {}})
        manager.updateEntityState("sensor.b", {"state": "21", "attributes": {}})
        
        assert len(changes) == 2
        assert changes[0][0] == "light.a"
        assert changes[1][0] == "sensor.b"
        
        unsubscribe()
    
    def test_get_entities_by_area(self, manager, mock_hass):
        """Test getting entities by area."""
        # Initialize with mock data
        manager.initializeFromHass(mock_hass)
        
        # Mock area mapping
        with patch.object(manager, '_getEntityArea', side_effect=lambda eid: {
            "light.living_room": "living_room",
            "sensor.living_room_temperature": "living_room",
            "switch.bedroom_fan": "bedroom"
        }.get(eid)):
            living_room_entities = manager.getEntitiesByArea("living_room")
            bedroom_entities = manager.getEntitiesByArea("bedroom")
            
            assert len(living_room_entities) == 2
            assert len(bedroom_entities) == 1
            assert "light.living_room" in living_room_entities
            assert "switch.bedroom_fan" in bedroom_entities
    
    def test_clear(self, manager):
        """Test clearing all state."""
        # Add some state
        manager.updateEntityState("light.test", {"state": "on", "attributes": {}})
        manager.updateEntityState("sensor.test", {"state": "20", "attributes": {}})
        
        # Subscribe to verify callbacks are cleared
        callback_called = False
        
        def callback(diff):
            nonlocal callback_called
            callback_called = True
        
        manager.subscribeToEntity("light.test", callback)
        
        # Clear
        manager.clear()
        
        # Verify state is gone
        assert manager.getEntityState("light.test") is None
        assert manager.getEntityState("sensor.test") is None
        
        # Verify subscriptions are cleared
        manager.updateEntityState("light.test", {"state": "off", "attributes": {}})
        assert not callback_called