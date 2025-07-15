"""Subscription manager for Dashview V2 WebSocket connections."""

import logging
from typing import Dict, List, Set, Optional, Any
from collections import defaultdict
import asyncio

from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.event import async_track_state_change_event
from homeassistant.const import EVENT_STATE_CHANGED

_LOGGER = logging.getLogger(__name__)


class SubscriptionManager:
    """Manages entity subscriptions for dashboard connections."""
    
    def __init__(self, hass: HomeAssistant):
        """Initialize the subscription manager."""
        self.hass = hass
        self._subscriptions: Dict[str, Set[str]] = defaultdict(set)  # connection_id -> entity_ids
        self._entity_listeners: Dict[str, Set[str]] = defaultdict(set)  # entity_id -> connection_ids
        self._connection_handlers: Dict[str, Any] = {}  # connection_id -> send_message function
        self._unsubscribe_handlers: Dict[str, List[Any]] = defaultdict(list)  # connection_id -> unsubscribe functions
        self._lock = asyncio.Lock()
    
    async def register_connection(self, connection_id: str, send_message_handler: Any) -> None:
        """
        Register a new connection for subscription management.
        
        Args:
            connection_id: Unique identifier for the connection
            send_message_handler: Function to send messages to this connection
        """
        async with self._lock:
            self._connection_handlers[connection_id] = send_message_handler
            _LOGGER.debug(f"Registered connection: {connection_id}")
    
    async def unregister_connection(self, connection_id: str) -> None:
        """
        Unregister a connection and clean up its subscriptions.
        
        Args:
            connection_id: Connection to unregister
        """
        async with self._lock:
            # Cancel all subscriptions for this connection
            if connection_id in self._unsubscribe_handlers:
                for unsubscribe in self._unsubscribe_handlers[connection_id]:
                    unsubscribe()
                del self._unsubscribe_handlers[connection_id]
            
            # Remove from entity listeners
            if connection_id in self._subscriptions:
                for entity_id in self._subscriptions[connection_id]:
                    self._entity_listeners[entity_id].discard(connection_id)
                    if not self._entity_listeners[entity_id]:
                        del self._entity_listeners[entity_id]
                del self._subscriptions[connection_id]
            
            # Remove connection handler
            if connection_id in self._connection_handlers:
                del self._connection_handlers[connection_id]
            
            _LOGGER.debug(f"Unregistered connection: {connection_id}")
    
    async def subscribe_to_entities(
        self, 
        connection_id: str, 
        entity_ids: List[str]
    ) -> Dict[str, bool]:
        """
        Subscribe connection to specified entities.
        
        Args:
            connection_id: Connection making the subscription
            entity_ids: List of entity IDs to subscribe to
            
        Returns:
            Dictionary mapping entity_id to subscription success
        """
        results = {}
        
        async with self._lock:
            if connection_id not in self._connection_handlers:
                _LOGGER.warning(f"Connection {connection_id} not registered")
                return {entity_id: False for entity_id in entity_ids}
            
            new_entities = []
            for entity_id in entity_ids:
                # Check if entity exists
                if not self.hass.states.get(entity_id):
                    results[entity_id] = False
                    _LOGGER.warning(f"Entity {entity_id} not found")
                    continue
                
                # Add to subscriptions
                if entity_id not in self._subscriptions[connection_id]:
                    self._subscriptions[connection_id].add(entity_id)
                    self._entity_listeners[entity_id].add(connection_id)
                    new_entities.append(entity_id)
                    results[entity_id] = True
                else:
                    results[entity_id] = True  # Already subscribed
            
            # Set up state change listener for new entities
            if new_entities:
                @callback
                def state_changed(event):
                    """Handle state changes for subscribed entities."""
                    entity_id = event.data.get("entity_id")
                    if entity_id not in self._entity_listeners:
                        return
                    
                    new_state = event.data.get("new_state")
                    old_state = event.data.get("old_state")
                    
                    # Send update to all connections subscribed to this entity
                    for conn_id in self._entity_listeners[entity_id]:
                        if conn_id in self._connection_handlers:
                            handler = self._connection_handlers[conn_id]
                            self.hass.async_create_task(
                                handler({
                                    "type": "event",
                                    "event": {
                                        "event_type": "state_changed",
                                        "entity_id": entity_id,
                                        "old_state": old_state.as_dict() if old_state else None,
                                        "new_state": new_state.as_dict() if new_state else None
                                    }
                                })
                            )
                
                # Track state changes for new entities
                unsubscribe = async_track_state_change_event(
                    self.hass,
                    new_entities,
                    state_changed
                )
                self._unsubscribe_handlers[connection_id].append(unsubscribe)
        
        _LOGGER.debug(f"Connection {connection_id} subscribed to {len(new_entities)} new entities")
        return results
    
    async def unsubscribe_from_entities(
        self, 
        connection_id: str, 
        entity_ids: List[str]
    ) -> Dict[str, bool]:
        """
        Unsubscribe connection from specified entities.
        
        Args:
            connection_id: Connection making the unsubscription
            entity_ids: List of entity IDs to unsubscribe from
            
        Returns:
            Dictionary mapping entity_id to unsubscription success
        """
        results = {}
        
        async with self._lock:
            if connection_id not in self._subscriptions:
                return {entity_id: False for entity_id in entity_ids}
            
            for entity_id in entity_ids:
                if entity_id in self._subscriptions[connection_id]:
                    self._subscriptions[connection_id].discard(entity_id)
                    self._entity_listeners[entity_id].discard(connection_id)
                    
                    # Clean up empty entity listener sets
                    if not self._entity_listeners[entity_id]:
                        del self._entity_listeners[entity_id]
                    
                    results[entity_id] = True
                else:
                    results[entity_id] = False  # Wasn't subscribed
        
        _LOGGER.debug(f"Connection {connection_id} unsubscribed from {sum(results.values())} entities")
        return results
    
    async def get_active_subscriptions(self, connection_id: Optional[str] = None) -> Dict[str, Set[str]]:
        """
        Get active subscriptions.
        
        Args:
            connection_id: Optional connection ID to get subscriptions for
            
        Returns:
            Dictionary of connection_id -> set of entity_ids
        """
        async with self._lock:
            if connection_id:
                return {connection_id: self._subscriptions.get(connection_id, set())}
            else:
                return dict(self._subscriptions)
    
    async def get_entity_listeners(self, entity_id: str) -> Set[str]:
        """
        Get all connections listening to a specific entity.
        
        Args:
            entity_id: Entity to check
            
        Returns:
            Set of connection IDs subscribed to this entity
        """
        async with self._lock:
            return self._entity_listeners.get(entity_id, set()).copy()
    
    async def update_subscriptions(
        self, 
        connection_id: str, 
        new_entity_ids: List[str]
    ) -> Dict[str, Any]:
        """
        Update subscriptions to match new entity list.
        
        This will subscribe to new entities and unsubscribe from removed ones.
        
        Args:
            connection_id: Connection to update
            new_entity_ids: New complete list of entity IDs
            
        Returns:
            Dictionary with 'subscribed', 'unsubscribed', and 'failed' lists
        """
        current_subscriptions = await self.get_active_subscriptions(connection_id)
        current_set = current_subscriptions.get(connection_id, set())
        new_set = set(new_entity_ids)
        
        # Determine changes
        to_subscribe = list(new_set - current_set)
        to_unsubscribe = list(current_set - new_set)
        
        # Perform updates
        subscribe_results = await self.subscribe_to_entities(connection_id, to_subscribe)
        unsubscribe_results = await self.unsubscribe_from_entities(connection_id, to_unsubscribe)
        
        return {
            "subscribed": [e for e, success in subscribe_results.items() if success],
            "unsubscribed": [e for e, success in unsubscribe_results.items() if success],
            "failed": [e for e, success in subscribe_results.items() if not success]
        }
    
    def get_subscription_stats(self) -> Dict[str, Any]:
        """
        Get statistics about current subscriptions.
        
        Returns:
            Dictionary with subscription statistics
        """
        total_subscriptions = sum(len(entities) for entities in self._subscriptions.values())
        
        return {
            "total_connections": len(self._connection_handlers),
            "total_subscriptions": total_subscriptions,
            "unique_entities_monitored": len(self._entity_listeners),
            "connections_per_entity": {
                entity_id: len(listeners)
                for entity_id, listeners in self._entity_listeners.items()
            } if len(self._entity_listeners) < 100 else "Too many to list",
            "subscriptions_per_connection": {
                conn_id: len(entities)
                for conn_id, entities in self._subscriptions.items()
            }
        }