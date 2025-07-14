"""Test WebSocket API for Dashview V2."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from custom_components.dashview_v2.backend.api.handlers import (
    handle_get_home_info,
    register_websocket_commands,
)
from custom_components.dashview_v2.backend.intelligence.analyzer import (
    HomeComplexityAnalyzer,
)


@pytest.fixture
def mock_hass():
    """Create a mock Home Assistant instance."""
    hass = MagicMock()
    hass.components.websocket_api.async_register_command = MagicMock()
    return hass


@pytest.fixture
def mock_connection():
    """Create a mock WebSocket connection."""
    connection = MagicMock()
    connection.send_result = MagicMock()
    connection.send_error = MagicMock()
    return connection


@pytest.fixture
def mock_registries():
    """Create mock registries."""
    # Mock area registry
    area_reg = MagicMock()
    area_reg.areas = {
        "area1": MagicMock(name="Living Room"),
        "area2": MagicMock(name="Kitchen"),
        "area3": MagicMock(name="Bedroom"),
    }
    
    # Mock entity registry
    entity_reg = MagicMock()
    entity_reg.entities = {
        "entity1": MagicMock(entity_id="light.living_room"),
        "entity2": MagicMock(entity_id="switch.kitchen"),
        "entity3": MagicMock(entity_id="sensor.bedroom_temp"),
    }
    
    return area_reg, entity_reg


@pytest.mark.asyncio
async def test_register_websocket_commands(mock_hass):
    """Test WebSocket command registration."""
    await register_websocket_commands(mock_hass)
    
    # Check that command was registered
    assert mock_hass.components.websocket_api.async_register_command.called
    assert mock_hass.components.websocket_api.async_register_command.call_count == 1


@pytest.mark.asyncio
async def test_handle_get_home_info(mock_hass, mock_connection, mock_registries):
    """Test get_home_info WebSocket handler."""
    area_reg, entity_reg = mock_registries
    
    with patch("custom_components.dashview_v2.backend.api.handlers.area_registry.async_get", return_value=area_reg), \
         patch("custom_components.dashview_v2.backend.api.handlers.entity_registry.async_get", return_value=entity_reg), \
         patch.object(HomeComplexityAnalyzer, "calculate_complexity_score", return_value=7):
        
        msg = {"id": 1, "type": "dashview_v2/get_home_info"}
        await handle_get_home_info(mock_hass, mock_connection, msg)
        
        # Check that result was sent
        mock_connection.send_result.assert_called_once()
        call_args = mock_connection.send_result.call_args
        
        assert call_args[0][0] == 1  # Message ID
        result = call_args[0][1]
        
        assert result["roomCount"] == 3
        assert result["entityCount"] == 3
        assert set(result["areas"]) == {"Living Room", "Kitchen", "Bedroom"}
        assert result["complexityScore"] == 7


@pytest.mark.asyncio
async def test_handle_get_home_info_error(mock_hass, mock_connection):
    """Test error handling in get_home_info."""
    with patch("custom_components.dashview_v2.backend.api.handlers.area_registry.async_get", side_effect=Exception("Test error")):
        msg = {"id": 1, "type": "dashview_v2/get_home_info"}
        await handle_get_home_info(mock_hass, mock_connection, msg)
        
        # Check that error was sent
        mock_connection.send_error.assert_called_once()
        call_args = mock_connection.send_error.call_args
        
        assert call_args[0][0] == 1  # Message ID
        assert call_args[0][1] == "error"
        assert "Test error" in call_args[0][2]


def test_home_complexity_analyzer_init(mock_hass, mock_registries):
    """Test HomeComplexityAnalyzer initialization."""
    area_reg, entity_reg = mock_registries
    
    with patch("custom_components.dashview_v2.backend.intelligence.analyzer.area_registry.async_get", return_value=area_reg), \
         patch("custom_components.dashview_v2.backend.intelligence.analyzer.entity_registry.async_get", return_value=entity_reg), \
         patch("custom_components.dashview_v2.backend.intelligence.analyzer.device_registry.async_get"):
        
        analyzer = HomeComplexityAnalyzer(mock_hass)
        assert analyzer.hass == mock_hass
        assert analyzer._area_reg == area_reg
        assert analyzer._entity_reg == entity_reg


@pytest.mark.asyncio
async def test_complexity_score_calculation(mock_hass, mock_registries):
    """Test complexity score calculation."""
    area_reg, entity_reg = mock_registries
    
    # Mock device registry
    device_reg = MagicMock()
    device_reg.devices = {f"device{i}": MagicMock() for i in range(15)}
    
    with patch("custom_components.dashview_v2.backend.intelligence.analyzer.area_registry.async_get", return_value=area_reg), \
         patch("custom_components.dashview_v2.backend.intelligence.analyzer.entity_registry.async_get", return_value=entity_reg), \
         patch("custom_components.dashview_v2.backend.intelligence.analyzer.device_registry.async_get", return_value=device_reg):
        
        analyzer = HomeComplexityAnalyzer(mock_hass)
        
        # Mock entity domains
        with patch.object(analyzer, "_get_entity_domains", return_value={"light", "switch", "sensor"}):
            score = await analyzer.calculate_complexity_score()
            
            # With 3 entities, 3 areas, 15 devices, and 3 domains
            # Expected: 1 (entities) + 1 (areas) + 1 (devices) + 1 (domains) = 4
            assert score == 4