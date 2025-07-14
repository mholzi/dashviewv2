"""WebSocket API module for Dashview V2."""

from .commands import WEBSOCKET_COMMANDS
from .handlers import register_websocket_commands

__all__ = ["WEBSOCKET_COMMANDS", "register_websocket_commands"]