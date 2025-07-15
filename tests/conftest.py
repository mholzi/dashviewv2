"""
Pytest configuration and fixtures for Dashview V2 tests.
"""

import pytest
from unittest.mock import Mock, AsyncMock, MagicMock
from typing import Dict, Any, List
import asyncio
from datetime import datetime


@pytest.fixture
def mock_hass():
    """Mock Home Assistant instance."""
    hass = Mock()
    
    # Mock states
    hass.states = Mock()
    hass.states.async_all = Mock(return_value=[
        Mock(
            entity_id="light.living_room",
            state="on",
            attributes={
                "friendly_name": "Living Room Light",
                "brightness": 255,
                "color_mode": "brightness"
            },
            last_changed=datetime.now(),
            last_updated=datetime.now()
        ),
        Mock(
            entity_id="sensor.living_room_temperature",
            state="22.5",
            attributes={
                "friendly_name": "Living Room Temperature",
                "unit_of_measurement": "°C",
                "device_class": "temperature"
            }
        ),
        Mock(
            entity_id="switch.bedroom_fan",
            state="off",
            attributes={
                "friendly_name": "Bedroom Fan"
            }
        )
    ])
    
    # Mock services
    hass.services = Mock()
    hass.services.async_call = AsyncMock()
    
    # Mock areas
    hass.helpers = Mock()
    hass.helpers.area_registry = Mock()
    hass.helpers.area_registry.async_get_area = Mock(side_effect=lambda area_id: {
        "living_room": Mock(id="living_room", name="Living Room"),
        "bedroom": Mock(id="bedroom", name="Bedroom"),
        "kitchen": Mock(id="kitchen", name="Kitchen")
    }.get(area_id))
    
    hass.helpers.area_registry.async_list_areas = Mock(return_value=[
        Mock(id="living_room", name="Living Room"),
        Mock(id="bedroom", name="Bedroom"),
        Mock(id="kitchen", name="Kitchen")
    ])
    
    # Mock devices
    hass.helpers.device_registry = Mock()
    hass.helpers.entity_registry = Mock()
    
    return hass


@pytest.fixture
def mock_websocket_connection():
    """Mock WebSocket connection."""
    ws = Mock()
    ws.send_json = AsyncMock()
    ws.receive_json = AsyncMock()
    ws.close = AsyncMock()
    ws.closed = False
    return ws


@pytest.fixture
def sample_area_info():
    """Sample area information."""
    return {
        "area_id": "living_room",
        "name": "Living Room",
        "entities": ["light.living_room", "sensor.living_room_temperature"],
        "device_count": 2,
        "last_activity": datetime.now().timestamp()
    }


@pytest.fixture
def sample_entity_states():
    """Sample entity states."""
    return {
        "light.living_room": {
            "entity_id": "light.living_room",
            "state": "on",
            "attributes": {
                "friendly_name": "Living Room Light",
                "brightness": 255
            },
            "last_changed": "2024-01-01T12:00:00",
            "last_updated": "2024-01-01T12:00:00"
        },
        "sensor.temperature": {
            "entity_id": "sensor.temperature",
            "state": "22.5",
            "attributes": {
                "friendly_name": "Temperature",
                "unit_of_measurement": "°C"
            }
        }
    }


@pytest.fixture
def sample_widget_config():
    """Sample widget configuration."""
    return {
        "type": "room",
        "title": "Living Room",
        "entities": ["light.living_room", "sensor.living_room_temperature"],
        "position": {"x": 0, "y": 0, "width": 2, "height": 2}
    }


@pytest.fixture
def event_loop():
    """Create an event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def mock_performance_monitor():
    """Mock performance monitor."""
    monitor = Mock()
    monitor.measureRender = Mock(side_effect=lambda name, callback: callback())
    monitor.measureAsync = AsyncMock(side_effect=lambda name, callback: callback())
    monitor.trackEntityCount = Mock()
    monitor.trackWidgetCount = Mock()
    monitor.trackSubscriptionCount = Mock()
    return monitor