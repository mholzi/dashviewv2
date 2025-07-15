"""The Dashview V2 integration."""
import logging

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.typing import ConfigType

from .backend.api import register_websocket_commands
from .const import (
    DASHBOARD_NAME,
    DASHBOARD_URL,
    DOMAIN,
    PANEL_ICON,
    PANEL_TITLE,
    VERSION,
)

_LOGGER = logging.getLogger(__name__)


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up the Dashview V2 component from configuration.yaml."""
    _LOGGER.info(f"Setting up Dashview V2 component v{VERSION}")
    
    # If there's a config entry, let that handle the setup
    if hass.config_entries.async_entries(DOMAIN):
        return True
    
    # Import configuration if specified in configuration.yaml
    if DOMAIN in config:
        hass.async_create_task(
            hass.config_entries.flow.async_init(
                DOMAIN,
                context={"source": "import"},
                data={},
            )
        )
    
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Dashview V2 from a config entry."""
    _LOGGER.info(f"Setting up Dashview V2 from config entry v{VERSION}")
    
    # Initialize the integration data
    hass.data.setdefault(DOMAIN, {})
    
    # Register WebSocket commands
    await register_websocket_commands(hass)
    _LOGGER.info("Registered WebSocket commands")
    
    # Register the static path for serving the frontend build
    hass.http.register_static_path(
        DASHBOARD_URL,
        hass.config.path("custom_components/dashview_v2/panel"),
        True
    )
    _LOGGER.debug(f"Registered static path: {DASHBOARD_URL}")
    
    # Register the dashboard in the sidebar
    hass.components.frontend.async_register_built_in_panel(
        component_name="custom",
        sidebar_title=PANEL_TITLE,
        sidebar_icon=PANEL_ICON,
        frontend_url_path="dashview-v2",
        config={
            "_panel_custom": {
                "name": DASHBOARD_NAME,
                "module_url": f"{DASHBOARD_URL}/dashview-v2-panel.js",
                "embed_iframe": False,
                "trust_external": False,
            }
        },
        require_admin=False,
    )
    
    _LOGGER.info("Dashview V2 dashboard registered successfully")
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    _LOGGER.info("Unloading Dashview V2")
    
    # Remove the panel
    hass.components.frontend.async_remove_panel("dashview-v2")
    
    # Clear data
    hass.data[DOMAIN].clear()
    
    return True