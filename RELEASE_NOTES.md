# Release Notes - v0.2.5

## 🔧 Critical Compatibility Fix

This hotfix release resolves the integration setup error with Home Assistant 2025.7+ by updating the frontend panel registration API.

## 🐛 Bug Fixes

- **Frontend Panel Registration**: Fixed `AttributeError: 'HomeAssistant' object has no attribute 'components'` error
- **HA 2025.7+ Compatibility**: Updated to use direct imports from `homeassistant.components.frontend`
- **API Migration**: Changed from deprecated `hass.components.frontend` to proper function imports

## 🔄 Technical Details

The fix addresses the Home Assistant core deprecation where accessing frontend functions through `hass.components.frontend` was removed in favor of direct imports. This change:

1. **Maintains compatibility** with Home Assistant 2025.7+ while keeping the same functionality
2. **Follows current best practices** for Home Assistant integration development
3. **Preserves all existing features** including:
   - Custom panel registration in the sidebar
   - Static path serving for frontend assets
   - Proper cleanup on component unload
   - WebSocket command registration

## 📦 Installation

### HACS (Recommended)
1. Update to the latest version in HACS
2. Restart Home Assistant

### Manual
1. Download the source code from the assets below
2. Extract `custom_components/dashview_v2` to your config directory
3. Restart Home Assistant

## 🔧 Requirements
- Home Assistant 2025.7 or newer
- Previous installations will be automatically updated

## ⚠️ Important Notes
- This is a **critical update** for users running Home Assistant 2025.7 or later
- The integration will fail to load without this fix on newer HA versions
- No configuration changes required - update and restart

## 🙏 Thanks
Thanks to all users who reported this compatibility issue and helped with testing!