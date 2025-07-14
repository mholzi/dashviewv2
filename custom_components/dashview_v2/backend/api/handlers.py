"""WebSocket command handlers for Dashview V2."""

import logging
from typing import Any, Dict

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant
from homeassistant.helpers import area_registry, entity_registry

from ..intelligence.analyzer import HomeComplexityAnalyzer
from .commands import WEBSOCKET_COMMANDS

_LOGGER = logging.getLogger(__name__)


async def register_websocket_commands(hass: HomeAssistant) -> None:
    """Register all WebSocket commands."""
    for command_def in WEBSOCKET_COMMANDS:
        handler = globals()[command_def["handler"]]
        websocket_api.async_register_command(hass, command_def["schema"], handler)
        _LOGGER.info(f"Registered websocket command: {command_def['command']}")


@websocket_api.async_response
async def handle_get_home_info(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: Dict[str, Any],
) -> None:
    """Handle get_home_info command."""
    try:
        # Get registries
        area_reg = area_registry.async_get(hass)
        entity_reg = entity_registry.async_get(hass)
        
        # Get all areas
        areas = list(area_reg.areas.values())
        area_names = [area.name for area in areas if area.name]
        
        # Count entities
        entity_count = len(entity_reg.entities)
        
        # Count rooms (areas)
        room_count = len(areas)
        
        # Calculate complexity score
        analyzer = HomeComplexityAnalyzer(hass)
        complexity_score = await analyzer.calculate_complexity_score()
        
        # Build response
        result = {
            "roomCount": room_count,
            "entityCount": entity_count,
            "areas": area_names,
            "complexityScore": complexity_score,
        }
        
        connection.send_result(msg["id"], result)
        _LOGGER.debug(f"Sent home info: {result}")
        
    except Exception as err:
        _LOGGER.error(f"Error getting home info: {err}")
        connection.send_error(
            msg["id"],
            "error",
            f"Failed to get home info: {str(err)}",
        )