"""WebSocket command definitions for Dashview V2."""

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant

DOMAIN = "dashview_v2"

# Command schemas
GET_HOME_INFO_SCHEMA = websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/get_home_info",
    }
)

# List of all WebSocket commands
WEBSOCKET_COMMANDS = [
    {
        "command": f"{DOMAIN}/get_home_info",
        "handler": "handle_get_home_info",
        "schema": GET_HOME_INFO_SCHEMA,
    },
]