"""
Tests for the subscription manager.
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch
import asyncio
from custom_components.dashview_v2.backend.api.subscriptions import (
    SubscriptionManager, ConnectionInfo
)


class TestSubscriptionManager:
    """Test suite for SubscriptionManager."""
    
    @pytest.fixture
    def manager(self, mock_hass):
        """Create subscription manager instance."""
        return SubscriptionManager(mock_hass)
    
    @pytest.mark.asyncio
    async def test_add_connection(self, manager):
        """Test adding a new connection."""
        ws = Mock()
        connection_id = await manager.add_connection(ws)
        
        assert connection_id in manager.connections
        assert manager.connections[connection_id].websocket == ws
        assert len(manager.connections[connection_id].subscribed_entities) == 0
    
    @pytest.mark.asyncio
    async def test_remove_connection(self, manager):
        """Test removing a connection."""
        ws = Mock()
        connection_id = await manager.add_connection(ws)
        
        # Add some subscriptions
        await manager.subscribe_to_entities(connection_id, ["light.test", "sensor.test"])
        
        # Remove connection
        await manager.remove_connection(connection_id)
        
        assert connection_id not in manager.connections
        assert "light.test" not in manager.entity_subscriptions
        assert "sensor.test" not in manager.entity_subscriptions
    
    @pytest.mark.asyncio
    async def test_subscribe_to_entities(self, manager):
        """Test subscribing to entities."""
        ws = Mock()
        connection_id = await manager.add_connection(ws)
        
        entities = ["light.living_room", "sensor.temperature"]
        result = await manager.subscribe_to_entities(connection_id, entities)
        
        assert result["light.living_room"] is True
        assert result["sensor.temperature"] is True
        
        # Check internal state
        assert "light.living_room" in manager.connections[connection_id].subscribed_entities
        assert connection_id in manager.entity_subscriptions["light.living_room"]
    
    @pytest.mark.asyncio
    async def test_unsubscribe_from_entities(self, manager):
        """Test unsubscribing from entities."""
        ws = Mock()
        connection_id = await manager.add_connection(ws)
        
        # Subscribe first
        entities = ["light.living_room", "sensor.temperature"]
        await manager.subscribe_to_entities(connection_id, entities)
        
        # Unsubscribe from one
        result = await manager.unsubscribe_from_entities(connection_id, ["light.living_room"])
        
        assert result["light.living_room"] is True
        assert "light.living_room" not in manager.connections[connection_id].subscribed_entities
        assert "sensor.temperature" in manager.connections[connection_id].subscribed_entities
    
    @pytest.mark.asyncio
    async def test_update_subscriptions(self, manager):
        """Test updating subscriptions (add and remove in one call)."""
        ws = Mock()
        connection_id = await manager.add_connection(ws)
        
        # Initial subscriptions
        await manager.subscribe_to_entities(connection_id, ["light.a", "light.b"])
        
        # Update to different set
        result = await manager.update_subscriptions(connection_id, ["light.b", "light.c"])
        
        assert "light.a" in result["removed"]
        assert "light.c" in result["added"]
        assert "light.b" not in result["removed"]
        assert "light.b" not in result["added"]
        
        # Check final state
        subs = manager.connections[connection_id].subscribed_entities
        assert "light.a" not in subs
        assert "light.b" in subs
        assert "light.c" in subs
    
    @pytest.mark.asyncio
    async def test_notify_entity_update(self, manager, mock_hass):
        """Test notifying connections of entity updates."""
        ws = AsyncMock()
        connection_id = await manager.add_connection(ws)
        
        # Subscribe to entity
        await manager.subscribe_to_entities(connection_id, ["light.living_room"])
        
        # Create state update
        new_state = Mock(
            entity_id="light.living_room",
            state="on",
            attributes={"brightness": 255}
        )
        
        # Notify update
        await manager.notify_entity_update("light.living_room", new_state)
        
        # Check websocket was called
        ws.send_json.assert_called_once()
        call_args = ws.send_json.call_args[0][0]
        assert call_args["type"] == "entity_update"
        assert call_args["entity_id"] == "light.living_room"
        assert call_args["new_state"]["state"] == "on"
    
    @pytest.mark.asyncio
    async def test_notify_multiple_connections(self, manager, mock_hass):
        """Test notifying multiple connections."""
        ws1 = AsyncMock()
        ws2 = AsyncMock()
        
        conn1 = await manager.add_connection(ws1)
        conn2 = await manager.add_connection(ws2)
        
        # Both subscribe to same entity
        await manager.subscribe_to_entities(conn1, ["light.living_room"])
        await manager.subscribe_to_entities(conn2, ["light.living_room"])
        
        # Notify update
        new_state = Mock(entity_id="light.living_room", state="on")
        await manager.notify_entity_update("light.living_room", new_state)
        
        # Both should be notified
        assert ws1.send_json.called
        assert ws2.send_json.called
    
    @pytest.mark.asyncio
    async def test_connection_cleanup_on_error(self, manager):
        """Test connection cleanup when websocket fails."""
        ws = AsyncMock()
        ws.send_json.side_effect = Exception("Connection closed")
        
        connection_id = await manager.add_connection(ws)
        await manager.subscribe_to_entities(connection_id, ["light.test"])
        
        # Try to notify - should handle error and clean up
        new_state = Mock(entity_id="light.test", state="on")
        await manager.notify_entity_update("light.test", new_state)
        
        # Connection should be removed
        assert connection_id not in manager.connections
    
    @pytest.mark.asyncio
    async def test_get_connection_stats(self, manager):
        """Test getting connection statistics."""
        ws1 = Mock()
        ws2 = Mock()
        
        conn1 = await manager.add_connection(ws1)
        conn2 = await manager.add_connection(ws2)
        
        await manager.subscribe_to_entities(conn1, ["light.a", "light.b"])
        await manager.subscribe_to_entities(conn2, ["light.b", "light.c"])
        
        stats = manager.get_stats()
        
        assert stats["total_connections"] == 2
        assert stats["total_subscriptions"] == 4  # 2+2
        assert stats["unique_entities"] == 3  # a, b, c
        assert stats["avg_subscriptions_per_connection"] == 2.0