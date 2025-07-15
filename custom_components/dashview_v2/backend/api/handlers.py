"""WebSocket command handlers for Dashview V2."""

import logging
from typing import Any, Dict, Optional

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import area_registry, entity_registry

from ..intelligence.analyzer import HomeComplexityAnalyzer
from ..intelligence.entity_mapper import EntityMapper
from .commands import WEBSOCKET_COMMANDS
from .subscriptions import SubscriptionManager

_LOGGER = logging.getLogger(__name__)

# Global subscription manager instance
subscription_manager: Optional[SubscriptionManager] = None


async def register_websocket_commands(hass: HomeAssistant) -> None:
    """Register all WebSocket commands."""
    global subscription_manager
    
    # Initialize subscription manager
    subscription_manager = SubscriptionManager(hass)
    
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
    """Handle get_home_info command with area breakdown."""
    try:
        # Calculate comprehensive home complexity
        analyzer = HomeComplexityAnalyzer(hass)
        home_complexity = await analyzer.get_home_complexity()
        
        connection.send_result(msg["id"], home_complexity)
        _LOGGER.debug(f"Sent home info with {len(home_complexity['areas'])} areas")
        
    except Exception as err:
        _LOGGER.error(f"Error getting home info: {err}")
        connection.send_error(
            msg["id"],
            "error",
            f"Failed to get home info: {str(err)}",
        )


@websocket_api.async_response
async def handle_subscribe_visible_entities(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: Dict[str, Any],
) -> None:
    """Handle subscribing to visible entities."""
    try:
        entities = msg["entities"]
        connection_id = id(connection)
        
        # Register connection if not already registered
        await subscription_manager.register_connection(
            str(connection_id),
            lambda message: connection.send_message(message)
        )
        
        # Subscribe to entities
        results = await subscription_manager.subscribe_to_entities(
            str(connection_id),
            entities
        )
        
        connection.send_result(msg["id"], {
            "success": True,
            "subscribed": [e for e, success in results.items() if success],
            "failed": [e for e, success in results.items() if not success]
        })
        
        _LOGGER.debug(f"Connection {connection_id} subscribed to {sum(results.values())} entities")
        
    except Exception as err:
        _LOGGER.error(f"Error subscribing to entities: {err}")
        connection.send_error(
            msg["id"],
            "subscription_error",
            f"Failed to subscribe to entities: {str(err)}",
        )


@websocket_api.async_response
async def handle_unsubscribe_hidden_entities(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: Dict[str, Any],
) -> None:
    """Handle unsubscribing from hidden entities."""
    try:
        entities = msg["entities"]
        connection_id = str(id(connection))
        
        # Unsubscribe from entities
        results = await subscription_manager.unsubscribe_from_entities(
            connection_id,
            entities
        )
        
        connection.send_result(msg["id"], {
            "success": True,
            "unsubscribed": [e for e, success in results.items() if success],
            "failed": [e for e, success in results.items() if not success]
        })
        
        _LOGGER.debug(f"Connection {connection_id} unsubscribed from {sum(results.values())} entities")
        
    except Exception as err:
        _LOGGER.error(f"Error unsubscribing from entities: {err}")
        connection.send_error(
            msg["id"],
            "unsubscription_error",
            f"Failed to unsubscribe from entities: {str(err)}",
        )


@websocket_api.async_response
async def handle_get_area_entities(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: Dict[str, Any],
) -> None:
    """Handle getting entities grouped by area."""
    try:
        analyzer = HomeComplexityAnalyzer(hass)
        area_id = msg.get("area_id")
        
        if area_id:
            # Get entities for specific area
            entity_groups = await analyzer.group_entities_by_area()
            entities = entity_groups.get(area_id, [])
            
            connection.send_result(msg["id"], {
                "area_id": area_id,
                "entities": entities
            })
        else:
            # Get all entities grouped by area
            areas = await analyzer.analyze_areas()
            result = {}
            
            for area_id, area_info in areas.items():
                result[area_id] = {
                    "name": area_info.name,
                    "entities": area_info.entities,
                    "entity_count": len(area_info.entities),
                    "device_count": area_info.device_count
                }
            
            connection.send_result(msg["id"], result)
        
        _LOGGER.debug(f"Sent area entities")
        
    except Exception as err:
        _LOGGER.error(f"Error getting area entities: {err}")
        connection.send_error(
            msg["id"],
            "error",
            f"Failed to get area entities: {str(err)}",
        )


@websocket_api.async_response
async def handle_update_subscriptions(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: Dict[str, Any],
) -> None:
    """Handle updating subscriptions to match new entity list."""
    try:
        entities = msg["entities"]
        connection_id = str(id(connection))
        
        # Register connection if not already registered
        await subscription_manager.register_connection(
            connection_id,
            lambda message: connection.send_message(message)
        )
        
        # Update subscriptions
        results = await subscription_manager.update_subscriptions(
            connection_id,
            entities
        )
        
        connection.send_result(msg["id"], results)
        
        _LOGGER.debug(
            f"Updated subscriptions for {connection_id}: "
            f"{len(results['subscribed'])} added, {len(results['unsubscribed'])} removed"
        )
        
    except Exception as err:
        _LOGGER.error(f"Error updating subscriptions: {err}")
        connection.send_error(
            msg["id"],
            "update_error",
            f"Failed to update subscriptions: {str(err)}",
        )


@callback
def websocket_connection_closed(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
) -> None:
    """Handle WebSocket connection closed."""
    if subscription_manager:
        connection_id = str(id(connection))
        hass.async_create_task(
            subscription_manager.unregister_connection(connection_id)
        )
        _LOGGER.debug(f"WebSocket connection {connection_id} closed")