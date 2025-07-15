"""
Integration tests for Dashview V2.
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch
import asyncio
from datetime import datetime
from custom_components.dashview_v2.backend.intelligence.analyzer import EntityAnalyzer
from custom_components.dashview_v2.backend.intelligence.entity_mapper import EntityMapper
from custom_components.dashview_v2.backend.api.subscriptions import SubscriptionManager
from custom_components.dashview_v2.backend.api.handlers import (
    handle_subscribe_visible_entities,
    handle_get_area_entities
)


class TestDashviewIntegration:
    """Integration tests for complete workflows."""
    
    @pytest.mark.asyncio
    async def test_dashboard_initialization_flow(self, mock_hass):
        """Test complete dashboard initialization flow."""
        # 1. Analyze home
        analyzer = EntityAnalyzer(mock_hass)
        areas = analyzer.analyze_areas()
        complexity_score = analyzer.calculate_complexity_score()
        
        assert len(areas) > 0
        assert 1 <= complexity_score <= 10
        
        # 2. Map entity relationships
        mapper = EntityMapper(mock_hass)
        relationships = mapper.map_entity_relationships()
        
        assert len(relationships) > 0
        
        # 3. Get area entities via WebSocket
        mock_ws = AsyncMock()
        mock_ws.send_json = AsyncMock()
        
        msg = {
            "id": 1,
            "type": "dashview/get_area_entities"
        }
        
        with patch('custom_components.dashview_v2.backend.api.handlers.EntityAnalyzer', return_value=analyzer):
            await handle_get_area_entities(mock_hass, mock_ws, msg)
        
        mock_ws.send_json.assert_called_once()
        response = mock_ws.send_json.call_args[0][0]
        assert response["success"] is True
        assert "result" in response
    
    @pytest.mark.asyncio
    async def test_subscription_flow(self, mock_hass):
        """Test entity subscription flow."""
        # 1. Set up subscription manager
        sub_manager = SubscriptionManager(mock_hass)
        
        # 2. Add connection
        mock_ws = AsyncMock()
        connection_id = await sub_manager.add_connection(mock_ws)
        
        # 3. Subscribe to visible entities
        msg = {
            "id": 2,
            "type": "dashview/subscribe_visible_entities",
            "entity_ids": ["light.living_room", "sensor.temperature"]
        }
        
        with patch('custom_components.dashview_v2.backend.api.handlers.subscription_manager', sub_manager):
            await handle_subscribe_visible_entities(mock_hass, mock_ws, msg)
        
        # Check subscriptions were added
        assert "light.living_room" in sub_manager.connections[connection_id].subscribed_entities
        assert "sensor.temperature" in sub_manager.connections[connection_id].subscribed_entities
        
        # 4. Simulate state change
        new_state = Mock(
            entity_id="light.living_room",
            state="on",
            attributes={"brightness": 255}
        )
        
        await sub_manager.notify_entity_update("light.living_room", new_state)
        
        # Check notification was sent
        assert mock_ws.send_json.call_count >= 2  # Response + notification
    
    @pytest.mark.asyncio
    async def test_widget_lifecycle(self, mock_hass):
        """Test widget lifecycle from creation to updates."""
        # 1. Analyze areas
        analyzer = EntityAnalyzer(mock_hass)
        mapper = EntityMapper(mock_hass)
        
        areas = analyzer.analyze_areas()
        living_room = next((a for a in areas if a.name == "Living Room"), None)
        
        assert living_room is not None
        
        # 2. Get entities for widget
        area_entities = analyzer.group_entities_by_area().get(living_room.area_id, [])
        assert len(area_entities) > 0
        
        # 3. Suggest widget type
        widget_type = mapper.suggest_widget_type(area_entities)
        assert widget_type == "room"  # Should suggest room widget for area
        
        # 4. Create widget config
        widget_config = {
            "type": widget_type,
            "title": living_room.name,
            "entities": area_entities,
            "areaId": living_room.area_id
        }
        
        # 5. Subscribe to widget entities
        sub_manager = SubscriptionManager(mock_hass)
        mock_ws = AsyncMock()
        connection_id = await sub_manager.add_connection(mock_ws)
        
        result = await sub_manager.subscribe_to_entities(connection_id, area_entities)
        assert all(result.values())  # All subscriptions successful
    
    @pytest.mark.asyncio
    async def test_performance_under_load(self, mock_hass):
        """Test system performance with many entities."""
        # Create many entities
        many_entities = []
        for i in range(500):
            entity = Mock(
                entity_id=f"sensor.test_{i}",
                state=str(i),
                attributes={"friendly_name": f"Test Sensor {i}"},
                last_changed=datetime.now(),
                last_updated=datetime.now()
            )
            many_entities.append(entity)
        
        mock_hass.states.async_all.return_value = many_entities
        
        # Test analyzer performance
        analyzer = EntityAnalyzer(mock_hass)
        
        import time
        start = time.time()
        
        analysis = analyzer.analyze_entities()
        areas = analyzer.analyze_areas()
        complexity = analyzer.calculate_complexity_score()
        
        end = time.time()
        
        assert analysis["total_entities"] == 500
        assert complexity >= 7  # Should be high complexity
        assert (end - start) < 1.0  # Should complete within 1 second
        
        # Test subscription performance
        sub_manager = SubscriptionManager(mock_hass)
        
        # Add multiple connections
        connections = []
        for i in range(10):
            ws = AsyncMock()
            conn_id = await sub_manager.add_connection(ws)
            connections.append((conn_id, ws))
        
        # Subscribe each to subset of entities
        start = time.time()
        
        for i, (conn_id, ws) in enumerate(connections):
            # Each connection subscribes to 50 entities
            entity_ids = [f"sensor.test_{j}" for j in range(i*50, (i+1)*50)]
            await sub_manager.subscribe_to_entities(conn_id, entity_ids)
        
        end = time.time()
        
        assert (end - start) < 0.5  # Should handle subscriptions quickly
        
        # Test state updates
        start = time.time()
        
        # Update 100 entities
        for i in range(100):
            new_state = Mock(
                entity_id=f"sensor.test_{i}",
                state=str(i + 1000)
            )
            await sub_manager.notify_entity_update(f"sensor.test_{i}", new_state)
        
        end = time.time()
        
        assert (end - start) < 1.0  # Should handle updates efficiently