# Release Notes - v0.2.6

## 🚀 What's New in v0.2.6

### 🐛 Critical Bug Fix
- **Fixed Empty Panel Issue**: Resolved the empty panel display by implementing proper Home Assistant panel wrapper
- **Panel Integration**: Added `DashviewV2Panel` class that Home Assistant can properly instantiate
- **Lifecycle Management**: Proper panel lifecycle with render, update, and destroy methods

### 🔧 Technical Improvements
- **Webpack Configuration**: Updated entry point to use new panel wrapper
- **Build System**: Clean build without TypeScript warnings (616KB total output)
- **Code Quality**: Fixed type imports and improved error handling

### 📝 Expected Behavior
After this fix, the Dashview v2 panel will display:
- Welcome screen with home statistics
- Info cards showing rooms, entities, areas, and complexity score
- Areas list with detected Home Assistant areas
- Proper error handling and loading states

### ⚠️ Breaking Changes
- None - This is a backward-compatible bug fix

## 📦 Installation

### HACS (Recommended)
1. Update to the latest version in HACS
2. Restart Home Assistant
3. The panel should now display content instead of being empty

### Manual
1. Download the source code
2. Extract `custom_components/dashview_v2` to your config directory
3. Restart Home Assistant

## 🔧 Requirements
- Home Assistant 2024.4.1 or newer
- Home Assistant 2025.7+ compatibility maintained

## 🔍 What Was Fixed
The empty panel issue was caused by Home Assistant's panel system expecting a class to instantiate, not just a registered custom element. The panel wrapper bridges this gap by:

1. Creating a container element with proper styling
2. Instantiating the `dashview-dashboard` custom element
3. Providing it with the `hass` object and configuration
4. Managing the complete element lifecycle

## 🙏 Thanks
Thanks to users who reported the empty panel issue and helped identify the root cause!