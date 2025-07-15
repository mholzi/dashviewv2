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

SUBSCRIBE_VISIBLE_ENTITIES_SCHEMA = websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/subscribe_visible_entities",
        vol.Required("entities"): [str],
    }
)

UNSUBSCRIBE_HIDDEN_ENTITIES_SCHEMA = websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/unsubscribe_hidden_entities",
        vol.Required("entities"): [str],
    }
)

GET_AREA_ENTITIES_SCHEMA = websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/get_area_entities",
        vol.Optional("area_id"): str,
    }
)

UPDATE_SUBSCRIPTIONS_SCHEMA = websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/update_subscriptions",
        vol.Required("entities"): [str],
    }
)

# List of all WebSocket commands
WEBSOCKET_COMMANDS = [
    {
        "command": f"{DOMAIN}/get_home_info",
        "handler": "handle_get_home_info",
        "schema": GET_HOME_INFO_SCHEMA,
    },
    {
        "command": f"{DOMAIN}/subscribe_visible_entities",
        "handler": "handle_subscribe_visible_entities",
        "schema": SUBSCRIBE_VISIBLE_ENTITIES_SCHEMA,
    },
    {
        "command": f"{DOMAIN}/unsubscribe_hidden_entities",
        "handler": "handle_unsubscribe_hidden_entities",
        "schema": UNSUBSCRIBE_HIDDEN_ENTITIES_SCHEMA,
    },
    {
        "command": f"{DOMAIN}/get_area_entities",
        "handler": "handle_get_area_entities",
        "schema": GET_AREA_ENTITIES_SCHEMA,
    },
    {
        "command": f"{DOMAIN}/update_subscriptions",
        "handler": "handle_update_subscriptions",
        "schema": UPDATE_SUBSCRIPTIONS_SCHEMA,
    },
]