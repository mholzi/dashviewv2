"""The Dashview V2 integration."""
import logging

from homeassistant.core import HomeAssistant
from homeassistant.helpers.typing import ConfigType

from .const import (
    DOMAIN,
    PANEL_ICON,
    PANEL_NAME,
    PANEL_TITLE,
    PANEL_URL,
)

_LOGGER = logging.getLogger(__name__)


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up the Dashview V2 component."""
    _LOGGER.info("Setting up Dashview V2 component")
    
    # Register the static path for serving the panel JavaScript
    hass.http.register_static_path(
        PANEL_URL,
        hass.config.path("custom_components/dashview_v2/panel"),
        True
    )
    
    # Register the panel in the sidebar
    hass.components.frontend.async_register_built_in_panel(
        component_name="custom",
        sidebar_title=PANEL_TITLE,
        sidebar_icon=PANEL_ICON,
        frontend_url_path="dashview-v2",
        config={
            "_panel_custom": {
                "name": PANEL_NAME,
                "module_url": f"{PANEL_URL}/dashview-v2-panel.js",
                "embed_iframe": False,
                "trust_external": False,
            }
        },
        require_admin=False,
    )
    
    _LOGGER.info("Dashview V2 panel registered successfully")
    return True