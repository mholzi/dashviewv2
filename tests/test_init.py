"""Test the Dashview V2 component initialization."""
import pytest
from unittest.mock import Mock, patch
from homeassistant.core import HomeAssistant
from homeassistant.setup import async_setup_component


@pytest.fixture
def mock_hass():
    """Create a mock Home Assistant instance."""
    hass = Mock(spec=HomeAssistant)
    hass.http = Mock()
    hass.http.register_static_path = Mock()
    hass.components = Mock()
    hass.components.frontend = Mock()
    hass.components.frontend.async_register_built_in_panel = Mock()
    hass.config = Mock()
    hass.config.path = Mock(return_value="custom_components/dashview_v2/frontend/dist")
    hass.data = {"frontend_panels": {}}
    return hass


@pytest.mark.asyncio
async def test_setup(mock_hass):
    """Test component setup."""
    with patch('custom_components.dashview_v2.HomeAssistant', Mock), \
         patch('custom_components.dashview_v2.backend.api.register_websocket_commands') as mock_register_ws:
        from custom_components.dashview_v2 import async_setup
        
        result = await async_setup(mock_hass, {})
        assert result is True
        
        # Verify WebSocket commands were registered
        mock_register_ws.assert_called_once_with(mock_hass)
        
        # Verify static path was registered
        mock_hass.http.register_static_path.assert_called_once_with(
            "/dashview_v2-dashboard",
            "custom_components/dashview_v2/frontend/dist",
            True
        )
        
        # Verify panel was registered
        mock_hass.components.frontend.async_register_built_in_panel.assert_called_once()


@pytest.mark.asyncio
async def test_panel_config(mock_hass):
    """Test panel configuration."""
    with patch('custom_components.dashview_v2.HomeAssistant', Mock), \
         patch('custom_components.dashview_v2.backend.api.register_websocket_commands'):
        from custom_components.dashview_v2 import async_setup
        
        await async_setup(mock_hass, {})
        
        # Get the call arguments for panel registration
        call_args = mock_hass.components.frontend.async_register_built_in_panel.call_args
        kwargs = call_args.kwargs
        
        # Verify panel configuration
        assert kwargs["component_name"] == "custom"
        assert kwargs["sidebar_title"] == "Dashview V2"
        assert kwargs["sidebar_icon"] == "mdi:view-dashboard"
        assert kwargs["frontend_url_path"] == "dashview-v2"
        assert kwargs["require_admin"] is False
        
        # Verify custom panel config
        panel_config = kwargs["config"]["_panel_custom"]
        assert panel_config["name"] == "dashview-v2-dashboard"
        assert panel_config["module_url"] == "/dashview_v2-dashboard/dashview-v2.js"
        assert panel_config["embed_iframe"] is False
        assert panel_config["trust_external"] is False


@pytest.mark.asyncio
async def test_constants_imported():
    """Test that constants are properly imported and used."""
    from custom_components.dashview_v2.const import (
        DASHBOARD_NAME,
        DASHBOARD_URL,
        DOMAIN,
        PANEL_ICON,
        PANEL_TITLE,
        VERSION,
    )
    
    assert DOMAIN == "dashview_v2"
    assert VERSION == "0.2.0"
    assert DASHBOARD_URL == "/dashview_v2-dashboard"
    assert DASHBOARD_NAME == "dashview-v2-dashboard"
    assert PANEL_TITLE == "Dashview V2"
    assert PANEL_ICON == "mdi:view-dashboard"